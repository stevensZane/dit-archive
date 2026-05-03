import React, { useState } from 'react';
import { 
  ExternalLink, Trash2, Loader2, AlertCircle, 
  BrainCircuit, Github, User, Calendar, Eye
} from 'lucide-react';
import api from "../api/axios";
import { Link } from 'react-router-dom';

const ProjectItem = ({ project, refresh }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isIngesting, setIsIngesting] = useState(false);

  // --- ACTION : SUPPRIMER ---
  const handleDelete = async () => {
    if (!window.confirm(`Supprimer définitivement le projet "${project.title}" ?`)) return;
    
    setIsDeleting(true);
    try {
      await api.delete(`/admin/projects/${project.id}`);
      const cached = JSON.parse(localStorage.getItem("dit_admin_projects_cache") || "[]");
      const updated = cached.filter(p => p.id !== project.id);
      localStorage.setItem("dit_admin_projects_cache", JSON.stringify(updated));
      
      refresh(true); 
    } catch (err) {
      alert("Erreur lors de la suppression.");
    } finally {
      setIsDeleting(false);
    }
  };

  // --- ACTION : APPRENDRE (Ingestion Nora) ---
  const handleIngest = async () => {
    setIsIngesting(true);
    try {
      await api.post(`/chatbot/ingest/${project.id}`);
      alert("Nora analyse maintenant ce projet pour enrichir son savoir.");
    } catch (err) {
      alert("Erreur lors de l'apprentissage.");
    } finally {
      setIsIngesting(false);
    }
  };

  return (
    <div className="group bg-white border border-slate-100 rounded-[32px] p-6 shadow-sm hover:shadow-xl hover:border-purple-100 transition-all duration-300 flex flex-col md:flex-row justify-between items-center gap-6">
      
      {/* INFOS PROJET */}
      <div className="flex-1 w-full">
        <div className="flex items-center gap-3 mb-3">
          <span className="bg-slate-900 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">
            ID-{project.id}
          </span>
          
          <div className="flex items-center gap-1.5 text-slate-400">
            <User size={12} />
            <span className="text-[10px] font-bold uppercase italic">
              {project.owner?.first_name} {project.owner?.last_name || "Étudiant"}
            </span>
          </div>

          {project.analysis_status === 'error' && (
            <span className="text-red-500 text-[9px] font-black uppercase bg-red-50 px-3 py-1 rounded-full flex items-center gap-1 animate-pulse">
              <AlertCircle size={10} /> Échec Analyse
            </span>
          )}
        </div>

        {/* Titre maintenant cliquable via Link */}
        <Link to={`/project/${project.id}`}>
          <h3 className="text-lg font-black text-slate-900 mb-1 group-hover:text-[#E91E63] transition-colors cursor-pointer">
            {project.title}
          </h3>
        </Link>
        
        <p className="text-sm text-slate-500 line-clamp-2 max-w-xl leading-relaxed">
          {project.description || "Aucune description fournie pour ce projet."}
        </p>

        <div className="flex items-center gap-4 mt-4 text-slate-300">
            <div className="flex items-center gap-1 text-[10px] font-bold uppercase">
                <Calendar size={12} /> {new Date(project.created_at).toLocaleDateString()}
            </div>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="flex items-center gap-3 w-full md:w-auto justify-end border-t md:border-t-0 pt-4 md:pt-0">
        
        {/* BOUTON APPRENDRE */}
        <button 
          onClick={handleIngest}
          disabled={isIngesting || project.analysis_status === 'error'}
          className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-purple-50 text-purple-600 rounded-2xl text-[10px] font-black uppercase hover:bg-purple-600 hover:text-white transition-all border border-purple-100 disabled:opacity-30 disabled:hover:bg-purple-50 disabled:hover:text-purple-600"
          title="Ajouter ce projet à la mémoire de Nora"
        >
          {isIngesting ? <Loader2 size={14} className="animate-spin" /> : <BrainCircuit size={14} />}
          <span>Apprendre</span>
        </button>

        {/* NOUVEAU : BOUTON VOIR LE PROJET (Lien interne) */}
        <Link 
          to={`/project/${project.id}`}
          className="p-3.5 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all"
          title="Voir la fiche détaillée"
        >
          <Eye size={18} />
        </Link>

        {/* LIEN GITHUB (Lien externe) */}
        <a 
          href={project.github_repository_url} 
          target="_blank" 
          rel="noreferrer" 
          className="p-3.5 bg-slate-50 text-slate-400 hover:text-[#004751] hover:bg-slate-100 rounded-2xl transition-all"
          title="Ouvrir le dépôt GitHub"
        >
          <Github size={18} />
        </a>
        
        {/* BOUTON SUPPRIMER */}
        <button 
          onClick={handleDelete}
          disabled={isDeleting}
          className="p-3.5 bg-white border-2 border-slate-50 text-slate-200 hover:text-red-500 hover:border-red-50 rounded-2xl transition-all"
          title="Supprimer le projet"
        >
          {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
        </button>
      </div>
    </div>
  );
};

export default ProjectItem;