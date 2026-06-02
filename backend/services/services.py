import os
import re
import base64
import requests
import json
from models.sql_models import Project
from config.database import SessionLocal
from services.ai import call_groq_api

def parse_github_url(url):
    """Extrait owner et repo d'une URL GitHub standard."""
    # Nettoyage des slashes de fin
    url = url.strip().rstrip('/')
    pattern = r"https://github\.com/([^/]+)/([^/]+)"
    match = re.match(pattern, url)
    if not match:
        return None, None
    owner, repo = match.groups()
    # Si l'URL contient un sous-chemin (/tree/main/...), on nettoie le nom du repo
    if "/" in repo:
        repo = repo.split("/")[0]
    return owner, repo

def calculate_technical_score(languages_dict: dict, readme_content: str) -> float:
    score = 0.0
    if languages_dict:
        num_langs = len(languages_dict)
        score += min(num_langs * 10, 30)
        
    if readme_content:
        readme_len = len(readme_content)
        if readme_len > 1500: score += 15
        elif readme_len > 500: score += 10
        
        keywords = ["install", "setup", "prerequisites", "docker", "usage", "api"]
        matches = sum(1 for word in keywords if word in readme_content.lower())
        score += min(matches * 3, 15)
        
    return score

def process_and_archive_project(project_id: int):
    db = SessionLocal()
    project = db.query(Project).filter(Project.id == project_id).first()
    
    if not project or not project.github_repository_url:
        db.close()
        return

    try:
        project.analysis_status = "processing"
        db.commit()

        # 1. Extraction propre des identifiants GitHub
        owner, repo_name = parse_github_url(project.github_repository_url)
        if not owner or not repo_name:
            raise Exception(f"URL GitHub invalide : {project.github_repository_url}")

        repo_full_name = f"{owner}/{repo_name}"
        
        # Configuration des headers d'authentification GitHub API
        github_token = os.getenv('GITHUB_TOKEN') or os.getenv('GITHUB_CLASSIC_TOKEN')
        headers = {}
        if github_token:
            headers["Authorization"] = f"token {github_token}"

        # 2. Récupération sécurisée du README via l'API (Plus besoin de git clone !)
        readme_content = ""
        try:
            readme_url = f"https://api.github.com/repos/{repo_full_name}/readme"
            res_readme = requests.get(readme_url, headers=headers, timeout=10)
            if res_readme.status_code == 200:
                content_b64 = res_readme.json().get('content', '')
                readme_content = base64.b64decode(content_b64).decode('utf-8', errors='ignore')
                project.readme_content = readme_content[:10000]
            else:
                print(f"⚠️ API GitHub README : Code {res_readme.status_code} pour {repo_full_name}")
        except Exception as e_readme:
            print(f"⚠️ Erreur lors de la récup du README : {e_readme}")

        # 3. Récupération sécurisée des langages via l'API
        languages_dict = {}
        try:
            tech_res = requests.get(f"https://api.github.com/repos/{repo_full_name}/languages", headers=headers, timeout=10)
            if tech_res.status_code == 200:
                languages_dict = tech_res.json()
                if languages_dict:
                    sorted_langs = list(languages_dict.keys())
                    project.primary_language = sorted_langs[0]
                    project.technologies_list = ", ".join(sorted_langs)
            else:
                print(f"⚠️ API GitHub Languages : Code {tech_res.status_code}")
                project.primary_language = "Inconnu"
                project.technologies_list = "Non détectées"
        except Exception as e_tech:
            print(f"⚠️ Erreur lors de la récup des langages : {e_tech}")

        # 4. Calcul du score factuel / algorithmique
        factual_score = calculate_technical_score(languages_dict, readme_content)

        # 5. Appel de Nora (Groq) pour l'évaluation métier
        ai_pure_score = 20.0
        project.ai_summary = "Analyse indisponible."
        
        try:
            user_content = f"""
            Titre du projet: {project.title}
            Filière cible: {project.program.name if project.program else 'Général'}
            Description fournie: {project.description}
            Extrait du README: {readme_content[:4000] if readme_content else 'Aucun README fourni.'}
            Technologies détectées: {project.technologies_list}
            """

            nora_prompt = """Tu es l'analyste IA du DIT. Évalue la cohérence architecturale et la pertinence métier de ce projet d'étudiant.
            Tu dois obligatoirement répondre sous la forme d'un objet JSON strict avec deux clés :
            - "summary": (un résumé condensé et percutant de 3 lignes max sur les points forts du projet)
            - "ai_pure_score": (une note sur 40 sous forme de float reflétant l'innovation et la complexité métier)
            Ne rajoute aucune phrase avant ou après le JSON."""

            ai_response = call_groq_api(nora_prompt, user_content)

            # Extraction et parsing du JSON de Groq
            start = ai_response.find('{')
            end = ai_response.rfind('}') + 1
            if start != -1 and end != -1:
                data = json.loads(ai_response[start:end])
                project.ai_summary = data.get("summary", "Analyse générée avec succès.")
                ai_pure_score = float(data.get("ai_pure_score", 20.0))
            else:
                project.ai_summary = "Erreur de formatage de la réponse IA."
        except Exception as e_ai:
            print(f"⚠️ Échec de l'appel Groq/Nora : {e_ai}")
            project.ai_summary = "Analyse technique complétée (Nora indisponible temporairement)."

        # Note finale combinée et complétion
        project.nora_score = factual_score + ai_pure_score
        project.analysis_status = "completed"
        db.commit()
        print(f"✅ Projet {project_id} archivé et scoré avec succès dans Neon !")

    except Exception as e:
        db.rollback()
        print(f"❌ CRASH CRITIQUE SCRIPT ARCHIVE : {e}")
        project.analysis_status = "failed"
        db.commit()
    finally:
        db.close()