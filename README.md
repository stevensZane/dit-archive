📚 Nora : L'Archive Inteligente du DIT
Nora est une plateforme moderne d'archivage et de consultation des projets académiques de la Digital Industry Academy (DIT). Elle automatise la récupération des rapports, analyse le code source via l'IA et offre une interface intuitive pour explorer l'historique des travaux des étudiants.

🚀 Fonctionnalités Clés
Archivage Automatisé : Un worker récupère les métadonnées depuis GitHub et archive les rapports PDF sur un dépôt centralisé.

Intelligence Artificielle (Nora) :

Résumés automatiques des projets avec Groq (Llama 3.1).

Chatbot interactif pour poser des questions sur les technos ou les fonctionnalités.

Proxy Sécurisé : Consultation des rapports PDF hébergés sur des dépôts GitHub privés sans exposer les tokens.

Stack Technique Dynamique : Détection automatique des langages majoritaires des dépôts.

Gestion Multimédia : Support des captures d'écran et des liens de démonstration.

🛠 Stack Technique
Backend (Python / FastAPI)
Framework : FastAPI (Asynchrone, performant).

Base de données : PostgreSQL avec SQLAlchemy 2.0.

IA : Groq API (Llama 3.1 / 3.3).

Worker : Script de traitement asynchrone pour GitHub.

Frontend (React / Tailwind CSS)
UI : Tailwind CSS & Lucide Icons.

Routing : React Router DOM.

Client API : Axios.

📂 Structure du Projet (Backend)
Le projet suit une architecture modulaire pour une maintenance facilitée :

Plaintext
backend/
├── main.py              # Point d'entrée et agrégation des routers
├── database.py          # Configuration SQLAlchemy
├── models.py            # Définition des tables (Project, User, etc.)
├── services/            # Services externes (GitHub, Groq IA)
└── routers/             # Points de terminaison (Endpoints)
    ├── projects.py      # Gestion des dossiers et rapports
    ├── nora.py          # Intelligence artificielle & Chat
    └── auth.py          # Authentification et utilisateurs


⚙️ Installation et Lancement
1. Cloner le dépôt
Bash
git clone https://github.com/votre-repo/nora-archive.git
cd nora-archive
2. Configuration (Variables d'environnement)
Créez un fichier .env dans le dossier backend/ :

Extrait de code
DATABASE_URL=postgresql://user:password@localhost/dbname
GITHUB_TOKEN=votre_token_github
GROQ_API_KEY=votre_cle_groq
3. Lancer le Backend
Bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
4. Lancer le Frontend
Bash
cd frontend
npm install
npm run dev
🤖 À propos de Nora
Nora n'est pas qu'une base de données ; elle est conçue pour aider les futurs étudiants à comprendre les travaux de leurs prédécesseurs. En analysant les fichiers README.md et le code source, elle fournit un contexte précieux que les fichiers classiques ne peuvent pas offrir.