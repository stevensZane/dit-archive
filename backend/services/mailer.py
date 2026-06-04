import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

def send_custom_email(to_email: str, subject: str, html_content: str) -> bool:
    """Fonction d'envoi d'e-mail universelle, blindée avec gestion de timeout et de port."""
    smtp_host = os.getenv("EMAIL_HOST", "smtp.gmail.com")
    # On récupère le port depuis le .env, par défaut 587
    smtp_port = int(os.getenv("EMAIL_PORT", 587))
    smtp_user = os.getenv("EMAIL_ADDRESS")
    smtp_password = os.getenv("EMAIL_PASSWORD")

    if not smtp_user or not smtp_password:
        print("❌ [Email System] Configuration manquante : EMAIL_ADDRESS ou EMAIL_PASSWORD absent.")
        return False

    msg = MIMEMultipart()
    msg["From"] = f"DIT Archive <{smtp_user}>"
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.attach(MIMEText(html_content, "html"))

    try:
        print(f"📧 [Email System] Envoi à {to_email} via {smtp_host}:{smtp_port}...")
        
        # Si le port est 465 (SSL direct)
        if smtp_port == 465:
            with smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=10) as server:
                server.login(smtp_user, smtp_password)
                server.sendmail(smtp_user, to_email, msg.as_string())
        # Si le port est 587 (TLS - Ton cas sur Railway)
        else:
            with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
                server.starttls()  # Sécurisation TLS obligatoire pour le 587
                server.login(smtp_user, smtp_password)
                server.sendmail(smtp_user, to_email, msg.as_string())
                
        print(f"✅ [Email System] Message envoyé à {to_email} !")
        return True
    except smtplib.SMTPAuthenticationError:
        print("❌ [Email System] ERREUR D'AUTHENTIFICATION : Vérifie le 'Mot de passe d'application' Google sur Railway.")
    except Exception as e:
        print(f"❌ [Email System] CRASH ENVOI MAIL : {str(e)}")
    return False

def send_welcome_email(to_email: str, first_name: str):
    """Réutilise la fonction robuste pour l'inscription."""
    subject = "Bienvenue sur DIT Archive ! 🚀"
    
    # Correction de ta balise HTML (rounded-3xl n'est pas du style inline CSS valide, border-radius oui)
    html_content = f"""
    <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 24px;">
        <h2 style="color: #004751;">Salut {first_name} ! 👋</h2>
        <p>On est ravi de t'accueillir sur <strong>DIT Archive</strong>. Ton compte étudiant est maintenant actif.</p>
        <p>Tu peux dès maintenant explorer les projets de tes camarades, consulter les analyses de Nora ou soumettre ton propre projet.</p>
        <br />
        <a href="https://dit-archive.vercel.app/explore" style="background-color: #004751; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 12px; display: inline-block;">
            Explorer la bibliothèque
        </a>
        <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;" />
        <p style="font-size: 11px; color: #666; text-align: center;">Ceci est un message automatique de ton portail Dakar Institute of Technology.</p>
    </div>
    """
    # Remplacement du lien localhost par ton futur domaine ou une URL relative pour la prod !
    return send_custom_email(to_email, subject, html_content)

def broadcast_email_task(student_emails: list, subject: str, message_body: str):
    """Tâche de fond pour envoyer les e-mails un par un sans surcharger le serveur."""
    print(f"📣 [Broadcast] Début de la diffusion pour {len(student_emails)} étudiants.")
    
    for email in student_emails:
        html_template = f"""
        <html>
            <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; border-top: 4px solid #004751;">
                    <h2 style="color: #004751;">📢 Annonce Officielle - DIT Archive</h2>
                    <p>Bonjour cher étudiant,</p>
                    <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 3px solid #004751;">
                        {message_body.replace('\n', '<br>')}
                    </div>
                    <p>Pour consulter les nouveautés, connectez-vous sur votre espace.</p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin-top: 20px;">
                    <p style="font-size: 11px; color: #7f8c8d; text-align: center;">Dakar Institute of Technology - Direction des Études</p>
                </div>
            </body>
        </html>
        """
        send_custom_email(to_email=email, subject=subject, html_content=html_template)
        
    print("✅ [Broadcast] Fin de la diffusion générale des e-mails.")