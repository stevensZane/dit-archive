import os
import re
import base64
import requests
import json
import io
from pypdf import PdfReader
from models.sql_models import Project
from config.database import SessionLocal
from services.ai import call_groq_api
from routers.nora import trigger_nora_ingestion_for_project

def parse_github_url(url):
    """Extrait owner et repo d'une URL GitHub standard."""
    if not url:
        return None, None
    url = url.strip().rstrip('/')
    pattern = r"https://github\.com/([^/]+)/([^/]+)"
    match = re.match(pattern, url)
    if not match:
        return None, None
    owner, repo = match.groups()
    if "/" in repo:
        repo = repo.split("/")[0]
    return owner, repo

def calculate_technical_score(readme_content: str) -> float:
    """Calcule le score factuel pour les projets de dev (Max 40 points)."""
    score = 0.0
    if not readme_content:
        return score
        
    # 1. Richesse de la documentation (Max 20 points)
    readme_len = len(readme_content)
    if readme_len > 2500: score += 20
    elif readme_len > 1000: score += 15
    elif readme_len > 300: score += 10
    
    # 2. Rigueur de configuration / DevOps (Max 20 points)
    keywords = ["install", "setup", "prerequisites", "docker", "usage", "api", "requirements", "env"]
    matches = sum(1 for word in keywords if word in readme_content.lower())
    score += min(matches * 3, 20)
        
    return score

def calculate_marketing_score(pdf_text_extract: str) -> float:
    """Calcule le score factuel pour les projets Marketing/PDF (Max 40 points)."""
    score = 0.0
    if not pdf_text_extract:
        return score
        
    # 1. Richesse et structure de l'introduction extraite (Max 20 points)
    text_len = len(pdf_text_extract)
    if text_len > 2000: score += 20
    elif text_len > 1000: score += 15
    elif text_len > 400: score += 10
    
    # 2. Présence de vocabulaire métier stratégique (Max 20 points)
    keywords = ["stratégie", "kpi", "roi", "campagne", "cible", "seo", "analyse", "budget", "marché", "conversion"]
    matches = sum(1 for word in keywords if word in pdf_text_extract.lower())
    score += min(matches * 3, 20)
    
    return score

def extract_strategic_pdf_content(pdf_url: str) -> str:
    """
    Parcourt dynamiquement tout le PDF pour capturer l'intégralité 
    des pages clés (Résumé, Introduction, Conclusion).
    """
    try:
        response = requests.get(pdf_url, timeout=15)
        if response.status_code != 200:
            return ""
            
        pdf_file = io.BytesIO(response.content)
        reader = PdfReader(pdf_file)
        
        extracted_pages = []
        
        keywords_intro_resume = ["introduction", "résumé", "abstract"]
        keywords_conclusion = ["conclusion"]
        
        for page_num, page in enumerate(reader.pages):
            text = page.extract_text()
            if not text:
                continue
            
            page_header = text[:400].lower()
            is_table_of_contents = "...." in text or ("sommaire" in page_header and page_num < 10)
            
            if is_table_of_contents:
                continue
                
            if any(kw in page_header for kw in keywords_intro_resume):
                print(f"Section introductive/résumé détectée à la page {page_num + 1}")
                extracted_pages.append(f"--- PAGE {page_num + 1} ({page_header[:30].strip().upper()}) ---\n{text}")
                
            elif any(kw in page_header for kw in keywords_conclusion):
                print(f"Section conclusion détectée à la page {page_num + 1}")
                extracted_pages.append(f"--- PAGE {page_num + 1} (CONCLUSION) ---\n{text}")

        if not extracted_pages:
            print("Aucun mot-clé détecté dans les en-têtes. Extraction forcée des pages 2, 10, 11.")
            for idx in [1, 9, 10]: 
                if idx < len(reader.pages):
                    t = reader.pages[idx].extract_text()
                    if t: 
                        extracted_pages.append(t)
                    
        return "\n\n".join(extracted_pages)
        
    except Exception as e:
        print(f"Échec de l'extraction stratégique du PDF : {e}")
        return ""

