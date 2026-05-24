import React from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Trash2, ArrowRight, ShieldCheck, CircleDashed, CheckCheck, Check } from 'lucide-react';

const ProjectCard = ({ project, onEdit }) => {
  const isAnalyzed = project.analysis_status === 'completed';

  return (
    <div className="group relative bg-white border border-slate-100 p-6 rounded-3xl flex justify-between items-center hover:border-dit-pink/30 hover:shadow-xl transition-all">
      {/* Lien vers la vue détail */}
      <Link to={`/project/${project.id}`} className="flex items-center gap-6 flex-1">
        <div className={`p-4 rounded-2xl transition-all duration-300 ${
            isAnalyzed 
                ? 'bg-emerald-100 text-emerald-600' 
                : 'bg-emerald-50 text-emerald-500'
            }`}>
            {isAnalyzed ? (
                /* Validation finale par Nora (double check) */
                <CheckCheck size={24} strokeWidth={2.5} />
            ) : (
                /* Validation initiale de réception (simple check) */
                <Check size={24} strokeWidth={2.5} />
            )}
        </div>
        
        <div>
          <h3 className="font-bold text-lg text-slate-800 group-hover:text-dit-pink transition-colors">
            {project.title}
          </h3>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter mb-2">
            {project.program?.name || 'Filière'} • {project.academic_year?.label || 'Année'}
          </p>
          
          <div className="flex flex-wrap gap-1.5">
            {project.technologies_list ? (
              project.technologies_list.split(',').slice(0, 4).map(tech => (
                <span key={tech.trim()} className="text-[9px] font-black bg-slate-50 text-slate-500 px-2 py-0.5 rounded border border-slate-100 uppercase">
                  {tech.trim()}
                </span>
              ))
            ) : (
              <span className="text-[10px] text-slate-300 italic">Analyse par Nora en cours...</span>
            )}
          </div>
        </div>
      </Link>

      {/* Actions */}
      <div className="flex items-center gap-3 ml-4">
        <button 
          onClick={() => onEdit(project)} 
          className="p-3 text-slate-300 hover:text-dit-teal hover:bg-teal-50 rounded-xl transition-all"
          title="Modifier le projet"
        >
          <Pencil size={18} />
        </button>
        
        <button 
          className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
          title="Supprimer le projet"
        >
          <Trash2 size={18} />
        </button>
        
        <div className="w-[1px] h-8 bg-slate-100 mx-1"></div>
        
        <ArrowRight size={18} className="text-slate-300 group-hover:text-dit-pink group-hover:translate-x-1 transition-all" />
      </div>
    </div>
  );
};

export default ProjectCard;