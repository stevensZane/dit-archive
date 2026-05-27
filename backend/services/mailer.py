import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

def send_welcome_email(to_email: str, first_name: str):
    # Récupération des configurations du .env
    smtp_host = os.getenv("EMAIL_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("EMAIL_PORT", 587))
    from_email = os.getenv("EMAIL_ADDRESS")
    email_password = os.getenv("EMAIL_PASSWORD")

    if not from_email or not email_password:
        return None

    # Création du message au format HTML
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Bienvenue sur DIT Archive ! 🚀"
    msg["From"] = f"DIT Archive <{from_email}>"
    msg["To"] = to_email

    html_content = f"""
    <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; rounded-3xl;">
        <h2 style="color: #004751;">Salut {first_name} ! 👋</h2>
        <p>On est ravi de t'accueillir sur <strong>DIT Archive</strong>. Ton compte étudiant est maintenant actif.</p>
        <p>Tu peux dès maintenant explorer les projets de tes camarades, consulter les analyses de Nora ou soumettre ton propre projet.</p>
        <br />
        <a href="http://localhost:5173/explore" style="background-color: #004751; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 12px; display: inline-block;">
            Explorer la bibliothèque
        </a>
        <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;" />
        <p style="font-size: 11px; color: #666; text-align: center;">Ceci est un message automatique de ton portail Dakar Institute of Technology.</p>
    </div>
    """
    
    msg.attach(MIMEText(html_content, "html"))

    try:
        # Connexion sécurisée au serveur SMTP (Gmail/Outlook...)
        server = smtplib.SMTP(smtp_host, smtp_port)
        server.starttls() # Sécurisation de la connexion
        server.login(from_email, email_password)
        
        # Envoi effectif
        server.sendmail(from_email, [to_email], msg.as_string())
        server.quit()
        
        # print(f"📩 Email de bienvenue envoyé avec succès à {to_email}")
        return True
    except Exception as e:
        # print(f"❌ Erreur lors de l'envoi de l'email via SMTP : {e}")
        return None