import React, { useState } from 'react';
import { X, FileText, Github, User, BookOpen, Calendar, Rocket, Loader2 } from 'lucide-react';
import api from "../api/axios";

const HistoricalUploadModal = ({ isOpen, onClose, refreshData }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    author_name: '',
    github_url: '',
    program_id: '',
    academic_year_id: '',
    level: 'L3', // Par défaut
    description: ''
  });
  const [reportFile, setReportFile] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
  e.preventDefault();
  if (!reportFile) return alert("Le fichier PDF est obligatoire");

  setLoading(true);
  const data = new FormData();

  // On remplit le FormData
  data.append('title', formData.title);
  data.append('author_name', formData.author_name);
  data.append('program_id', formData.program_id);
  data.append('level', formData.level);
  data.append('github_url', formData.github_url || "");
  data.append('description', formData.description || "");
  data.append('report_file', reportFile);

  // LA DOUBLE SÉCURITÉ POUR L'ANNÉE
  // On envoie la même valeur pour les deux noms possibles
  data.append('year_id', formData.academic_year_id); 
  data.append('academic_year_id', formData.academic_year_id); 

  // DEBUG: Affiche dans ta console JS ce qui est envoyé
  console.log("Données envoyées :");
  for (let [key, value] of data.entries()) {
    console.log(`${key}: ${value}`);
  }

  try {
    const response = await api.post('/historical-upload', data);
    alert("Projet archivé avec succès !");
    refreshData();
    onClose();
  } catch (err) {
    console.error("ERREUR SERVEUR :", err.response?.data);
    const detail = err.response?.data?.detail;
    if (detail && detail.length > 0) {
      alert(`Erreur sur le champ : ${detail[0].loc[1]} (${detail[0].msg})`);
    } else {
      alert("Erreur lors de l'archivage.");
    }
  } finally {
    setLoading(false);
  }
};
  

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-[#FDFDFD]">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Archivage <span className="text-[#E91E63]">Historique</span></h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Ajout manuel par administrateur</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-2xl transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Colonne Gauche */}
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Titre du Projet</label>
                <div className="relative">
                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input required type="text" placeholder="Ex: Gestion de Stock" className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-[#004751]/10 transition-all" 
                    onChange={e => setFormData({...formData, title: e.target.value})} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Ancien Étudiant (Auteur)</label>
                <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input required type="text" placeholder="Nom complet" className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-medium" 
                    onChange={e => setFormData({...formData, author_name: e.target.value})} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Lien GitHub (Optionnel)</label>
                <div className="relative">
                    <Github className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input type="url" placeholder="https://github.com/..." className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-medium" 
                    onChange={e => setFormData({...formData, github_url: e.target.value})} />
                </div>
              </div>
            </div>

            {/* Colonne Droite */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Filière ID</label>
                    <input required type="number" placeholder="ID" className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-medium" 
                    onChange={e => setFormData({...formData, program_id: e.target.value})} />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Année ID</label>
                    <input required type="number" placeholder="ID" className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-medium" 
                    onChange={e => setFormData({...formData, academic_year_id: e.target.value})} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Rapport PDF (Obligatoire)</label>
                <label className="flex items-center justify-center w-full p-4 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-50 hover:border-[#004751]/20 transition-all">
                    <div className="flex items-center gap-2 text-slate-400">
                        <Rocket size={18} />
                        <span className="text-xs font-bold uppercase">{reportFile ? reportFile.name.substring(0,20) : "Choisir le PDF"}</span>
                    </div>
                    <input required type="file" accept=".pdf" className="hidden" onChange={e => setReportFile(e.target.files[0])} />
                </label>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Description / Note</label>
                <textarea placeholder="Petit résumé..." className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-medium h-[95px] resize-none" 
                onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
            </div>
          </div>

          <button disabled={loading} type="submit" className="w-full py-5 bg-[#004751] text-white rounded-[24px] font-black uppercase text-[11px] tracking-[0.2em] hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shadow-xl shadow-teal-900/20 disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin" size={18} /> : "Archiver définitivement"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default HistoricalUploadModal;