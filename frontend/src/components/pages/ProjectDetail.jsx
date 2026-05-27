import { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Sparkles,
  Code,
  ChevronLeft,
  ChevronRight,
  Maximize2,
} from "lucide-react";
import api from "../api/axios";
import Navbar from "../navigations/Navbar";
import NoraSummary from "../Nora/NoraSummary";
import ProjectSidebar from "../project-components/ProjectSidebar";

const ProjectDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  // État pour synchroniser le nombre de commentaires sur la carte de stats
  const [commentsCount, setCommentsCount] = useState(0);

  // État structuré pour l'analyse de Nora
  const [noraData, setNoraData] = useState({ summary: "", score: null });
  const [loadingNora, setLoadingNora] = useState(true);

  // État pour le carrousel
  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  useEffect(() => {
    const initProject = () => {
      const cachedProjects = localStorage.getItem("dit_projects_cache");
      if (cachedProjects) {
        const allProjects = JSON.parse(cachedProjects);
        const found = allProjects.find((p) => String(p.id) === String(id));
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

  // --- LOGIQUE DE TRACKING AUTOMATIQUE DES VUES ---
  useEffect(() => {
    if (project?.id) {
      api.post(`/projects/${project.id}/interact?type=view`)
        .catch((err) => console.error("Erreur tracking de la vue :", err));
    }
  }, [project?.id]);

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

  // --- LOGIQUE DU BOUTON LIKE COUPLÉ À TON ENDPOINT ---
  const handleLikeClick = async () => {
    if (!project) return;
    try {
      const res = await api.post(`/projects/${project.id}/like`);
      // Met à jour dynamiquement la colonne likes_count reçue du serveur
      setProject((prev) => ({
        ...prev,
        likes_count: res.data.likes_count,
      }));
    } catch (err) {
      console.error("Erreur lors du toggle like:", err);
    }
  };

  const fetchNoraSummary = async () => {
    setLoadingNora(true);
    try {
      const res = await api.get(`/projects/${id}/ai-summary`);

      let finalSummary = "";
      let finalScore = null;

      if (
        typeof res.data.summary === "string" &&
        res.data.summary.trim().startsWith("{")
      ) {
        try {
          const parsed = JSON.parse(res.data.summary);
          finalSummary = parsed.summary;
          finalScore = parsed.score;
        } catch (e) {
          finalSummary = res.data.summary;
        }
      } else {
        finalSummary = res.data.summary;
        finalScore = res.data.score;
      }

      setNoraData({
        summary: finalSummary,
        score: finalScore,
      });
    } catch (err) {
      console.error("Erreur Nora:", err);
    } finally {
      setLoadingNora(false);
    }
  };

  // --- LOGIQUE CARROUSEL ---
  const images = project?.screenshots ? project.screenshots.split(",") : [];

  const nextSlide = () => {
    setCurrentImgIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentImgIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleViewReport = (projectId) => {
    const baseUrl = api.defaults.baseURL.replace(/\/$/, "");
    const token = localStorage.getItem("votre_cle_token");
    window.open(`${baseUrl}/projects/${projectId}/report?action=view&token=${token}`, "_blank");
  };

  const handleDownloadReport = async (projectId) => {
    try {
      await api.post(`/projects/${projectId}/interact?type=download`);
    } catch (err) {
      console.error("Erreur lors du tracking du téléchargement :", err);
    } finally {
      const baseUrl = api.defaults.baseURL.replace(/\/$/, "");
      const token = localStorage.getItem("votre_cle_token");
      const reportUrl = `${baseUrl}/projects/${projectId}/report?action=download&token=${token}`;

      const link = document.createElement("a");
      link.href = reportUrl;
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  };

  const backPath = location.state?.from || "/explore";
  const authorDisplay = project?.is_historical
    ? project.author_name
    : `${project?.owner?.first_name || ""} ${project?.owner?.last_name || ""}`;

  if (loading && !project)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-[#004751]">
        <div className="animate-spin mb-4">
          <Sparkles size={40} />
        </div>
        <p className="font-bold animate-pulse">Nora prepares the folder...</p>
      </div>
    );

  if (!project)
    return <div className="text-center mt-20">Projet introuvable.</div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />

      <div className="max-w-5xl mx-auto pt-32 pb-16 px-6">
        <Link
          to={backPath}
          className="inline-flex items-center gap-2 text-gray-500 hover:text-[#E91E63] font-medium mb-8 transition-colors group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Retour à la bibliothèque
        </Link>

        {/* --- CARROUSEL DE SCREENSHOTS --- */}
        {images.length > 0 && (
          <div className="relative w-full aspect-video md:aspect-[21/9] bg-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl mb-12 group">
            <img
              src={images[currentImgIndex]}
              alt={`Screenshot ${currentImgIndex + 1}`}
              className="w-full h-full object-cover transition-opacity duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
            {images.length > 1 && (
              <>
                <button onClick={prevSlide} className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/90 p-3 rounded-2xl text-slate-900 opacity-0 group-hover:opacity-100 transition-all hover:bg-white shadow-xl">
                  <ChevronLeft size={24} />
                </button>
                <button onClick={nextSlide} className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/90 p-3 rounded-2xl text-slate-900 opacity-0 group-hover:opacity-100 transition-all hover:bg-white shadow-xl">
                  <ChevronRight size={24} />
                </button>
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                  {images.map((_, idx) => (
                    <div key={idx} className={`h-1.5 transition-all rounded-full ${idx === currentImgIndex ? "w-8 bg-white" : "w-2 bg-white/50"}`} />
                  ))}
                </div>
              </>
            )}
            <div className="absolute top-6 right-6 bg-black/50 backdrop-blur-md text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
              <Maximize2 size={14} /> {currentImgIndex + 1} / {images.length}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <span className="bg-[#007A87]/10 text-black text-xs font-black px-3 py-1 rounded-full uppercase">
                  {project.program?.name || project.program_name}
                </span>
                {project.is_historical && (
                  <span className="bg-amber-100 text-amber-700 text-xs font-black px-3 py-1 rounded-full uppercase">
                    Archive Historique
                  </span>
                )}
              </div>

              <h1 className="text-4xl font-black text-slate-900 mb-6 leading-tight">{project.title}</h1>
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
                    <span className="bg-[#004751] text-white px-4 py-1.5 rounded-xl text-sm font-bold">
                      {project.primary_language}
                    </span>
                  )}
                  {project.technologies_list &&
                    project.technologies_list
                      .split(", ")
                      .filter((lang) => lang !== project.primary_language)
                      .map((lang, index) => (
                        <span key={`lang-${index}`} className="bg-[#669099] text-slate-100 px-4 py-1.5 rounded-xl text-sm font-medium">
                          {lang}
                        </span>
                      ))}
                </div>
              </div>
            </div>

            <NoraSummary summary={noraData.summary} score={noraData.score} isLoading={loadingNora} />
          </div>

          {/* SIDEBAR AVEC TRANSMISSION DES ETATS ET DU CLIC LIKE */}
          <ProjectSidebar
            project={project}
            authorDisplay={authorDisplay}
            noraScore={noraData.score}
            commentsCount={commentsCount}
            onCommentsCountChange={setCommentsCount}
            onLikeClicked={handleLikeClick}
            handleViewReport={handleViewReport}
            handleDownloadReport={handleDownloadReport}
          />
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;