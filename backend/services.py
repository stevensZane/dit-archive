import os
import shutil
import zipfile
import subprocess
import uuid
from sqlalchemy.orm import Session
from database import Project, ProjectFile

# Configuration du nettoyage
BLACKLIST_DIRS = {'node_modules', '__pycache__', '.venv', '.git', '.vscode', 'dist', 'build'}
BLACKLIST_FILES = {'.DS_Store', '.env', 'thumbs.db'}

# --- 1. FONCTION RÉUTILISABLE : ENVOI VERS GITHUB ---
def upload_to_github(repo, local_folder_path, github_base_path, commit_message):
    """
    Parcourt un dossier local et envoie chaque fichier vers le repo GitHub d'archive.
    'repo' est l'objet PyGithub initialisé.
    """
    uploaded_files = []
    for root, _, files in os.walk(local_folder_path):
        for file in files:
            local_file_path = os.path.join(root, file)
            # Calcul du chemin relatif pour GitHub
            relative_path = os.path.relpath(local_file_path, local_folder_path)
            git_path = os.path.join(github_base_path, relative_path).replace("\\", "/")
            
            with open(local_file_path, "rb") as f:
                content = f.read()
                # On crée le fichier sur GitHub
                repo.create_file(path=git_path, message=commit_message, content=content, branch="main")
                uploaded_files.append(git_path)
    return uploaded_files

def sanitize_github_path(root_path, current_file_path):
    """
    Transforme un chemin local en chemin GitHub valide :
    - Remplace \ par /
    - Retire les préfixes inutiles
    - Nettoie les caractères interdits
    """
    # Calcul du chemin relatif
    relative_path = os.path.relpath(current_file_path, root_path)
    # Conversion Windows -> GitHub
    github_path = relative_path.replace("\\", "/")
    # Nettoyage des points de départ éventuels (ex: ./file -> file)
    github_path = github_path.lstrip("./")
    return github_path

