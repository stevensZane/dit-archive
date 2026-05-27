import os
import re
import shutil
import base64
import requests
import subprocess
import tempfile
import json
from models.sql_models import Project
from config.database import SessionLocal
from services.ai import call_groq_api

def parse_github_url(url):
    """
    Extrait owner, repo, branch et subpath d'une URL GitHub
    """
    pattern = r"https://github\.com/([^/]+)/([^/]+)(?:/tree/([^/]+)/(.+))?"
    match = re.match(pattern, url)
    if not match:
        return None, None, None, None
    return match.groups()

def calculate_technical_score(languages_dict: dict, readme_content: str) -> float:
    """Calcul mathématique et factuel basé sur les données du dépôt."""
    score = 0.0
    
    # 1. Richesse technologique (Max 30 points)
    # Plus il y a de langages structurés (poids en octets), plus on valorise la stack
    if languages_dict:
        num_langs = len(languages_dict)
        score += min(num_langs * 10, 30) # 10 pts par langage, max 30
        
    # 2. Qualité de la documentation brute (Max 30 points)
    if readme_content:
        readme_len = len(readme_content)
        if readme_len > 1500: score += 15
        elif readme_len > 500: score += 10
        
        # Bonus si des sections clés d'un bon projet informatique sont présentes
        keywords = ["install", "setup", "prerequisites", "docker", "usage", "api"]
        matches = sum(1 for word in keywords if word in readme_content.lower())
        score += min(matches * 3, 15) # Max 15 points de structure
        
    return score

def process_and_archive_project(project_id: int):
    db = SessionLocal()
    project = db.query(Project).filter(Project.id == project_id).first()
    
    if not project or not project.github_repository_url:
        db.close()
        return

    tmp_dir = tempfile.mkdtemp()

    try:
        project.analysis_status = "processing"
        db.commit()

        # 1. Clonage superficiel
        subprocess.run(
            ["git", "clone", "--depth", "1", project.github_repository_url, tmp_dir],
            check=True, capture_output=True
        )

        headers = {"Authorization": f"token {os.getenv('GITHUB_TOKEN')}"}
        owner, repo_name, branch, sub_path = parse_github_url(project.github_repository_url)
        repo_full_name = f"{owner}/{repo_name}"

        # 2. Récupération du README
        readme_url = f"https://api.github.com/repos/{repo_full_name}/readme"
        if sub_path:
            readme_url = f"https://api.github.com/repos/{repo_full_name}/contents/{sub_path}/README.md"
        
        res_readme = requests.get(readme_url, headers=headers)
        readme_content = ""
        if res_readme.status_code == 200:
            content_b64 = res_readme.json().get('content', '')
            readme_content = base64.b64decode(content_b64).decode('utf-8', errors='ignore')
            project.readme_content = readme_content[:10000]

        # 3. Récupération des langages
        languages_dict = {}
        tech_res = requests.get(f"https://api.github.com/repos/{repo_full_name}/languages", headers=headers)
        if tech_res.status_code == 200:
            languages_dict = tech_res.json()
            if languages_dict:
                sorted_langs = list(languages_dict.keys())
                project.primary_language = sorted_langs[0]
                project.technologies_list = ", ".join(sorted_langs)

        # 4. Calcul du score factuel / algorithmique (Sur 60 points)
        factual_score = calculate_technical_score(languages_dict, readme_content)

        # 5. Appel de Nora (Groq) pour l'évaluation métier (Sur 40 points)
        user_content = f"""
        Titre du projet: {project.title}
        Filière cible: {project.program.name if project.program else 'Général'}
        Description fournie: {project.description}
        Extrait du README: {readme_content[:4000]}
        Technologies détectées: {project.technologies_list}
        """

        # System prompt mis à jour pour exiger une note sur 40 au format JSON strict
        nora_prompt = """Tu es l'analyste IA du DIT. Évalue la cohérence architecturale et la pertinence métier de ce projet d'étudiant.
        Tu dois obligatoirement répondre sous la forme d'un objet JSON strict avec deux clés :
        - "summary": (un résumé condensé et percutant de 3 lignes max sur les points forts du projet)
        - "ai_pure_score": (une note sur 40 sous forme de float reflétant l'innovation et la complexité métier)
        Ne rajoute aucune phrase avant ou après le JSON."""

        ai_response = call_groq_api(nora_prompt, user_content)

        # 6. Parsing et calcul de la note finale pour le Leaderboard
        try:
            start = ai_response.find('{')
            end = ai_response.rfind('}') + 1
            data = json.loads(ai_response[start:end])
            
            project.ai_summary = data.get("summary", "Analyse générée avec succès.")
            ai_pure_score = float(data.get("ai_pure_score", 20.0)) # 20/40 par défaut en cas de clé manquante
        except Exception:
            project.ai_summary = "Analyse technique complétée (Erreur de sérialisation du résumé IA)."
            ai_pure_score = 11.5 # Note moyenne de secours sur 40

        # Note finale combinée = Factuel (60 pts) + IA (40 pts) = Note sur 100
        project.nora_score = factual_score + ai_pure_score
        project.analysis_status = "completed"
        db.commit()

    except Exception as e:
        db.rollback()
        project.analysis_status = "failed"
        db.commit()

    finally:
        if os.path.exists(tmp_dir):
            shutil.rmtree(tmp_dir)
        db.close()