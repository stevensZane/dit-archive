import { useState, useEffect } from "react";
import api from "./api/axios";
import Navbar from "./Navbar";
import ProjectCard from "./ProjectCard";
import { Search, Loader2 } from "lucide-react";

const Explore = () => {
  const [projects, setProjects] = useState([]);
  const [programs, setPrograms] = useState([]); 
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  // States pour les filtres (Valeurs initiales alignées avec le contenu des dropdowns)
  const [selectedTech, setSelectedTech] = useState('Toutes les technos');
  const [selectedFiliere, setSelectedFiliere] = useState("Niveau d'études");
  const [selectedProgram, setSelectedProgram] = useState('Tous les programmes');

  useEffect(() => {
    const loadInitialData = () => {
      const cachedProjects = localStorage.getItem("dit_projects_cache");
      const cachedPrograms = localStorage.getItem("dit_programs_cache");

      if (cachedProjects) {
        setProjects(JSON.parse(cachedProjects));
        // On retire le loader car on a déjà de la donnée à montrer
        setLoading(false); 
      }
      
      if (cachedPrograms) {
        setPrograms(JSON.parse(cachedPrograms));
      }
    };

    loadInitialData();
    fetchPrograms();
    fetchAllProjects();
  }, []);

  const fetchAllProjects = async () => {
    // Si on n'a rien en cache, on montre le loader
    if (!localStorage.getItem("dit_projects_cache")) {
      setLoading(true);
    }

    try {
      const res = await api.get("/projects");
      setProjects(res.data);
      localStorage.setItem("dit_projects_cache", JSON.stringify(res.data));
    } catch (err) {
      console.error("Erreur API Projets (Utilisation du cache):", err);
    } finally {
      // Quoi qu'il arrive (succès ou erreur), on arrête le loader
      setLoading(false);
    }
  };

  const fetchPrograms = async () => {
    try {
      const res = await api.get("/programs");
      setPrograms(res.data);
      localStorage.setItem("dit_programs_cache", JSON.stringify(res.data));
    } catch (err) {
      console.error("Erreur API Programmes:", err);
    }
  };

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
      fetchAllProjects();
    }
  };

  // 2. Extraction dynamique pour les dropdowns
  const allTechnos = [
    'Toutes les technos', 
    ...new Set(
      projects.flatMap(p => 
        p.technologies_list 
          ? p.technologies_list.split(',').map(t => t.trim()) 
          : []
      )
    )
  ];

  const allFilieres = ["Niveau d'études", ...new Set(projects.map(p => p.level).filter(Boolean))];

  // 3. LOGIQUE DE FILTRAGE COMBINÉE (Le coeur du dynamisme)
  const filteredProjects = projects.filter(project => {
    // Filtrage par Recherche (si l'API n'a pas déjà filtré)
    const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase());

    // Filtrage par Technologie
    const matchesTech = 
      selectedTech === 'Toutes les technos' || 
      (project.technologies_list && project.technologies_list.split(',').map(t => t.trim()).includes(selectedTech));

    // Filtrage par Filière / Niveau
    const matchesFiliere = 
      selectedFiliere === "Niveau d'études" || 
      project.level === selectedFiliere;

    // Filtrage par Programme (ID)
    const matchesProgram = 
      selectedProgram === 'Tous les programmes' || 
      String(project.program_id) === selectedProgram;

    return matchesSearch && matchesTech && matchesFiliere && matchesProgram;
  });

  return (
    <div className="min-h-screen bg-[#FBFBFB]">
      <Navbar />

      {/* HEADER DE RECHERCHE */}
      <div className="bg-white border-b border-gray-100 px-6 py-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <h1 className="flex items-center gap-3 text-4xl font-black text-gray-900 mb-4 italic uppercase tracking-tighter">
                Bibliothèque <span className="text-[#004751]">DIT</span> 
                <img src="/DIT ARCHIVE mascot(1).svg" alt="dit archive mascot" className="h-20 w-auto" />
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

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* BARRE DE FILTRES RESPONSIVE */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          <div className="flex-shrink-0">
            <button className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-full text-sm font-bold whitespace-nowrap shadow-lg shadow-black/10">
              Tous les projets ({filteredProjects.length})
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Filtre Programmes */}
            <select 
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              className="flex-1 sm:flex-none bg-white border-2 border-gray-100 text-gray-700 py-2.5 px-4 rounded-2xl text-xs font-bold focus:outline-none focus:border-black cursor-pointer transition-all min-w-[140px]"
            >
              <option value="Tous les programmes">Tous les programmes</option>
              {programs.map(p => (
                <option key={p.id} value={String(p.id)}>{p.name}</option>
              ))}
            </select>

            {/* Filtre Technos */}
            <select 
              value={selectedTech}
              onChange={(e) => setSelectedTech(e.target.value)}
              className="flex-1 sm:flex-none bg-white border-2 border-gray-100 text-gray-700 py-2.5 px-4 rounded-2xl text-xs font-bold focus:outline-none focus:border-black cursor-pointer transition-all min-w-[140px]"
            >
              {allTechnos.map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            {/* Filtre Niveau (Level) */}
            <select 
              value={selectedFiliere}
              onChange={(e) => setSelectedFiliere(e.target.value)}
              className="flex-1 sm:flex-none bg-white border-2 border-gray-100 text-gray-700 py-2.5 px-4 rounded-2xl text-xs font-bold focus:outline-none focus:border-black cursor-pointer transition-all min-w-[140px]"
            >
              {allFilieres.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>

        {/* GRILLE DE RÉSULTATS */}
        <div className="mt-12">
          {loading && projects.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="h-64 bg-gray-100 animate-pulse rounded-[32px]"></div>
              ))}
            </div>
          ) : filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {filteredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} from="/explore" />
              ))}
            </div>
          ) : (
            <div className="text-center py-32 bg-white rounded-[40px] border-2 border-dashed border-gray-100">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                <Search size={40} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Aucun projet trouvé</h3>
              <p className="text-gray-400 mt-2">Essayez d'ajuster vos filtres ou votre recherche.</p>
              <button 
                onClick={() => {
                  setSearchQuery(""); 
                  setSelectedTech("Toutes les technos");
                  setSelectedFiliere("Niveau d'études");
                  setSelectedProgram("Tous les programmes");
                  fetchAllProjects();
                }}
                className="mt-6 text-[#E91E63] font-bold underline transition-colors hover:text-black"
              >
                Réinitialiser tout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Explore;