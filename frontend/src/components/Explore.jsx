import { useState, useEffect } from "react";
import api from "./api/axios";
import Navbar from "./Navbar";
import ProjectCard from "./ProjectCard";
import { Search, Filter, Loader2, Database, Github } from "lucide-react";

const Explore = () => {
  const [projects, setProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  // 1. Charger TOUS les projets approuvés au démarrage
  const fetchAllProjects = async () => {
    setLoading(true);
    try {
      const res = await api.get("/projects");
      setProjects(res.data);
    } catch (err) {
      console.error("Erreur lors de la récupération des projets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllProjects();
  }, []);

  // 2. Logique de recherche filtrée
  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.length >= 2) {
      setIsSearching(true);
      try {
        const res = await api.get(`/projects/search?q=${query}`);
        setProjects(res.data);
      } catch (err) {
        console.error("Erreur recherche:", err);
      } finally {
        setIsSearching(false);
      }
    } else if (query.length === 0) {
      // Si on efface tout, on recharge la liste complète
      fetchAllProjects();
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBFB]">
      <Navbar />

      {/* HEADER DE RECHERCHE */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <h1 className="flex items-center gap-3 text-4xl font-black text-gray-900 mb-4 italic uppercase tracking-tighter">
                Bibliothèque <span className="text-[#004751]">DIT</span> 
                <img src="/DIT ARCHIVE mascot(1).svg" alt="dit archive mascot"
                  className="h-20 w-auto"
                />
              </h1>
              <p className="text-gray-500 font-medium">
                Explorez tous les projets archivés : du code source aux archives serveur.
              </p>
            </div>
            
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearch}
                placeholder="Titre, techno, auteur..."
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-[#E91E63] outline-none transition-all font-bold"
              />
              {isSearching && (
                <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-[#E91E63]" size={20} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FILTRES RAPIDES (Optionnel mais stylé) */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 overflow-x-auto pb-4 no-scrollbar">
          <button className="flex items-center gap-2 px-5 py-2 bg-black text-white rounded-full text-sm font-bold whitespace-nowrap">
             Tous les projets ({projects.length})
          </button>
          {/* <button className="flex items-center gap-2 px-5 py-2 bg-white border border-gray-200 text-gray-600 rounded-full text-sm font-bold hover:border-[#E91E63] transition-all whitespace-nowrap">
             <Github size={14}/> Github Source
          </button>
          <button className="flex items-center gap-2 px-5 py-2 bg-white border border-gray-200 text-gray-600 rounded-full text-sm font-bold hover:border-[#E91E63] transition-all whitespace-nowrap">
             <Database size={14}/> Archives DB
          </button> */}
        </div>

        {/* GRILLE DE RÉSULTATS */}
        <div className="mt-8">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="h-64 bg-gray-100 animate-pulse rounded-[32px]"></div>
              ))}
            </div>
          ) : projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} from="/explore" />
              ))}
            </div>
          ) : (
            <div className="text-center py-32 bg-white rounded-[40px] border-2 border-dashed border-gray-100">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                <Search size={40} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Aucun résultat</h3>
              <p className="text-gray-400 mt-2">Essayez d'autres mots-clés ou filtres.</p>
              <button 
                onClick={() => {setSearchQuery(""); fetchAllProjects();}}
                className="mt-6 text-[#E91E63] font-bold underline"
              >
                Réinitialiser la recherche
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Explore;