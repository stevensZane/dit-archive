import { useState, useEffect } from "react";
import api from "./api/axios";
import Navbar from "./Navbar";
import ProjectCard from "./ProjectCard";
import { Link } from "react-router-dom";

const Home = () => {
  const [recentProjects, setRecentProjects] = useState([]); // Liste fixe du bas
  const [searchResults, setSearchResults] = useState([]);   // Liste de recherche
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  // 1. Chargement initial des projets récents
  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const res = await api.get("/projects"); // On récupère les derniers projets
        setRecentProjects(res.data.slice(0, 6)); // On en garde par ex. 6 pour le "Display"
      } catch (err) {
        console.error("Erreur API:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecent();
  }, []);

  // 2. Logique de recherche (Déclenchée quand on tape)
  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.length > 1) {
      setIsSearching(true);
      try {
        // On appelle l'endpoint de recherche qu'on a créé dans le backend
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
          <span className="text-dit-teal">votre prochain projet.</span>
        </h1>

        <p className="text-gray-500 text-lg md:text-xl max-w-2xl mx-auto mb-10">
          La bibliothèque numérique des projets du Dakar Institute of Technology.
        </p>

        {/* Barre de Recherche */}
        {/* Vérifie que ce conteneur n'a PAS de overflow-hidden */}
        <div className="relative max-w-3xl mx-auto mb-12" style={{ zIndex: 100 }}>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            className="w-full py-5 px-8 rounded-2xl border-2 border-gray-100 bg-gray-50 text-gray-900 text-lg shadow-sm focus:border-dit-teal outline-none"
            placeholder="Rechercher un projet..."
          />

          {/* La liste de résultats */}
          {isSearching && searchQuery.length >= 2 && (
            <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 max-h-[400px] overflow-y-auto overflow-x-hidden">
              {searchResults && searchResults.length > 0 ? (
                searchResults.map((p) => (
                  <Link
                    to={`/project/${p.id}`}
                    key={p.id}
                    onClick={() => {
                        setIsSearching(false);
                        setSearchQuery("");
                    }}
                    className="p-5 hover:bg-gray-50 border-b border-gray-50 flex flex-col items-start group transition-all"
                  >
                    <span className="text-xs font-bold text-dit-teal uppercase tracking-widest mb-1">
                      {p.program}
                    </span>
                    <h4 className="font-bold text-gray-900 text-base group-hover:translate-x-1 transition-transform">
                      {p.title}
                    </h4>
                    <div className="flex items-center gap-3 mt-2 text-gray-400 text-xs italic">
                      <span>Par {p.author}</span>
                      <span>•</span>
                      <span>{p.year}</span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="p-8 text-center text-gray-400 bg-white rounded-2xl">
                  <p>Aucun projet trouvé pour "{searchQuery}"</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Section Projets Récents (Display permanent) */}
      <div className="max-w-7xl mx-auto px-6 pb-20">
        <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-4">
          <h2 className="text-xl font-bold text-gray-900">Projets récents</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            <p className="col-span-full text-center text-gray-400 animate-pulse">Chargement des projets...</p>
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