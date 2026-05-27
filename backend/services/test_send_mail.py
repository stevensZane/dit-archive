from mailer import send_welcome_email
from dotenv import load_dotenv

load_dotenv()

# Mets ton propre email ici pour faire le test
EMAIL_TEST = "lasiebazoungoula@gmail.com" 
PRENOM_TEST = "Stevens"

print(f"⏳ Tentative d'envoi d'un email de test à {EMAIL_TEST}...")

# Appel de ta fonction
resultat = send_welcome_email(to_email=EMAIL_TEST, first_name=PRENOM_TEST)

if resultat:
    print("🎉 Test réussi ! Va checker ta boîte de réception (et tes spams au cas où).")
else:
    print("🚨 Le test a échoué. Vérifie ton fichier .env (l'adresse, le mot de passe d'application SMTP et les ports).")