import resend
import os
from dotenv import load_dotenv

load_dotenv()

# Configure ta clé API (Idéalement dans un fichier .env)
resend.api_key = os.getenv("RESEND_API_KEY")

def send_welcome_email(to_email: str, first_name: str):
    try:
        params = {
            "from": "Acme <onboarding@resend.dev>", # Au début, tu ne peux envoyer que depuis cette adresse
            "to": [to_email],
            "subject": "Bienvenue sur la plateforme !",
            "html": f"""
                <div style="font-family: sans-serif; color: #333;">
                    <h2>Salut {first_name} ! 👋</h2>
                    <p>On est ravi de t'accueillir. Ton compte est maintenant actif.</p>
                    <p>Tu peux dès maintenant explorer les projets ou soumettre le tien.</p>
                    <hr />
                    <p style="font-size: 12px; color: #666;">Ceci est un message automatique de ton portail étudiant.</p>
                </div>
            """,
        }

        email = resend.Emails.send(params)
        return email
    except Exception as e:
        print(f"Erreur lors de l'envoi de l'email : {e}")
        return None