import cloudinary
import cloudinary.uploader
import os
from dotenv import load_dotenv

load_dotenv()

# Configuration
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)

def upload_to_cloudinary(file, folder="dit_archives"):
    try:
        # On ajoute 'type="upload"' pour forcer l'accès public
        # On peut aussi ajouter 'flags="attachment"' si on veut forcer le téléchargement,
        # mais pour l'affichage, on reste standard.
        response = cloudinary.uploader.upload(
            file,
            folder=folder,
            resource_type="auto",
            type="upload", # Assure que le fichier est public
            access_mode="public" # Double sécurité
        )
        
        url = response.get("secure_url")
        
        # Petit hack : Si c'est un PDF, Cloudinary oublie parfois l'extension 
        # dans l'URL sécurisée selon la version de l'API. On la force.
        if url and ".pdf" not in url.lower():
             # Optionnel : Cloudinary peut transformer l'URL selon le resource_type
             pass 

        return url
    except Exception as e:
        print(f"❌ Erreur Cloudinary: {e}")
        return None