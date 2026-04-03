import requests
import base64
import os
import re
from database import SessionLocal, Project, ProjectFile, AcademicYear

def parse_github_url(url):
    """
    Extrait owner, repo, branch et subpath d'une URL GitHub
    Gère : https://github.com/user/repo/tree/main/folder/subfolder
    """
    pattern = r"https://github\.com/([^/]+)/([^/]+)(?:/tree/([^/]+)/(.+))?"
    match = re.match(pattern, url)
    if not match:
        return None, None, None, None
    
    owner, repo, branch, path = match.groups()
    return owner, repo, branch, path

def process_and_archive_project(project_id, repo_archive, git_url=None, pdf_path=None):
    # On crée une nouvelle session pour le worker (sécurité Thread)
    db = SessionLocal()
    # project = db.get(Project).get(project_id)
    project = db.get(Project, project_id)
    if not project:
        db.close()
        return

    try:
        headers = {"Authorization": f"token {os.getenv('GITHUB_TOKEN')}"}
        
        # --- A. EXTRACTION GITHUB ---
        if git_url:
            owner, repo_name, branch, sub_path = parse_github_url(git_url)
            repo_full_name = f"{owner}/{repo_name}"

            # 1. Récupérer le README (Même dans un sous-dossier)
            # Si sub_path existe, on cherche le README dedans, sinon on utilise l'endpoint /readme
            readme_url = f"https://api.github.com/repos/{repo_full_name}/readme"
            if sub_path:
                readme_url = f"https://api.github.com/repos/{repo_full_name}/contents/{sub_path}/README.md"
            
            res_readme = requests.get(readme_url, headers=headers)
            
            if res_readme.status_code == 200:
                content_b64 = res_readme.json().get('content', '')
                project.readme_content = base64.b64decode(content_b64).decode('utf-8', errors='ignore')[:10000]
            else:
                project.readme_content = "Nora n'a pas trouvé de README pour ce projet. L'étudiant n'a pas encore documenté son code."

            # 2. Récupérer les technos (Langages du Repo)
            tech_res = requests.get(f"https://api.github.com/repos/{repo_full_name}/languages", headers=headers)
            if tech_res.status_code == 200:
                langs = tech_res.json()
                if langs:
                    sorted_langs = list(langs.keys())
                    project.primary_language = sorted_langs[0]
                    project.technologies_list = ", ".join(sorted_langs) # On stocke tout ici
        
        # --- B. ARCHIVAGE DU PDF ---
        if pdf_path and os.path.exists(pdf_path):
            try:
                # Sécurité : On recharge l'année académique pour éviter les erreurs de Lazy Loading
                # year_label = db.query(AcademicYear).get(project.academic_year_id).label
                year_label = db.get(AcademicYear, project.academic_year_id).label
                
                # On nettoie le titreaz
                clean_title = re.sub(r'[^a-zA-Z0-9]', '_', project.title)
                git_pdf_path = f"archives/{year_label}/{project.id}_{clean_title}/rapport.pdf"
                # print(git_pdf_path)
                

                with open(pdf_path, "rb") as f:
                    pdf_content = f.read()
                    
                    # Upload vers TON repo d'archive (Organisation)
                    # PyGithub renvoie un dictionnaire contenant l'objet ContentFile
                    result = repo_archive.create_file(
                        path=git_pdf_path,
                        message=f"Nora: Archive Rapport - Projet {project.id}",
                        content=pdf_content,
                        branch="main"
                    )
                    
                    # ATTENTION : result est souvent un dict {'content': ContentFile, 'commit': Commit}
                    # On récupère l'URL brute de téléchargement
                    # raw_url = result['content'].download_url
                    
                    project.report_pdf_url = git_pdf_path
                    project.has_report = True

                    # Création de l'entrée File
                    new_file = ProjectFile(
                        project_id=project.id,
                        file_name=f"Rapport_{clean_title[:20]}.pdf",
                        github_path=git_pdf_path, # Garde le chemin relatif Github
                        file_type="report",
                        file_size=round(os.path.getsize(pdf_path) / (1024 * 1024), 2)
                    )
                    db.add(new_file)
                    db.commit() # On commit ici pour être sûr
                    
            except Exception as e:
                print(f"⚠️ Erreur lors de l'upload PDF : {e}")
                # On ne bloque pas tout le projet pour un PDF, on continue

        # --- C. FINALISATION ---
        project.status = "archived"
        db.commit()
        print(f"✅ Projet {project.id} archivé avec succès.")

    except Exception as e:
        db.rollback()
        project.status = "error"
        db.commit()
        print(f"❌ Erreur critique Worker : {str(e)}")

    finally:
        # Nettoyage du fichier temporaire PDF pour ne pas polluer le serveur
        if pdf_path and os.path.exists(pdf_path):
            os.remove(pdf_path)
        db.close()