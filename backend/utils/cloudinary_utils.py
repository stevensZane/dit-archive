import cloudinary
import cloudinary.uploader
import os
from dotenv import load_dotenv

load_dotenv()

# Configuration Cloudinary
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)

def upload_to_cloudinary(file, folder="dit_archives", resource_type="raw", **kwargs):
    """
    Uploade un fichier (PDF, CSV, JSON, ZIP, etc.) sur Cloudinary.
    Compatible aussi bien avec les archives qu'avec les datasets du DataPlace.
    """
    try:
        response = cloudinary.uploader.upload(
            file,
            folder=folder,
            resource_type=resource_type,  # Requis pour les fichiers non-images (PDF, CSV, ZIP...)
            type="upload", 
            access_mode="public",
            **kwargs
        )
        
        url = response.get("secure_url") or response.get("url")
        public_id = response.get("public_id")
        print(f"URL Cloudinary générée : {url}")
        
        # On retourne l'URL et le public_id (utile pour la suppression future)
        return {"url": url, "public_id": public_id}
    except Exception as e:
        print(f"Erreur Upload Cloudinary: {e}")
        return None


def delete_from_cloudinary(public_id, resource_type="raw"):
    """
    Supprime un fichier stocké sur Cloudinary à partir de son public_id.
    """
    try:
        if not public_id:
            print("Aucun public_id fourni pour la suppression.")
            return False

        response = cloudinary.uploader.destroy(
            public_id, 
            resource_type=resource_type
        )
        
        if response.get("result") == "ok":
            print(f"Fichier supprimé de Cloudinary : {public_id}")
            return True
        else:
            print(f"Échec de la suppression Cloudinary : {response}")
            return False

    except Exception as e:
        print(f"Erreur Suppression Cloudinary: {e}")
        return False