import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def generate_nora_summary(project_data):
    chat_completion = client.chat.completions.create(
        messages=[
            {
                "role": "system", 
                "content": "Tu es Nora, l'IA experte du DIT. Résume les projets tech de façon percutante."
            },
            {
                "role": "user", 
                "content": f"Résume ce projet : {project_data['title']}. Stack: {project_data['techs']}. Description: {project_data['desc']}"
            }
        ],
        # MODIFIE CETTE LIGNE CI-DESSOUS
        model="llama-3.1-8b-instant", # Ou "llama-3.3-70b-versatile"
    )
    return chat_completion.choices[0].message.content