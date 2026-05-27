import React from "react";
import { User, Calendar, Github, FileText, Download } from "lucide-react";

const ProjectSidebar = ({ 
  project, 
  authorDisplay, 
  handleViewReport, 
  handleDownloadReport 
}) => {
  return (
    <div className="space-y-6">
      {/* 1. SECTION INFORMATIONS */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-xs font-black text-slate-400 uppercase mb-4">
          Informations
        </h3>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
              <User size={20} />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold leading-none">
                Auteur
              </p>
              <p className="text-sm font-bold text-slate-700">
                {authorDisplay}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
              <Calendar size={20} />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold leading-none">
                Promotion
              </p>
              <p className="text-sm font-bold text-slate-700">
                {project.academic_year?.label || project.year}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SECTION LIVRABLES */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-3">
        <h3 className="text-xs font-black text-slate-400 uppercase mb-4">
          Livrables
        </h3>

        {project.github_repository_url && (
          <a
            href={project.github_repository_url}
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center justify-center gap-2 bg-[#669099] text-white py-4 rounded-2xl font-bold hover:bg-[#004751] transition-all"
          >
            <Github size={20} /> Code Source
          </a>
        )}

        {project.report_pdf_url && (
          <>
            <button
              onClick={() => handleViewReport(project.id)}
              className="w-full flex items-center justify-center gap-2 border-2 border-slate-100 text-slate-700 py-4 rounded-2xl font-bold hover:bg-slate-50 transition-all"
            >
              <FileText size={20} className="text-[#E91E63]" />
              Consulter le Rapport
            </button>

            <button
              onClick={() => handleDownloadReport(project.id)}
              className="w-full flex items-center justify-center gap-2 bg-slate-50 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-100 transition-all border border-slate-200"
            >
              <Download size={20} />
              Télécharger (PDF)
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ProjectSidebar;