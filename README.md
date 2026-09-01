# DIT Archive — Bibliothèque Intelligente de Projets & Data Place

![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi)
![React](https://img.shields.io/badge/Frontend-React_18-61DAFB?style=for-the-badge&logo=react)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL_%2B_pgvector-4169E1?style=for-the-badge&logo=postgresql)
![Groq](https://img.shields.io/badge/AI-Groq_LLaMA_3.1-f34f29?style=for-the-badge)
![TailwindCSS](https://img.shields.io/badge/Styling-Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css)

**DIT Archive** est la plateforme officielle de centralisation, d'indexation et de valorisation du patrimoine académique du **Dakar Institute of Technology (DIT)**. Elle combine un moteur de recherche vectoriel (RAG), une IA conversationnelle dédiée (**Agent Nora**) et un espace **Data Place** anonymisé pour rendre la mémoire scientifique de l'établissement vivante, interactive et exploitable.

---

## Fonctionnalités Principales

* **Archivage Centralisé & Automatisé :** Guichet unique pour le dépôt des mémoires PDF, dépôts GitHub et métadonnées associées avec gestion des statuts de validation admin.
* **Agent Conversationnel RAG (Nora) :** Interrogation sémantique en langage naturel des rapports académiques via LLaMA 3.1 (Groq API) et `pgvector` sans risque d'hallucination.
* **Data Place Académique & Pipeline ETL :** Export et réutilisation de datasets d'apprentissage nettoyés, structurés et anonymisés (conformité RGPD via hachage SHA-256).
* **Sécurité RBAC & Auth JWT :** Contrôle d'accès strict par rôles (`Guest`, `Student`, `Admin`, `SuperAdmin`) et protection du `localStorage` à la déconnexion.
* ⚡ **Architecture 4-Tiers Découplée :** Application Single Page (SPA) Mobile-First connectée à une API REST asynchrone haute performance.

---

## Stack Technique

| Layer | Technologies & Outils |
| :--- | :--- |
| **Frontend** | React 18, Tailwind CSS, Lucide Icons, React Router v6, Axios |
| **Backend** | Python 3.12, FastAPI (Asynchrone), SQLAlchemy 2.0, Pydantic v2 |
| **IA & Vector Search** | RAG Pipeline, Groq API (LLaMA 3.1 8B), `pgvector`, Sentence-Transformers |
| **Base de Données** | PostgreSQL (Neon.tech Serverless) |
| **Stockage Médias** | Cloudinary CDN (Rapports PDF, Captures d'écran) |
| **Déploiement** | Vercel (Front-end), Railway (Back-end) |

---

## Architecture du Projet

```text
dit-archive/
├── backend/
│   ├── main.py                 # Point d'entrée FastAPI & configuration CORS
│   ├── database.py             # Session SQLAlchemy & connexion PostgreSQL
│   ├── models.py               # Modèles ORM (Project, User, AcademicYear, etc.)
│   ├── schemas.py              # Validation des données Pydantic
│   ├── services/               # Services métiers (Cloudinary, RAG Nora, Pipeline ETL)
│   │   ├── cloudinary_service.py
│   │   ├── nora_rag.py
│   │   └── etl_pipeline.py
│   └── routers/                # Endpoints de l'API REST
│       ├── auth.py             # Authentification JWT & Inscription
│       ├── projects.py         # Dépôt, validation & consultation des projets
│       ├── nora.py             # Moteur RAG & Chatbot Nora
│       └── dataplace.py        # Gestion des jeux de données réutilisables
└── frontend/
    ├── src/
    │   ├── api/                # Configuration Axios
    │   ├── components/         # Composants UI réutilisables
    │   ├── student-space/      # Interface Espace Étudiant & Modales
    │   ├── admin-space/        # Dashboard Administrateur
    │   └── pages/              # Vue Galerie, Chat Nora, Data Place
    └── package.json