import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def call_groq_api(system_prompt, user_content):
    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content}
            ],
            model="llama-3.1-8b-instant", # Très rapide pour les résumés
            temperature=0.7, # Un peu de créativité pour Nora
        )
        return chat_completion.choices[0].message.content
    except Exception as e:
        print(f"Erreur Groq: {e}")
        return "Désolée, je n'ai pas pu analyser ce projet."