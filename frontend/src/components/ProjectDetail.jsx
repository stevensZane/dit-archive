import { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { ArrowLeft, Github, FileText, Sparkles, Code, User, Calendar, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import api from "./api/axios";
import Navbar from "./Navbar";
import NoraSummary from "./NoraSummary";

const ProjectDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [noraText, setNoraText] = useState("");
  const [loadingNora, setLoadingNora] = useState(true);

  // État pour le carrousel
  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  useEffect(() => {
    const initProject = () => {
      const cachedProjects = localStorage.getItem("dit_projects_cache");
      if (cachedProjects) {
        const allProjects = JSON.parse(cachedProjects);
        const found = allProjects.find(p => String(p.id) === String(id));
        if (found) {
          setProject(found);
          setLoading(false);
        }
      }
      fetchProject();
      fetchNoraSummary();
    };
    initProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      const res = await api.get(`/projects/${id}`);
      setProject(res.data);
    } catch (err) {
      console.error("Erreur chargement projet:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchNoraSummary = async () => {
    setLoadingNora(true);
    try {
      const res = await api.get(`/projects/${id}/ai-summary`);
      setNoraText(res.data.summary);
    } catch (err) {
      console.error("Erreur Nora:", err);
    } finally {
      setLoadingNora(false);
    }
  };

  // --- LOGIQUE CARROUSEL ---
  const images = project?.screenshots ? project.screenshots.split(',') : [];

  const nextSlide = () => {
    setCurrentImgIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentImgIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const backPath = location.state?.from || "/explore";
  const authorDisplay = project?.is_historical 
    ? project.author_name 
    : `${project?.owner?.first_name || ''} ${project?.owner?.last_name || ''}`;

  if (loading && !project) return (
    <div className="flex flex-col items-center justify-center min-h-screen text-[#004751]">
      <div className="animate-spin mb-4"><Sparkles size={40} /></div>
      <p className="font-bold animate-pulse">Nora prépare le dossier...</p>
    </div>
  );

  const handleViewReport = (projectId) => {
    // api.defaults.baseURL contient "http://localhost:8000" ou ton URL de prod
    const baseUrl = api.defaults.baseURL.replace(/\/$/, ""); // On enlève le slash final s'il existe
    const reportUrl = `${baseUrl}/projects/${projectId}/report`;
    
    window.open(reportUrl, '_blank');
  };

  if (!project) return <div className="text-center mt-20">Projet introuvable.</div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />
      
      <div className="max-w-5xl mx-auto pt-32 pb-16 px-6">
        <Link to={backPath} className="inline-flex items-center gap-2 text-gray-500 hover:text-[#E91E63] font-medium mb-8 transition-colors group">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Retour à la bibliothèque
        </Link>

        {/* --- CARROUSEL DE SCREENSHOTS (Tout en haut) --- */}
        {images.length > 0 && (
          <div className="relative w-full aspect-video md:aspect-[21/9] bg-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl mb-12 group">
            {/* Image actuelle */}
            <img 
              src={images[currentImgIndex]} 
              alt={`Screenshot ${currentImgIndex + 1}`}
              className="w-full h-full object-cover transition-opacity duration-500"
            />

            {/* Overlay Gradient (pour que les boutons ressortent) */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />

            {/* Boutons de Navigation (Affichés au hover) */}
            {images.length > 1 && (
              <>
                <button 
                  onClick={prevSlide}
                  className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/90 p-3 rounded-2xl text-slate-900 opacity-0 group-hover:opacity-100 transition-all hover:bg-white shadow-xl"
                >
                  <ChevronLeft size={24} />
                </button>
                <button 
                  onClick={nextSlide}
                  className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/90 p-3 rounded-2xl text-slate-900 opacity-0 group-hover:opacity-100 transition-all hover:bg-white shadow-xl"
                >
                  <ChevronRight size={24} />
                </button>

                {/* Indicateurs (Dots) */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                  {images.map((_, idx) => (
                    <div 
                      key={idx}
                      className={`h-1.5 transition-all rounded-full ${idx === currentImgIndex ? 'w-8 bg-white' : 'w-2 bg-white/50'}`}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Badge Nombre */}
            <div className="absolute top-6 right-6 bg-black/50 backdrop-blur-md text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
              <Maximize2 size={14} /> {currentImgIndex + 1} / {images.length}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* COLONNE GAUCHE */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <span className="bg-[#E91E63]/10 text-[#E91E63] text-xs font-black px-3 py-1 rounded-full uppercase">
                  {project.program?.name || project.program_name}
                </span>
                {project.is_historical && (
                  <span className="bg-amber-100 text-amber-700 text-xs font-black px-3 py-1 rounded-full uppercase">
                    Archive Historique
                  </span>
                )}
              </div>

              <h1 className="text-4xl font-black text-slate-900 mb-6 leading-tight">
                {project.title}
              </h1>

              <div className="prose prose-slate max-w-none">
                <h3 className="text-lg font-bold text-slate-800 mb-3">Description du projet</h3>
                <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                  {project.description || "Aucune description détaillée."}
                </p>
              </div>

              <div className="mt-10 pt-8 border-t border-slate-50">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Code size={16} /> Stack Technique
                </h3>
                <div className="flex flex-wrap gap-2">
                  {project.primary_language && (
                    <span className="bg-[#E91E63] text-white px-4 py-1.5 rounded-xl text-sm font-bold flex items-center gap-2">
                      {project.primary_language}
                    </span>
                  )}
                  {project.technologies_list && 
                    project.technologies_list.split(", ")
                      .filter(lang => lang !== project.primary_language)
                      .map((lang, index) => (
                        <span key={`lang-${index}`} className="bg-slate-800 text-slate-100 px-4 py-1.5 rounded-xl text-sm font-medium">
                          {lang}
                        </span>
                    ))
                  }
                </div>
              </div>
            </div>
            
            <NoraSummary summary={noraText} isLoading={loadingNora} />
          </div>

          {/* COLONNE DROITE */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-xs font-black text-slate-400 uppercase mb-4">Informations</h3>
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-50 rounded-lg text-slate-400"><User size={20} /></div>
                        <div>
                            <p className="text-[10px] text-slate-400 uppercase font-bold leading-none">Auteur</p>
                            <p className="text-sm font-bold text-slate-700">{authorDisplay}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-50 rounded-lg text-slate-400"><Calendar size={20} /></div>
                        <div>
                            <p className="text-[10px] text-slate-400 uppercase font-bold leading-none">Promotion</p>
                            <p className="text-sm font-bold text-slate-700">{project.academic_year?.label || project.year}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-3">
              <h3 className="text-xs font-black text-slate-400 uppercase mb-4">Livrables</h3>
              
              {project.github_repository_url && (
                  <a href={project.github_repository_url} target="_blank" rel="noreferrer" 
                    className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-black transition-all">
                      <Github size={20} /> Code Source
                  </a>
              )}

              {project.report_pdf_url && (
                <button 
                  onClick={() => handleViewReport(project.id)} 
                  className="w-full flex items-center justify-center gap-2 border-2 border-slate-100 text-slate-700 py-4 rounded-2xl font-bold hover:bg-slate-50 transition-all"
                >
                  <FileText size={20} className="text-[#E91E63]" /> 
                  Consulter le Rapport
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;