def process_and_archive_project(project_id: int):
    db = SessionLocal()
    project = db.query(Project).filter(Project.id == project_id).first()
    
    if not project:
        db.close()
        return

    try:
        project.analysis_status = "processing"
        db.commit()

        content_for_nora = ""
        factual_score = 0.0
        tech_list_display = "Projet Documentaire / Stratégique"
        primary_lang_display = "Non applicable"

        # -------------------------------------------------------------
        # CAS A : PROJET TECHNIQUE (Avec lien GitHub)
        # -------------------------------------------------------------
        if project.github_repository_url:
            owner, repo_name = parse_github_url(project.github_repository_url)
            if owner and repo_name:
                repo_full_name = f"{owner}/{repo_name}"
                github_token = os.getenv('GITHUB_TOKEN') or os.getenv('GITHUB_CLASSIC_TOKEN')
                headers = {"Authorization": f"token {github_token}"} if github_token else {}

                readme_content = ""
                try:
                    res_readme = requests.get(f"https://api.github.com/repos/{repo_full_name}/readme", headers=headers, timeout=10)
                    if res_readme.status_code == 200:
                        content_b64 = res_readme.json().get('content', '')
                        readme_content = base64.b64decode(content_b64).decode('utf-8', errors='ignore')
                        project.readme_content = readme_content[:10000]
                except Exception as e_readme:
                    print(f"Erreur README : {e_readme}")

                try:
                    tech_res = requests.get(f"https://api.github.com/repos/{repo_full_name}/languages", headers=headers, timeout=10)
                    if tech_res.status_code == 200 and tech_res.json():
                        sorted_langs = list(tech_res.json().keys())
                        primary_lang_display = sorted_langs[0]
                        tech_list_display = ", ".join(sorted_langs)
                except Exception as e_tech:
                    print(f"Erreur Langages : {e_tech}")

                factual_score = calculate_technical_score(readme_content)
                content_for_nora = f"Extrait du README GitHub:\n{readme_content[:3000]}\nTechnologies: {tech_list_display}"
                
                project.primary_language = primary_lang_display
                project.technologies_list = tech_list_display

        # -------------------------------------------------------------
        # CAS B : PROJET NON-TECHNIQUE (Sans lien GitHub)
        # -------------------------------------------------------------
        else:
            print(f"Projet {project_id} identifié comme non-technique. Extraction stratégique du rapport PDF...")
            pdf_text = extract_strategic_pdf_content(project.report_pdf_url)
            
            factual_score = calculate_marketing_score(pdf_text)
            content_for_nora = f"Extrait des pages clés du rapport PDF:\n{pdf_text[:4000]}"
            
            project.primary_language = "N/A (Rapport)"
            project.technologies_list = "Gestion / Stratégie"

        # -------------------------------------------------------------
        # APPEL À NORA (GROQ) POUR LA SÉMANTIQUE (Max 60 points)
        # -------------------------------------------------------------
        ai_pure_score = 30.0
        project.ai_summary = "Analyse indisponible."
        
        try:
            user_content = f"""
            Titre du projet: {project.title}
            Filière: {project.program.name if project.program else 'Général'}
            Description de l'auteur: {project.description}
            {content_for_nora}
            """

            nora_prompt = """Tu es l'analyste IA experte du DIT. Évalue la cohérence structurelle, la rigueur et la pertinence métier de ce travail étudiant.
            Tu dois obligatoirement répondre sous la forme d'un objet JSON strict avec deux clés :
            - "summary": (un résumé analytique et percutant de 3 lignes maximum sur la valeur ajoutée du projet)
            - "ai_pure_score": (une note sur 60 sous forme de float reflétant l'innovation, la méthodologie et l'impact potentiel)
            Ne rajoute aucun texte avant ou après le JSON."""

            ai_response = call_groq_api(nora_prompt, user_content)

            start = ai_response.find('{')
            end = ai_response.rfind('}') + 1
            if start != -1 and end != -1:
                data = json.loads(ai_response[start:end])
                project.ai_summary = data.get("summary", "Analyse générée avec succès.")
                ai_pure_score = float(data.get("ai_pure_score", 30.0))
            else:
                project.ai_summary = "Erreur de décodage des résultats de l'IA."
        except Exception as e_ai:
            print(f"Échec de l'appel Groq/Nora : {e_ai}")
            project.ai_summary = "Analyse textuelle complétée (Nora indisponible temporairement)."

        project.nora_score = factual_score + ai_pure_score
        project.analysis_status = "completed"
        db.commit()
        print(f"Projet {project_id} (Score final: {project.nora_score}/100) traité avec succès.")

        # ABSORPTION AUTOMATIQUE DANS LA BASE DE CONNAISSANCE DE NORA
        try:
            print(f"Lancement de l'apprentissage automatique de Nora pour le projet {project_id}...")
            # On appelle directement la logique d'ingestion du PDF dans RAG/ChromaDB/VectorDB
            trigger_nora_ingestion_for_project(project.id, db)
            print(f"Projet {project_id} absorbé par Nora avec succès !")
        except Exception as e_ingest:
            print(f"Avertissement: L'analyse est validée mais l'ingestion Nora a échoué: {e_ingest}")

    except Exception as e:
        db.rollback()
        print(f"CRASH CRITIQUE DU SCRIPT D'ARCHIVAGE : {e}")
        project.analysis_status = "failed"
        db.commit()
    finally:
        db.close()