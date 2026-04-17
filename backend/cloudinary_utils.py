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
    """
    Prend un fichier (UploadFile de FastAPI) et l'envoie sur Cloudinary.
    Retourne l'URL sécurisée.
    """
    try:
        # resource_type="auto" est CRUCIAL pour que Cloudinary accepte les PDF
        response = cloudinary.uploader.upload(
            file,
            folder=folder,
            resource_type="auto"
        )
        return response.get("secure_url")
    except Exception as e:
        print(f"❌ Erreur Cloudinary: {e}")
        return None