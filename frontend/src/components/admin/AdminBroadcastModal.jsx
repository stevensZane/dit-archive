import React, { useState } from "react";
import { X, Megaphone, Send, AlertCircle } from "lucide-react";
import api from "../api/axios";

export default function AdminBroadcastModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return alert("Veuillez remplir tous les champs.");

    if (!window.confirm("Valider l'envoi de ce mail à l'ENSEMBLE des étudiants de la base ?")) return;

    setSending(true);
    try {
      const res = await api.post("/admin/broadcast", { subject, message });
      alert(res.data.message || "Diffusion générale lancée en arrière-plan !");
      setSubject("");
      setMessage("");
      onClose();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'initiation de la diffusion.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-pink-50 text-pink-600 rounded-xl">
              <Megaphone size={20} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-pink-600">Diffusion Globale</span>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Broadcast E-mails</h2>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-slate-400">
            <X size={18} />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleBroadcast} className="p-8 space-y-5">
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200/60 text-amber-800 p-4 rounded-2xl text-xs font-medium leading-relaxed">
            <AlertCircle size={20} className="shrink-0 text-amber-600" />
            <p>
              Cette action est sensible. L'e-mail sera envoyé de manière asynchrone par Nora à l'ensemble des comptes du DIT enregistrés avec le rôle <strong className="uppercase">student</strong>.
            </p>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-700 mb-2 block">Objet de la communication</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ex: [DIT] Clôture des dépôts de projets de fin de cycle"
              className="w-full p-4 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-[#004751] border-transparent outline-none font-medium text-slate-800 shadow-sm transition-all"
              required
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-700 mb-2 block">Message de l'annonce (Supporte le saut de ligne)</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Écrivez votre communiqué ici..."
              rows="6"
              className="w-full p-4 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-[#004751] border-transparent outline-none text-slate-700 shadow-sm transition-all resize-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={sending}
            className="w-full bg-[#004751] hover:bg-slate-900 text-white py-4 px-6 rounded-2xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-teal-900/10 disabled:opacity-50"
          >
            <Send size={14} />
            <span>{sending ? "Envoi groupé en cours..." : "Propulser le message"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}