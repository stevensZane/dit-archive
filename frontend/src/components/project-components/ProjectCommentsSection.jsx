import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import api from "../api/axios";

const ProjectCommentsSection = ({ projectId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const commentsEndRef = useRef(null);

  // --- 1. CHARGEMENT DES COMMENTAIRES ---
  const fetchComments = async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const response = await api.get(`/projects/${projectId}/comments`);
      setComments(response.data);
      if (onCommentsCountChange) onCommentsCountChange(response.data.length);
    } catch (err) {
      console.error("Erreur lors de la récupération des commentaires:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [projectId]);

  // Auto-scroll vers le bas quand un nouveau commentaire arrive
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  // --- 2. ENVOI D'UN COMMENTAIRE ---
  const handleSend = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    try {
      setSubmitting(true);
      await api.post(`/projects/${projectId}/comments`, { content: newComment });
      setNewComment("");
      // On rafraîchit la liste locale après l'envoi
      await fetchComments();
    } catch (err) {
      alert(err.response?.data?.detail || "Impossible d'envoyer le commentaire.");
    } finally {
      setSubmitting(false);
    }
  };

  // Petit helper pour formater joliment la date du back
  const formatDate = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleDateString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col h-[400px]">
      <h3 className="text-xs font-black text-slate-400 uppercase mb-4 flex items-center gap-2">
        <MessageSquare size={14} /> Discussions ({comments.length})
      </h3>

      {/* Zone de chargement ou liste des commentaires */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1 text-sm custom-scrollbar">
        {loading && comments.length === 0 ? (
          <div className="flex justify-center py-10">
            <Loader2 size={20} className="animate-spin text-[#004751]" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-slate-400 text-xs italic text-center py-10">
            Aucun commentaire pour le moment. Soyez le premier !
          </p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="bg-slate-50 p-3 rounded-2xl border border-slate-100/60 transition-all">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-slate-700 text-xs">
                  {c.user?.first_name} {c.user?.last_name} 
                  <span className="text-[10px] text-slate-400 font-normal ml-1.5 bg-slate-200/60 px-1.5 py-0.5 rounded uppercase">
                    {c.user?.role}
                  </span>
                </span>
                <span className="text-[9px] text-slate-400 font-medium">{formatDate(c.created_at)}</span>
              </div>
              <p className="text-slate-600 text-xs leading-relaxed whitespace-pre-line">{c.content}</p>
            </div>
          ))
        )}
        <div ref={commentsEndRef} />
      </div>

      {/* Input de soumission */}
      <form onSubmit={handleSend} className="relative mt-auto">
        <input 
          type="text" 
          placeholder="Ajouter un commentaire..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          disabled={submitting}
          className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#004751]/10 text-slate-700 transition-all disabled:opacity-60"
        />
        <button 
          type="submit" 
          disabled={!newComment.trim() || submitting}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[#004751] text-white rounded-lg hover:bg-slate-900 transition-colors disabled:opacity-40 disabled:hover:bg-[#004751]"
        >
          {submitting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
        </button>
      </form>
    </div>
  );
};

export default ProjectCommentsSection;