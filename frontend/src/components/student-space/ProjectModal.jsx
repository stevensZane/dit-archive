import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Github, FileText, Image as ImageIcon, Send, Loader2, Trash2, ExternalLink } from 'lucide-react';
import api from "../api/axios";

const ProjectModal = ({ isOpen, onClose, onUploadSuccess, initialData = null }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [draft, setDraft] = useState({
    title: '',
    description: '',
    github_url: ''
  });

  // Barre de progression basée sur les champs restants
  const filledFields = [draft.title, draft.description, draft.github_url, selectedPdf].filter(Boolean).length;
  const progressPercent = (filledFields / 4) * 100;

  useEffect(() => {
    if (initialData) {
      setDraft({
        title: initialData.title || '',
        description: initialData.description || '',
        github_url: initialData.github_url || ''
      });
      // Note: On ne pré-remplit pas les fichiers (sécurité navigateur)
    } else {
      setDraft({ title: '', description: '', github_url: '' });
      setSelectedPdf(null);
      setSelectedImages([]);
      setPreviews([]);
    }
  }, [initialData, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDraft(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedImages(prev => [...prev, ...files]);
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('title', draft.title);
    formData.append('description', draft.description);
    formData.append('github_url', draft.github_url);

    if (selectedPdf) formData.append('report_pdf', selectedPdf);
    selectedImages.forEach(file => formData.append('screenshot_files', file));

    try {
      if (initialData) {
        // ENDPOINT DE MODIFICATION
        await api.put(`/projects/${initialData.id}`, formData);
      } else {
        // ENDPOINT DE CRÉATION
        await api.post('/upload', formData);
      }
      onUploadSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || "Erreur lors de l'opération.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="flex min-h-full items-center justify-center p-4 sm:p-10">
        <div className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
          
          {/* BARRE DE PROGRESSION */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100">
            <div 
              className="h-full bg-dit-pink transition-all duration-700 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="p-10 pb-6 flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight italic">
                {initialData ? 'Modifier' : 'Nouveau'} <span className="text-dit-pink">Dépôt</span>
              </h2>
              <p className="text-slate-500 font-medium mt-1">Nora synchronise avec ton profil étudiant.</p>
            </div>
            <button onClick={onClose} className="p-4 bg-slate-50 text-slate-400 hover:text-slate-900 hover:rotate-90 rounded-2xl transition-all">
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-10 pt-4 space-y-8">
            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3 text-sm font-bold border border-red-100">
                <AlertCircle size={20} /> {error}
              </div>
            )}

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Titre du Projet</label>
                <input required name="title" type="text" value={draft.title} onChange={handleInputChange} className="w-full bg-slate-50 border-none rounded-2xl px-6 py-5 font-bold focus:ring-2 focus:ring-dit-teal/20 outline-none transition-all placeholder:text-slate-300" placeholder="Ex: Dashboard DIT" />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Description</label>
                <textarea required name="description" rows="3" value={draft.description} onChange={handleInputChange} className="w-full bg-slate-50 border-none rounded-2xl px-6 py-5 font-medium text-slate-700 focus:ring-2 focus:ring-dit-teal/20 outline-none transition-all resize-none" placeholder="Décrivez votre travail..." />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black uppercase text-dit-pink tracking-[0.2em] flex items-center gap-2"><Github size={14}/> GitHub URL</label>
                    <a href="https://github.com/join" target="_blank" rel="noreferrer" className="text-[10px] font-bold text-slate-400 hover:text-dit-pink flex items-center gap-1">
                        Besoin d'un compte ? <ExternalLink size={10}/>
                    </a>
                </div>
                <input required name="github_url" type="url" value={draft.github_url} onChange={handleInputChange} className="w-full bg-pink-50/30 border border-pink-100 rounded-2xl px-6 py-5 font-bold text-dit-pink outline-none" placeholder="https://github.com/..." />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1 flex items-center gap-2"><FileText size={14}/> Rapport (PDF)</label>
                  <div className="relative group h-14">
                    <input type="file" accept=".pdf" onChange={(e) => setSelectedPdf(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <div className={`w-full h-full border-2 border-dashed rounded-2xl flex items-center justify-center transition-all ${selectedPdf ? 'bg-teal-50 border-dit-teal' : 'bg-slate-50 border-slate-200'}`}>
                      <span className="text-[10px] font-bold truncate px-2 text-slate-400">
                          {selectedPdf ? selectedPdf.name : "Nouveau PDF"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1 flex items-center gap-2"><ImageIcon size={14}/> Screenshots</label>
                  <div className="relative group h-14">
                    <input type="file" accept="image/*" multiple onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <div className="w-full h-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center group-hover:border-dit-pink transition-all">
                      <span className="text-[10px] font-bold text-slate-400">Ajouter des images</span>
                    </div>
                  </div>
                </div>
              </div>

              {previews.length > 0 && (
                <div className="grid grid-cols-4 gap-4 p-4 bg-slate-50 rounded-3xl border border-slate-100 shadow-inner">
                  {previews.map((src, index) => (
                    <div key={index} className="relative group aspect-square rounded-xl overflow-hidden border-2 border-white shadow-sm">
                      <img src={src} alt="preview" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeImage(index)} className="absolute inset-0 bg-red-500/80 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button type="submit" disabled={loading} className={`w-full py-6 rounded-[24px] font-black text-sm uppercase tracking-[0.2em] flex justify-center items-center gap-4 transition-all ${loading ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white hover:bg-dit-teal shadow-xl shadow-teal-100 hover:-translate-y-1'}`}>
              {loading ? <Loader2 className="animate-spin" size={24} /> : <Send size={20}/>}
              {loading ? "Traitement..." : initialData ? "Sauvegarder les modifications" : "Lancer l'archivage"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProjectModal;