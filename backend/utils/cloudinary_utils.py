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
        response = cloudinary.uploader.upload(
            file,
            folder=folder,
            resource_type="raw",  # 🟢 Force le mode fichier brut (idéal pour les PDF)
            type="upload", 
            access_mode="public" 
        )
        
        url = response.get("secure_url")
        print(f"🔗 URL Cloudinary brute générée : {url}")
        return url
    except Exception as e:
        print(f"❌ Erreur Cloudinary: {e}")
        return None