def process_and_archive_project(project_id, db: Session, repo, zip_path=None, git_url=None, pdf_path=None):
    # 1. Récupération du projet
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project: 
        print(f"❌ Projet {project_id} introuvable en DB.")
        return

    job_id = str(uuid.uuid4())[:8]
    work_dir = os.path.abspath(f"temp_worker/{job_id}_{project_id}")
    os.makedirs(work_dir, exist_ok=True)

    total_size_bytes = 0

    try:
        # --- A. PRÉPARATION DU CHEMIN D'ARCHIVE ---
        # Nettoyage du titre pour le dossier GitHub
        clean_title = "".join(x for x in project.title if x.isalnum() or x in "._-").strip().replace(" ", "_")
        git_archive_root = f"archives/{project.academic_year.label}/{project.program.name.replace(' ', '_')}/{project.id}_{clean_title}"

        # --- B. TRAITEMENT DU RAPPORT PDF (UNE SEULE FOIS) ---
        if pdf_path and os.path.exists(pdf_path):
            file_size = os.path.getsize(pdf_path)
            
            # Limite API GitHub (25MB)
            if file_size <= 25 * 1024 * 1024:
                with open(pdf_path, "rb") as f:
                    pdf_content = f.read()
                    # Chemin propre pour GitHub
                    git_pdf_path = f"{git_archive_root}/rapport.pdf".replace("\\", "/")
                    
                    result = repo.create_file(
                        path=git_pdf_path, 
                        message=f"Nora: Archive Rapport PDF - Projet {project.id}", 
                        content=pdf_content, 
                        branch="main"
                    )
                    
                    # MISE À JOUR CRUCIALE ICI
                    # project.report_pdf_url = git_pdf_path
                    project.report_pdf_url = result['content'].download_url 
                    project.has_report = True
                    total_size_bytes += file_size
                    print(f"📄 Rapport PDF archivé : {git_pdf_path}")
            else:
                print(f"⚠️ Rapport PDF trop lourd ({file_size} bytes). Ignoré.")

        # --- C. ACQUISITION DU CODE SOURCE ---
        if git_url:
            sanitized_git_url = git_url.split("/tree/")[0].rstrip("/")
            subprocess.run(["git", "clone", "--depth", "1", sanitized_git_url, work_dir], check=True, capture_output=True)
            # Supprimer le dossier .git interne pour ne pas polluer l'archive
            shutil.rmtree(os.path.join(work_dir, ".git"), ignore_errors=True)
        elif zip_path:
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(work_dir)

        # --- D. UPLOAD RÉCURSIF DES FICHIERS DU CODE ---
        readme_content = ""
        BLACKLIST_DIRS = {'.git', '.github', 'node_modules', '__pycache__', '.venv', 'venv', '.next', 'dist', 'build'}
        BLACKLIST_FILES = {'.ds_store', '.env', 'thumbs.db', '.gitignore', '.gitattributes'}

        for root, dirs, files in os.walk(work_dir, topdown=True):
            dirs[:] = [d for d in dirs if d.lower() not in BLACKLIST_DIRS and not d.startswith('.')]
            
            for file in files:
                if file.lower() in BLACKLIST_FILES: continue
                
                full_path = os.path.join(root, file)
                file_size = os.path.getsize(full_path)
                
                if file_size > 25 * 1024 * 1024: continue 
                
                # On utilise ta fonction de sanitisation
                rel_path = sanitize_github_path(work_dir, full_path)
                final_git_path = f"{git_archive_root}/{rel_path}"

                # Capture du README pour l'IA
                if file.lower() == "readme.md" and not readme_content:
                    try:
                        with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                            readme_content = f.read(5000)
                    except: pass

                # Envoi à GitHub
                with open(full_path, "rb") as f:
                    content = f.read()
                    try:
                        repo.create_file(
                            path=final_git_path,
                            message=f"Nora: Sync {rel_path}",
                            content=content,
                            branch="main"
                        )
                        total_size_bytes += file_size
                    except Exception as upload_err:
                        print(f"⚠️ Erreur fichier {rel_path}: {upload_err}")

        # --- E. FINALISATION ---
        total_size_mb = round(total_size_bytes / (1024 * 1024), 2)
        
        project.readme_content = readme_content
        project.status = "archived"
        
        # Création du record de fichier pour le dashboard
        file_record = ProjectFile(
            project_id=project.id,
            file_name="Archive Complète (Code + Rapport)",
            github_path=git_archive_root,
            file_size=total_size_mb,
            is_cleaned=True
        )
        
        db.add(file_record)
        db.commit() # Un seul commit final pour tout valider
        print(f"✅ Archivage réussi pour ID {project.id} ({total_size_mb} MB)")

    except Exception as e:
        db.rollback()
        print(f"❌ Erreur critique Worker: {str(e)}")
        project.status = "error"
        db.commit()

    finally:
        # Nettoyage impitoyable des dossiers et fichiers temporaires
        shutil.rmtree(work_dir, ignore_errors=True)
        for temp_file in [zip_path, pdf_path]:
            if temp_file and os.path.exists(temp_file): 
                try: os.remove(temp_file)
                except: pass

# def process_and_archive_project(project_id, db, repo, zip_path=None, git_url=None, pdf_path=None):
#     project = db.query(Project).filter(Project.id == project_id).first()
#     if not project: return

#     job_id = str(uuid.uuid4())[:8]
#     work_dir = os.path.abspath(f"temp_worker/{job_id}_{project_id}")
#     os.makedirs(work_dir, exist_ok=True)

#     total_size_bytes = 0 # On suit la taille en octets pour plus de précision

#     try:
#         # --- A. PRÉPARATION DU CHEMIN D'ARCHIVE ---
#         clean_title = "".join(x for x in project.title if x.isalnum() or x in "._-").strip().replace(" ", "_")
#         git_archive_root = f"archives/{project.academic_year.label}/{project.program.name.replace(' ', '_')}/{project.id}_{clean_title}"

#         # --- B. TRAITEMENT DU RAPPORT PDF ---
#         if pdf_path and os.path.exists(pdf_path):
#             file_size = os.path.getsize(pdf_path)
#             # Limite API GitHub pour create_file (souvent 25MB)
#             if file_size <= 25 * 1024 * 1024:
#                 with open(pdf_path, "rb") as f:
#                     pdf_content = f.read()
#                     git_pdf_path = f"{git_archive_root}/rapport.pdf".replace("\\", "/")
                    
