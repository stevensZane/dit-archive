import React, { useState, useEffect } from "react";
import { X, CheckCircle, Clock, User, Send, MessageSquare } from "lucide-react";
import api from "../api/axios";

export default function AdminFeedbacksModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const [feedbacks, setFeedbacks] = useState([]);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchFeedbacks = async () => {
    try {
      const response = await api.get("/admin/feedbacks");
      setFeedbacks(response.data);
    } catch (err) {
      console.error("Erreur feedbacks:", err);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const handleResolve = async (id) => {
    if (!adminNotes.trim()) return alert("Veuillez saisir une note de résolution.");
    setLoading(true);
    try {
      await api.post(`/admin/feedbacks/${id}/resolve`, { admin_notes: adminNotes });
      alert("Ticket clos et étudiant notifié par mail !");
      setAdminNotes("");
      setSelectedFeedback(null);
      fetchFeedbacks();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la clôture du ticket.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-5xl h-[85vh] rounded-[32px] shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header Modal */}
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-50 text-[#004751] rounded-xl">
              <MessageSquare size={20} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#004751]">Tickets Système</span>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Feedbacks Utilisateurs</h2>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-slate-400">
            <X size={18} />
          </button>
        </div>

        {/* Corps du Modal en 2 colonnes */}
        <div className="flex-1 flex overflow-hidden">
          {/* Colonne Gauche : Liste */}
          <div className="w-7/12 border-r border-slate-100 overflow-y-auto p-6 space-y-3">
            {feedbacks.length === 0 ? (
              <p className="text-slate-400 italic text-sm text-center py-10">Aucun retour utilisateur pour le moment.</p>
            ) : (
              feedbacks.map((fb) => (
                <div
                  key={fb.id}
                  onClick={() => !fb.is_resolved && setSelectedFeedback(fb)}
                  className={`p-4 rounded-2xl border transition-all ${
                    fb.is_resolved 
                      ? "bg-slate-50/60 border-slate-100 opacity-60" 
                      : `bg-white border-slate-200 hover:border-[#004751] cursor-pointer shadow-sm ${selectedFeedback?.id === fb.id ? "ring-2 ring-[#004751] border-transparent" : ""}`
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className={`px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md ${
                      fb.type === "bug" ? "bg-red-50 text-red-700" : fb.type === "suggestion" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-700"
                    }`}>
                      {fb.type}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider">
                      {fb.is_resolved ? (
                        <span className="text-green-600 flex items-center gap-1"><CheckCircle size={12} /> Résolu</span>
                      ) : (
                        <span className="text-orange-500 flex items-center gap-1"><Clock size={12} /> En attente</span>
                      )}
                    </span>
                  </div>
                  <p className="text-slate-800 font-medium text-sm mb-3 leading-relaxed">{fb.message}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 border-t pt-2 border-slate-50">
                    <span className="flex items-center gap-1 font-bold text-slate-500 uppercase"><User size={12} /> {fb.user?.full_name}</span>
                    <span>{new Date(fb.created_at).toLocaleDateString("fr-FR")}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Colonne Droite : Formulaire d'action */}
          <div className="w-5/12 bg-slate-50/50 p-6 flex flex-col justify-between">
            {selectedFeedback ? (
              <div className="space-y-5 flex-1 flex flex-col">
                <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-inner">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-1">Message reçu :</span>
                  <p className="text-slate-600 italic text-sm">"{selectedFeedback.message}"</p>
                </div>

                <div className="flex-1 flex flex-col">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-700 mb-2 block">Notes de l'équipe technique & Réponse Mail :</label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Ex: Le correctif a été déployé en prod sur Railway. Merci !"
                    className="w-full flex-1 p-4 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-[#004751] border-transparent outline-none resize-none shadow-sm"
                  />
                </div>

                <button
                  onClick={() => handleResolve(selectedFeedback.id)}
                  disabled={loading}
                  className="w-full bg-[#004751] hover:bg-slate-900 text-white py-3.5 px-4 rounded-2xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-teal-900/10 disabled:opacity-50"
                >
                  <Send size={14} />
                  <span>{loading ? "Traitement..." : "Clôturer & Envoyer Mail"}</span>
                </button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 p-6">
                <MessageSquare size={36} className="opacity-30 mb-3" />
                <p className="text-xs font-medium max-w-xs italic">Sélectionnez un ticket en attente sur la gauche pour rédiger une note et le résoudre.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}