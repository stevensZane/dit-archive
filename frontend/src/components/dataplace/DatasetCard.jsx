import React, { useState } from "react";
import { Download, ExternalLink, Share2, Check, Trash2, Edit, User as UserIcon } from "lucide-react";

export const DatasetCard = ({ dataset, currentUserId, userRole, onDelete, onEdit }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!dataset.download_url) return;
    navigator.clipboard.writeText(dataset.download_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const canModify =
    currentUserId &&
    (dataset.uploaded_by_id === currentUserId || ["admin", "superadmin"].includes(userRole));

  // Récupération dynamique du nom de l'auteur
  const uploaderName = dataset.uploader
    ? `${dataset.uploader.first_name || ""} ${dataset.uploader.last_name || ""}`.trim() || dataset.uploader.username
    : "Anonyme";

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md hover:border-teal-200 transition-all flex flex-col justify-between group">
      <div>
        {/* Badges + Information Auteur */}
        <div className="flex items-center justify-between mb-3">
          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-[11px] font-bold rounded-lg border border-slate-200/60">
            {dataset.category}
          </span>
          <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-100">
            {dataset.format}
          </span>
        </div>

        <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#004751] transition-colors mb-1">
          {dataset.title}
        </h3>

        {/* Bloc Auteur */}
        <div className="flex items-center gap-2 mb-3">
          {dataset.uploader?.avatar_url ? (
            <img
              src={dataset.uploader.avatar_url}
              alt={uploaderName}
              className="w-4 h-4 rounded-full object-cover"
            />
          ) : (
            <UserIcon size={12} className="text-slate-400" />
          )}
          <span className="text-[11px] font-medium text-slate-400">
            Proposé par <strong className="text-slate-600 font-semibold">{uploaderName}</strong>
          </span>
        </div>

        <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4 line-clamp-3">
          {dataset.description || "Aucune description fournie."}
        </p>
      </div>

      <div className="pt-4 border-t border-slate-100">
        <div className="grid grid-cols-3 gap-2 text-center mb-4 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-slate-600">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Taille</p>
            <p className="text-xs font-bold text-slate-800">{dataset.size_label || "N/A"}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Volume</p>
            <p className="text-xs font-bold text-slate-800">{dataset.rows_label || "Standard"}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Source</p>
            <p className="text-xs font-bold text-slate-800 truncate">{dataset.source_name || "DIT"}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Bouton Téléchargement avec paramètre Cloudinary fl_attachment */}
          <a
            href={
              dataset.download_url?.includes("cloudinary.com")
                ? dataset.download_url.replace("/upload/", `/upload/fl_attachment:${encodeURIComponent(dataset.title)}/`)
                : dataset.download_url
            }
            target="_blank"
            rel="noopener noreferrer"
            download
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#004751] text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all shadow-sm"
          >
            <Download size={14} />
            <span>Accéder / Télécharger</span>
            <ExternalLink size={12} className="opacity-70" />
          </a>

          <button
            onClick={handleCopy}
            title="Copier le lien"
            className="p-2.5 bg-slate-100 hover:bg-slate-200/70 text-slate-600 rounded-xl transition-all"
          >
            {copied ? <Check size={16} className="text-emerald-600" /> : <Share2 size={16} />}
          </button>

          {canModify && (
            <div className="flex items-center gap-1.5 border-l border-slate-200 pl-1.5">
              {onEdit && (
                <button
                  onClick={() => onEdit(dataset)}
                  title="Modifier le dataset"
                  className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all"
                >
                  <Edit size={16} />
                </button>
              )}

              <button
                onClick={() => onDelete(dataset.id)}
                title="Supprimer le dataset"
                className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-all"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};