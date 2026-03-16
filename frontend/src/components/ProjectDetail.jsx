import { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { ArrowLeft, Github, FileText, Sparkles, Code, User, Calendar } from "lucide-react";
import api from "./api/axios";
import Navbar from "./Navbar";
import NoraSummary from "./NoraSummary";


const ProjectDetail = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const [noraText, setNoraText] = useState("");
  const [loadingNora, setLoadingNora] = useState(true);

  useEffect(() => {
    api.get(`/projects/${id}/ai-summary`)
        .then(res => {
            setNoraText(res.data.summary);
            setLoadingNora(false);
        })
        .catch(() => setLoadingNora(false));
  }, [id]);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await api.get(`/projects/${id}`);
        setProject(res.data);
      } catch (err) {
        console.error("Erreur Nora:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [id]);

  const backPath = location.state?.from || "/explore";

  // Gestion de l'affichage de l'auteur (Actif vs Historique)
  const authorDisplay = project?.is_historical 
    ? project.author_name 
    : `${project?.owner?.first_name} ${project?.owner?.last_name}`;

    // console.log(project)
  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen text-dit-teal">
      <div className="animate-spin mb-4"><Sparkles size={40} /></div>
      <p className="font-bold animate-pulse">Nora prépare le dossier...</p>
    </div>
  );

  if (!project) return <div className="text-center mt-20">Projet introuvable.</div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />
      
      <div className="max-w-5xl mx-auto pt-32 pb-16 px-6">
        {/* Navigation */}
        <Link to={backPath} className="inline-flex items-center gap-2 text-gray-500 hover:text-dit-pink font-medium mb-8 transition-colors group">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Retour à la bibliothèque
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* COLONNE GAUCHE : Contenu Principal */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <span className="bg-dit-pink/10 text-dit-pink text-xs font-black px-3 py-1 rounded-full uppercase">
                  {project.program?.name}
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

              {/* Technologies utilisées */}
              <div className="mt-10 pt-8 border-t border-slate-50">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Code size={16} /> Stack Technique
                </h3>
                <div className="flex flex-wrap gap-2">
                  {project.technologies?.map((t) => (
                    <span key={t.id} className="bg-slate-50 text-black-600 border border-slate-100 px-4 py-1.5 rounded-xl text-sm font-medium">
                      {t.name}
                    </span>
                  ))}
                  {project.primary_language && (
                    <span className="bg-dit-pink text-black px-4 py-1.5 rounded-xl text-sm font-bold">
                      {project.primary_language}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* BOX NORA : RÉSUMÉ IA */}
            {/* <div className="bg-gradient-to-br from-dit-teal to-[#005F6B] rounded-3xl p-8 md:p-10 text-white shadow-lg relative overflow-hidden">
                <Sparkles className="absolute top-4 right-4 opacity-20" size={80} />
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    L'analyse de Nora
                </h3>
                <p className="text-teal-50 leading-relaxed italic">
                    "{project.ai_summary || "Je suis en train d'analyser le contenu de ce projet pour vous en proposer un résumé pertinent. Revenez dans quelques instants !"}"
                </p>
            </div> */}
            <NoraSummary summary={noraText} isLoading={loadingNora} />
          </div>

          {/* COLONNE DROITE : Sidebar Info & Actions */}
          <div className="space-y-6">
            {/* Carte Auteur */}
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
                            <p className="text-sm font-bold text-slate-700">{project.academic_year?.label}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Ressources & Téléchargements */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-3">
            
            <h3 className="text-xs font-black text-slate-400 uppercase mb-4">Livrables</h3>
            
            {/* Bouton GitHub (Code) */}
            {project.github_repository_url && (
                <a href={project.github_repository_url} target="_blank" rel="noreferrer" 
                  className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-black transition-all">
                    <Github size={20} /> Code Source
                </a>
            )}

            {/* Bouton PDF (Rapport) - UTILISE LE PROXY MAINTENANT */}
            {project.report_pdf_url && (
                <a 
                  href={`http://localhost:8000/projects/${project.id}/report`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="w-full flex items-center justify-center gap-2 border-2 border-slate-100 text-slate-700 py-4 rounded-2xl font-bold hover:bg-slate-50 transition-all"
                >
                    <FileText size={20} className="text-dit-pink" /> Consulter le Rapport
                </a>
            )}
        </div>

                

                {!project.report_pdf_url && !project.github_repository_url && (
                    <p className="text-xs text-slate-400 text-center italic">Aucune ressource publique disponible.</p>
                )}
            </div>
          </div>

        </div>
      </div>
    
  );
};

export default ProjectDetail;