import asyncio
import httpx
import time

# --- CONFIGURATION ---
URL = "http://127.0.0.1:8000/projects" # Remplace par ton URL
NOMBRE_REQUETES = 550  # Nombre total d'étudiants simulés
# ---------------------

async def envoyer_requete(client, id_test):
    start = time.perf_counter()
    try:
        response = await client.get(URL)
        end = time.perf_counter()
        print(f"Requête {id_test:02d} : Statut {response.status_code} en {end - start:.2f}s")
        return response.status_code
    except Exception as e:
        print(f"Requête {id_test:02d} : ÉCHEC -> {e}")
        return "ERROR"

async def lancer_test():
    async with httpx.AsyncClient() as client:
        tasks = []
        print(f"🚀 Lancement de {NOMBRE_REQUETES} requêtes simultanées sur {URL}...")
        
        start_time = time.perf_counter()
        
        # On crée toutes les tâches (les requêtes)
        for i in range(NOMBRE_REQUETES):
            tasks.append(envoyer_requete(client, i))
        
        # On les lance TOUTES en même temps
        resultats = await asyncio.gather(*tasks)
        
        end_time = time.perf_counter()
        
        # --- STATISTIQUES ---
        succes = resultats.count(200)
        erreurs = len(resultats) - succes
        print("\n" + "="*30)
        print(f"RÉSULTATS DU TEST :")
        print(f"Durée totale : {end_time - start_time:.2f} secondes")
        print(f"Succès (200 OK) : {succes}")
        print(f"Erreurs : {erreurs}")
        print("="*30)

if __name__ == "__main__":
    asyncio.run(lancer_test())