#                     repo.create_file(
#                         path=git_pdf_path, 
#                         message=f"Nora: Rapport PDF - Project {project.id}", 
#                         content=pdf_content, 
#                         branch="main"
#                     )
#                     project.report_pdf_url = git_pdf_path
#                     project.has_report = True
#                     total_size_bytes += file_size # Ajout à la taille totale
#             else:
#                 print(f"⚠️ Rapport PDF trop lourd ({file_size} bytes) pour l'API directe.")

#         # --- C. ACQUISITION DU CODE ---
#         if git_url:
#             # Nettoyage de l'URL pour éviter les trailing slashes ou /tree/
#             sanitized_git_url = git_url.split("/tree/")[0].rstrip("/")
#             subprocess.run(["git", "clone", "--depth", "1", sanitized_git_url, work_dir], check=True, capture_output=True)
#             shutil.rmtree(os.path.join(work_dir, ".git"), ignore_errors=True)
#         elif zip_path:
#             with zipfile.ZipFile(zip_path, 'r') as zip_ref:
#                 zip_ref.extractall(work_dir)

#         if pdf_path and os.path.exists(pdf_path):
#             with open(pdf_path, "rb") as f:
#                 pdf_content = f.read()
#                 git_pdf_path = f"{git_archive_root}/rapport.pdf".replace("\\", "/")
                
#                 # 1. Envoi à GitHub (déjà fait)
#                 repo.create_file(...) 
                
#                 # 2. ENREGISTREMENT EN BASE DE DONNÉES (AJOUT)
#                 project.report_pdf_url = git_pdf_path # On stocke le chemin exact
#                 db.commit() # On valide l'écritur

#         # --- D. NETTOYAGE & UPLOAD RÉCURSIF ---
#         readme_content = ""
        
#         BLACKLIST_DIRS = {'.git', '.github', 'node_modules', '__pycache__', '.venv', 'venv', '.next', 'dist', 'build'}
#         BLACKLIST_FILES = {'.ds_store', '.env', 'thumbs.db', '.gitignore', '.gitattributes'}

#         for root, dirs, files in os.walk(work_dir, topdown=True):
#             dirs[:] = [d for d in dirs if d.lower() not in BLACKLIST_DIRS and not d.startswith('.')]
            
#             for file in files:
#                 if file.lower() in BLACKLIST_FILES:
#                     continue
                
#                 full_path = os.path.join(root, file)
#                 file_size = os.path.getsize(full_path)
                
#                 # On ignore les fichiers trop gros pour l'API standard
#                 if file_size > 25 * 1024 * 1024: 
#                     print(f"⏩ Skip gros fichier: {file}")
#                     continue 
                
#                 rel_path = sanitize_github_path(work_dir, full_path)
#                 final_git_path = f"{git_archive_root}/{rel_path}"

#                 if file.lower() == "readme.md" and not readme_content:
#                     try:
#                         with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
#                             readme_content = f.read(5000)
#                     except: pass

#                 # Envoi du fichier
#                 with open(full_path, "rb") as f:
#                     content = f.read()
#                     try:
#                         repo.create_file(
#                             path=final_git_path,
#                             message=f"Nora: Sync {rel_path}",
#                             content=content,
#                             branch="main"
#                         )
#                         total_size_bytes += file_size
#                     except Exception as upload_err:
#                         print(f"⚠️ Erreur upload ({rel_path}): {upload_err}")

#         # --- E. FINALISATION ---
#         total_size_mb = round(total_size_bytes / (1024 * 1024), 2)
        
#         project.readme_content = readme_content
#         project.status = "archived"
#         # On peut stocker la taille directement sur le projet si tu as ajouté la colonne
#         # project.total_size = total_size_mb 
        
#         file_record = ProjectFile(
#             project_id=project.id,
#             file_name="Source Code (Cleaned)",
#             github_path=git_archive_root,
#             file_size=total_size_mb,
#             is_cleaned=True
#         )
#         db.add(file_record)
#         db.commit()
#         print(f"✅ Projet {project_id} archivé. Taille totale : {total_size_mb} MB")

#     except Exception as e:
#         db.rollback()
#         print(f"❌ Erreur Nora-Worker: {str(e)}")
#         project.status = "error"
#         db.commit()

#     finally:
#         shutil.rmtree(work_dir, ignore_errors=True)
#         for p in [zip_path, pdf_path]:
#             if p and os.path.exists(p): 
#                 try: os.remove(p)
#                 except: pass
