import React, { useState, useEffect } from 'react';
import { X, FileText, Github, User, BookOpen, Calendar, Rocket, Loader2, Layers, AlignLeft } from 'lucide-react';
import api from "../api/axios";

const HistoricalUploadModal = ({ isOpen, onClose, refreshData }) => {
  const [loading, setLoading] = useState(false);
  const [programs, setPrograms] = useState([]);
  const [years, setYears] = useState([]);
  
  const [formData, setFormData] = useState({
    title: '',
    author_name: '',
    github_url: '',
    program_id: '',
    academic_year_id: '',
    level: 'L3',
    description: ''
  });
  const [reportFile, setReportFile] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    const fetchMetadata = async () => {
      try {
        const [resPrograms, resYears] = await Promise.all([
          api.get('/programs'),
          api.get('/academic-years')
        ]);
        setPrograms(resPrograms.data);
        setYears(resYears.data);
      } catch (err) {
        console.error("Erreur de chargement des métadonnées :", err);
      }
    };
    fetchMetadata();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const data = new FormData();

    data.append('title', formData.title);
    data.append('author_name', formData.author_name);
    data.append('program_id', formData.program_id);
    data.append('academic_year_id', formData.academic_year_id);
    data.append('level', formData.level);
    data.append('github_url', formData.github_url || "");
    data.append('description', formData.description || "");
    
    if (reportFile) data.append('report_file', reportFile);

    try {
      await api.post('/historical-upload', data);
      alert("Projet historique archivé avec succès !");
      refreshData();
      onClose();
    } catch (err) {
      alert(err.response?.data?.detail || "Erreur lors de l'archivage.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-3xl rounded-[40px] shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-300 border border-white/20">
        
        {/* Header Style "Console Admin" */}
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-[#FDFDFD]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Layers size={14} className="text-[#E91E63]" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Admin Archive Tool</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Archivage <span className="text-[#004751]">Historique</span></h2>
          </div>
          <button onClick={onClose} className="p-4 hover:bg-slate-100 rounded-2xl transition-all group">
            <X size={20} className="text-slate-300 group-hover:text-slate-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
            
            {/* Titre - Full width */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Titre du Projet</label>
              <div className="relative">
                <FileText className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input required type="text" placeholder="Ex: Système de reconnaissance faciale" value={formData.title}
                  className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-[20px] text-sm font-semibold focus:ring-2 focus:ring-[#004751]/10 transition-all outline-none text-slate-700" 
                  onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
            </div>

            {/* Auteur */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Auteur (Ancien)</label>
              <div className="relative">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input required type="text" placeholder="Nom de l'étudiant" value={formData.author_name}
                  className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-[20px] text-sm font-semibold outline-none" 
                  onChange={e => setFormData({...formData, author_name: e.target.value})} />
              </div>
            </div>

            {/* GitHub */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Lien Repository</label>
              <div className="relative">
                <Github className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input type="url" placeholder="GitHub URL (Facultatif)" value={formData.github_url}
                  className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-[20px] text-sm font-semibold outline-none" 
                  onChange={e => setFormData({...formData, github_url: e.target.value})} />
              </div>
            </div>

            {/* Filière */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Filière</label>
              <div className="relative">
                <BookOpen className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <select required value={formData.program_id}
                  className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-[20px] text-sm font-semibold outline-none appearance-none text-slate-700"
                  onChange={e => setFormData({...formData, program_id: e.target.value})}>
                  <option value="">Sélectionner...</option>
                  {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>

            {/* Promotion / Année */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Promotion</label>
              <div className="relative">
                <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <select required value={formData.academic_year_id}
                  className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-[20px] text-sm font-semibold outline-none appearance-none text-slate-700"
                  onChange={e => setFormData({...formData, academic_year_id: e.target.value})}>
                  <option value="">Choisir l'année...</option>
                  {years.map(y => <option key={y.id} value={y.id}>{y.label}</option>)}
                </select>
              </div>
            </div>

            {/* Rapport PDF & Niveau */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Rapport PDF</label>
              <label className="flex items-center gap-3 w-full px-5 py-4 bg-slate-50 border-2 border-dashed border-slate-100 rounded-[20px] cursor-pointer hover:bg-slate-100 transition-all">
                <Rocket size={18} className="text-slate-300" />
                <span className="text-xs font-bold text-slate-400 truncate uppercase">
                  {reportFile ? reportFile.name : "Fichier facultatif"}
                </span>
                <input type="file" accept=".pdf" className="hidden" onChange={e => setReportFile(e.target.files[0])} />
              </label>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Niveau</label>
              <select required value={formData.level}
                className="w-full px-6 py-4 bg-slate-50 border-none rounded-[20px] text-sm font-semibold outline-none appearance-none text-slate-700"
                onChange={e => setFormData({...formData, level: e.target.value})}>
                <option value="L1">Licence 1</option>
                <option value="L2">Licence 2</option>
                <option value="L3">Licence 3</option>
                <option value="M1">Master 1</option>
                <option value="M2">Master 2</option>
              </select>
            </div>

            {/* Description - SPAN FULL WIDTH */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Description / Synthèse</label>
              <div className="relative">
                <AlignLeft className="absolute left-5 top-5 text-slate-300" size={18} />
                <textarea placeholder="Décrivez brièvement le projet pour l'index Nora..." value={formData.description}
                  className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-[24px] text-sm font-semibold h-32 resize-none outline-none focus:ring-2 focus:ring-[#004751]/10 transition-all text-slate-700" 
                  onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
            </div>

          </div>

          <div className="mt-10">
            <button disabled={loading} type="submit" 
              className="w-full py-5 bg-[#004751] text-white rounded-[26px] font-black uppercase text-[11px] tracking-[0.25em] hover:bg-slate-900 transition-all flex items-center justify-center gap-3 shadow-2xl shadow-teal-900/30 disabled:opacity-50 active:scale-[0.98]">
              {loading ? <Loader2 className="animate-spin" size={20} /> : "Archiver définitivement"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HistoricalUploadModal;