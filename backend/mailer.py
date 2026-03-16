import resend
import os
from fastapi import BackgroundTasks

resend.api_key = os.getenv("RESEND_API_KEY")

def send_welcome_email(email: str, name: str):
    try:
        params = {
            "from": "Nora du DIT <onboarding@resend.dev>", # Ou ton domaine vérifié
            "to": [email],
            "subject": "Bienvenue sur la plateforme Archive du DIT !",
            "html": f"""
                <h1>Félicitations {name} !</h1>
                <p>Ton compte a été créé avec succès.</p>
                <p>Tu peux maintenant interroger Nora sur toutes les archives du DIT.</p>
                <br/>
                <p>À bientôt,<br/>L'équipe DIT</p>
            """,
        }
        resend.Emails.send(params)
    except Exception as e:
        print(f"❌ Erreur envoi mail: {e}")