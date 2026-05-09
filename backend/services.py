import os
import re
import shutil
import base64
import requests
import subprocess
import tempfile
import json
from database import SessionLocal, Project
from ai import call_groq_api
from system_prompts import nora_system_prompt_project_analyzer

def parse_github_url(url):
    """
    Extrait owner, repo, branch et subpath d'une URL GitHub
    """
    pattern = r"https://github\.com/([^/]+)/([^/]+)(?:/tree/([^/]+)/(.+))?"
    match = re.match(pattern, url)
    if not match:
        return None, None, None, None
    return match.groups()

def process_and_archive_project(project_id: int):
    """
    Worker Nora : Clonage, Extraction, Score IA et Nettoyage.
    """
    db = SessionLocal()
    project = db.query(Project).filter(Project.id == project_id).first()
    
    if not project or not project.github_repository_url:
        db.close()
        return

    # Création d'un dossier temporaire pour le clonage
    tmp_dir = tempfile.mkdtemp()

    try:
        # 1. Mise à jour du statut
        project.analysis_status = "processing"
        db.commit()

        # 2. Clonage temporaire (Analyse de structure)
        # On utilise --depth 1 pour ne pas charger tout l'historique (gain de temps/RAM)
        subprocess.run(
            ["git", "clone", "--depth", "1", project.github_repository_url, tmp_dir],
            check=True, capture_output=True
        )

        # 3. Extraction via API GitHub (README et Langages)
        headers = {"Authorization": f"token {os.getenv('GITHUB_TOKEN')}"}
        owner, repo_name, branch, sub_path = parse_github_url(project.github_repository_url)
        repo_full_name = f"{owner}/{repo_name}"

        # Récupération du README
        readme_url = f"https://api.github.com/repos/{repo_full_name}/readme"
        if sub_path:
            readme_url = f"https://api.github.com/repos/{repo_full_name}/contents/{sub_path}/README.md"
        
        res_readme = requests.get(readme_url, headers=headers)
        readme_content = ""
        if res_readme.status_code == 200:
            content_b64 = res_readme.json().get('content', '')
            readme_content = base64.b64decode(content_b64).decode('utf-8', errors='ignore')
            project.readme_content = readme_content[:10000] # Limite pour la BD

        # Récupération des technologies
        tech_res = requests.get(f"https://api.github.com/repos/{repo_full_name}/languages", headers=headers)
        if tech_res.status_code == 200:
            langs = tech_res.json()
            if langs:
                sorted_langs = list(langs.keys())
                project.primary_language = sorted_langs[0]
                project.technologies_list = ", ".join(sorted_langs)
        
        user_content = f"""
        Titre: {project.title}
        Description: {project.description}
        README: {readme_content[:5000]}
        Technologies: {project.technologies_list}
        """

        ai_response = call_groq_api(nora_system_prompt_project_analyzer, user_content)

        # Parsing de la réponse de Groq
        try:
            # Nettoyage au cas où l'IA ajoute du texte avant/après le JSON
            start = ai_response.find('{')
            end = ai_response.rfind('}') + 1
            data = json.loads(ai_response[start:end])
            
            project.ai_summary = data.get("summary")
            project.nora_score = float(data.get("score", 0))
        except Exception as e:
            project.ai_summary = ai_response # Fallback sur le texte brut
            project.nora_score = 50.0

        # 5. Finalisation
        project.analysis_status = "completed"
        db.commit()

    except Exception as e:
        db.rollback()
        project.analysis_status = "failed"
        db.commit()

    finally:
        # 6. Nettoyage du dossier temporaire
        if os.path.exists(tmp_dir):
            shutil.rmtree(tmp_dir)
        db.close()