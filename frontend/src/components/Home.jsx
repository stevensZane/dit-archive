import { useState, useEffect } from "react";
import api from "./api/axios";
import Navbar from "./Navbar";
import ProjectCard from "./ProjectCard";
import { Link } from "react-router-dom";

const Home = () => {
  const [recentProjects, setRecentProjects] = useState([]); 
  const [searchResults, setSearchResults] = useState([]);   
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  // 1. Initialisation : Cache d'abord, API ensuite
  useEffect(() => {
    const initHome = () => {
      const cached = localStorage.getItem("dit_projects_cache");
      if (cached) {
        const data = JSON.parse(cached);
        // On affiche les 6 plus récents depuis le cache
        setRecentProjects(data.slice(0, 6));
        setLoading(false);
      }
      fetchRecent(); // On lance quand même l'appel pour vérifier les mises à jour
    };

    initHome();
  }, []);

  const fetchRecent = async () => {
    // Si pas de cache, on montre le loader
    if (!localStorage.getItem("dit_projects_cache")) {
      setLoading(true);
    }

    try {
      const res = await api.get("/projects");
      const allProjects = res.data;
      
      // Mise à jour de l'affichage
      setRecentProjects(allProjects.slice(0, 6));
      
      // Mise à jour du cache global (partagé avec Explore)
      localStorage.setItem("dit_projects_cache", JSON.stringify(allProjects));
    } catch (err) {
      console.error("Erreur API Home:", err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Logique de recherche (On garde l'appel API direct car c'est une action utilisateur)
  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.length > 1) {
      setIsSearching(true);
      try {
        const res = await api.get(`/projects/search?q=${query}`);
        setSearchResults(res.data);
      } catch (err) {
        console.error("Erreur recherche:", err);
      }
    } else {
      setIsSearching(false);
      setSearchResults([]);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-5xl mx-auto pt-20 pb-16 px-4 text-center">
        <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-6 leading-tight">
          Trouvez l'inspiration pour <br />
          <span className="text-[#004751]">votre prochain projet.</span>
        </h1>

        <p className="text-gray-500 text-lg md:text-xl max-w-2xl mx-auto mb-10">
          La bibliothèque numérique des projets du Dakar Institute of Technology.
        </p>

        {/* Barre de Recherche */}
        <div className="relative max-w-3xl mx-auto mb-12" style={{ zIndex: 100 }}>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            className="w-full py-5 px-8 rounded-2xl border-2 border-gray-100 bg-gray-50 text-gray-900 text-lg shadow-sm focus:border-[#004751] outline-none transition-all"
            placeholder="Rechercher un projet..."
          />

          {/* Résultats de recherche en overlay */}
          {isSearching && searchQuery.length >= 2 && (
            <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 max-h-[400px] overflow-y-auto z-[110]">
              {searchResults && searchResults.length > 0 ? (
                searchResults.map((p) => (
                  <Link
                    to={`/project/${p.id}`}
                    key={p.id}
                    className="p-5 hover:bg-gray-50 border-b border-gray-50 flex flex-col items-start group transition-all"
                  >
                    <span className="text-xs font-bold text-[#004751] uppercase tracking-widest mb-1">
                      {p.program_name || "Projet DIT"}
                    </span>
                    <h4 className="font-bold text-gray-900 text-base group-hover:translate-x-1 transition-transform">
                      {p.title}
                    </h4>
                    <div className="flex items-center gap-3 mt-2 text-gray-400 text-xs italic">
                      <span>Par {p.author_name || p.author}</span>
                      <span>•</span>
                      <span>{p.year}</span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="p-8 text-center text-gray-400">
                  <p>Aucun projet trouvé pour "{searchQuery}"</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Section Projets Récents */}
      <div className="max-w-7xl mx-auto px-6 pb-20">
        <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-4">
          <h2 className="text-xl font-bold text-gray-900">Projets récents</h2>
          <Link to="/explore" className="text-sm font-bold text-[#004751] hover:underline">
            Voir tout →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading && recentProjects.length === 0 ? (
            // Squelettes de chargement (Pulse)
            [1, 2, 3].map(n => (
              <div key={n} className="h-64 bg-gray-50 animate-pulse rounded-[32px]"></div>
            ))
          ) : (
            recentProjects.map((project) => (
              <ProjectCard key={project.id} project={project} from="/" />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;