// import React, { useState, useEffect } from 'react';
// import { X, AlertCircle, Github, FileText, Image as ImageIcon, Send, Loader2, Trash2, ExternalLink, Layers, Calendar, CheckCircle } from 'lucide-react';
// import api from "../api/axios";

// const ProjectModal = ({ isOpen, onClose, onUploadSuccess, initialData = null }) => {
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [selectedPdf, setSelectedPdf] = useState(null);
//   const [selectedImages, setSelectedImages] = useState([]);
//   const [previews, setPreviews] = useState([]);
  
//   // États pour suivre les fichiers déjà existants sur Cloudinary (lors d'une modification)
//   const [existingPdfUrl, setExistingPdfUrl] = useState(null);
//   const [existingImages, setExistingImages] = useState([]);

//   const [academicYears, setAcademicYears] = useState([
//     { id: 1, label: "2023-2024" },
//     { id: 2, label: "2024-2025" },
//     { id: 3, label: "2025-2026" },
//     { id: 4, label: "2026-2027" },
//     { id: 5, label: "2027-2028" },
//     { id: 6, label: "2028-2029" }
//   ]);

//   const [draft, setDraft] = useState({
//     title: '',
//     description: '',
//     github_url: '',
//     project_type: 'academic',
//     academic_year_id: 'auto'
//   });

//   const filledFields = [draft.title, draft.description, draft.github_url, (selectedPdf || existingPdfUrl), draft.project_type].filter(Boolean).length;
//   const progressPercent = (filledFields / 5) * 100;

//   useEffect(() => {
//     if (initialData && isOpen) {
//       // 🟢 CORRECTION : Extraction profonde et sécurisée des données existantes
//       setDraft({
//         title: initialData.title || '',
//         description: initialData.description || '',
//         github_url: initialData.github_url || '',
//         project_type: initialData.project_type || 'academic',
//         // Supporte l'ID direct ou l'ID dans la relation imbriquée issue de la BDD
//         academic_year_id: initialData.academic_year_id || initialData.academic_year?.id || 'auto'
//       });

//       // Stockage des fichiers existants pour affichage informatif
//       setExistingPdfUrl(initialData.report_pdf_url || null);
//       setExistingImages(initialData.screenshots ? initialData.screenshots.split(',').filter(Boolean) : []);
      
//       // Reset des sélecteurs temporaires de fichiers
//       setSelectedPdf(null);
//       setSelectedImages([]);
//       setPreviews([]);
//     } else {
//       // Mode création : Reset complet à blanc
//       setDraft({ 
//         title: '', 
//         description: '', 
//         github_url: '', 
//         project_type: 'academic', 
//         academic_year_id: 'auto' 
//       });
//       setSelectedPdf(null);
//       setSelectedImages([]);
//       setPreviews([]);
//       setExistingPdfUrl(null);
//       setExistingImages([]);
//     }
//   }, [initialData, isOpen]);

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setDraft(prev => ({ ...prev, [name]: value }));
//   };

//   const handleImageChange = (e) => {
//     const files = Array.from(e.target.files);
//     setSelectedImages(prev => [...prev, ...files]);
//     const newPreviews = files.map(file => URL.createObjectURL(file));
//     setPreviews(prev => [...prev, ...newPreviews]);
//   };

//   const removeImage = (index) => {
//     setSelectedImages(prev => prev.filter((_, i) => i !== index));
//     setPreviews(prev => prev.filter((_, i) => i !== index));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError(null);

//     const formData = new FormData();
//     formData.append('title', draft.title);
//     formData.append('description', draft.description);
//     formData.append('github_url', draft.github_url);
//     formData.append('project_type', draft.project_type);
    
//     if (draft.academic_year_id !== 'auto') {
//       formData.append('academic_year_id', draft.academic_year_id);
//     }

//     // 🟢 SÉCURITÉ ENVOI : On ajoute les fichiers physiques uniquement s'ils ont été modifiés
//     if (selectedPdf) {
//       formData.append('report_pdf', selectedPdf);
//     }
    
//     if (selectedImages.length > 0) {
//       selectedImages.forEach(file => formData.append('screenshot_files', file));
//     }

//     try {
//       if (initialData) {
//         // Mode modification
//         await api.put(`/projects/${initialData.id}`, formData);
//       } else {
//         // Mode création
//         await api.post('/upload', formData);
//       }
//       onUploadSuccess();
//       onClose();
//     } catch (err) {
//       setError(err.response?.data?.detail || "Erreur lors de l'opération.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
//       <div className="flex min-h-full items-center justify-center p-4 sm:p-10">
//         <div className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
          
//           <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100">
//             <div 
//               className="h-full bg-dit-pink transition-all duration-700 ease-out"
//               style={{ width: `${progressPercent}%` }}
//             />
//           </div>

//           <div className="p-10 pb-6 flex justify-between items-center">
//             <div>
//               <h2 className="text-3xl font-black text-slate-900 tracking-tight italic">
//                 {initialData ? 'Modifier le' : 'Nouveau'} <span className="text-dit-pink">Dépôt</span>
//               </h2>
//               <p className="text-slate-500 font-medium mt-1">Nora synchronise avec ton profil étudiant.</p>
//             </div>
//             <button type="button" onClick={onClose} className="p-4 bg-slate-50 text-slate-400 hover:text-slate-900 hover:rotate-90 rounded-2xl transition-all">
//               <X size={24} />
//             </button>
//           </div>

//           <form onSubmit={handleSubmit} className="p-10 pt-4 space-y-8">
//             {error && (
//               <div className="p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3 text-sm font-bold border border-red-100">
//                 <AlertCircle size={20} /> {error}
//               </div>
//             )}

//             <div className="space-y-6">
//               <div className="space-y-2">
//                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Titre du Projet</label>
//                 <input required name="title" type="text" value={draft.title} onChange={handleInputChange} className="w-full bg-slate-50 border-none rounded-2xl px-6 py-5 font-bold focus:ring-2 focus:ring-dit-teal/20 outline-none transition-all placeholder:text-slate-300" placeholder="Ex: Dashboard DIT" />
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div className="space-y-2">
//                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1 flex items-center gap-2">
//                     <Layers size={14}/> Type de projet
//                   </label>
//                   <select name="project_type" value={draft.project_type} onChange={handleInputChange} className="w-full bg-slate-50 border-none rounded-2xl px-6 py-5 font-bold text-slate-700 focus:ring-2 focus:ring-dit-teal/20 outline-none transition-all cursor-pointer">
//                     <option value="academic">Projet Académique</option>
//                     <option value="group">Projet de Groupe</option>
//                     <option value="personal">Projet Personnel</option>
//                     <option value="final_year">Projet de fin d'année/Soutenance</option>
//                   </select>
//                 </div>

//                 <div className="space-y-2">
//                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1 flex items-center gap-2">
//                     <Calendar size={14}/> Année de réalisation
//                   </label>
//                   <select name="academic_year_id" value={draft.academic_year_id} onChange={handleInputChange} className="w-full bg-slate-50 border-none rounded-2xl px-6 py-5 font-bold text-slate-700 focus:ring-2 focus:ring-dit-teal/20 outline-none transition-all cursor-pointer">
//                     <option value="auto">Automatique (Mon année actuelle)</option>
//                     {academicYears.map(year => (
//                       <option key={year.id} value={year.id}>{year.label}</option>
//                     ))}
//                   </select>
//                 </div>
//               </div>

//               <div className="space-y-2">
//                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Description</label>
//                 <textarea required name="description" rows="3" value={draft.description} onChange={handleInputChange} className="w-full bg-slate-50 border-none rounded-2xl px-6 py-5 font-medium text-slate-700 focus:ring-2 focus:ring-dit-teal/20 outline-none transition-all resize-none" placeholder="Décrivez votre travail..." />
//               </div>

//               <div className="space-y-2">
//                 <div className="flex justify-between items-center px-1">
//                     <label className="text-[10px] font-black uppercase text-dit-pink tracking-[0.2em] flex items-center gap-2"><Github size={14}/> GitHub URL</label>
//                     <a href="https://github.com/join" target="_blank" rel="noreferrer" className="text-[10px] font-bold text-slate-400 hover:text-dit-pink flex items-center gap-1">
//                         Besoin d'un compte ? <ExternalLink size={10}/>
//                     </a>
//                 </div>
//                 <input required name="github_url" type="url" value={draft.github_url} onChange={handleInputChange} className="w-full bg-pink-50/30 border border-pink-100 rounded-2xl px-6 py-5 font-bold text-dit-pink outline-none" placeholder="https://github.com/..." />
//               </div>

//               {/* SECTION GESTION RAPPORTS ET IMAGES */}
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div className="space-y-2">
//                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1 flex items-center gap-2"><FileText size={14}/> Rapport (PDF)</label>
//                   <div className="relative group h-14">
//                     <input type="file" accept=".pdf" onChange={(e) => setSelectedPdf(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
//                     <div className={`w-full h-full border-2 border-dashed rounded-2xl flex items-center justify-center transition-all ${selectedPdf ? 'bg-teal-50 border-dit-teal' : existingPdfUrl ? 'bg-slate-50/80 border-slate-300' : 'bg-slate-50 border-slate-200'}`}>
//                       <span className="text-[10px] font-bold truncate px-4 text-slate-500 flex items-center gap-1.5">
//                           {selectedPdf ? selectedPdf.name : existingPdfUrl ? "📄 Rapport déjà archivé (Modifier)" : "Ajouter le rapport PDF"}
//                       </span>
//                     </div>
//                   </div>
//                 </div>

//                 <div className="space-y-2">
//                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1 flex items-center gap-2"><ImageIcon size={14}/> Screenshots</label>
//                   <div className="relative group h-14">
//                     <input type="file" accept="image/*" multiple onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
//                     <div className="w-full h-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center group-hover:border-dit-pink transition-all">
//                       <span className="text-[10px] font-bold text-slate-400">
//                         {existingImages.length > 0 ? `Ajouter d'autres captures (${existingImages.length} existantes)` : "Ajouter des images"}
//                       </span>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* 🟢 VISUALISATION DES FICHIERS EXISTANTS / NOUVEAUX REGROUPÉS */}
//               {(existingImages.length > 0 || previews.length > 0) && (
//                 <div className="space-y-2">
//                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Aperçu de la galerie</label>
//                   <div className="grid grid-cols-4 gap-4 p-4 bg-slate-50 rounded-3xl border border-slate-100 shadow-inner">
//                     {/* Images déjà présentes sur Cloudinary */}
//                     {existingImages.map((url, index) => (
//                       <div key={`existing-${index}`} className="relative aspect-square rounded-xl overflow-hidden border-2 border-white shadow-sm group">
//                         <img src={url} alt="existing preview" className="w-full h-full object-cover brightness-95" />
//                         <div className="absolute top-1 right-1 bg-emerald-500 text-white p-0.5 rounded-full shadow-sm">
//                           <CheckCircle size={12} />
//                         </div>
//                         <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
//                           <span className="text-[9px] text-white font-black uppercase tracking-wider">Cloudinary</span>
//                         </div>
//                       </div>
//                     ))}

//                     {/* Nouvelles images locales prêtes pour l'upload */}
//                     {previews.map((src, index) => (
//                       <div key={`new-${index}`} className="relative group aspect-square rounded-xl overflow-hidden border-2 border-pink-200 shadow-sm animate-in zoom-in-50">
//                         <img src={src} alt="new preview" className="w-full h-full object-cover" />
//                         <button type="button" onClick={() => removeImage(index)} className="absolute inset-0 bg-red-500/80 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
//                           <Trash2 size={16} />
//                         </button>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}
//             </div>

//             <button type="submit" disabled={loading} className={`w-full py-6 rounded-[24px] font-black text-sm uppercase tracking-[0.2em] flex justify-center items-center gap-4 transition-all ${loading ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white hover:bg-dit-teal shadow-xl shadow-teal-100 hover:-translate-y-1'}`}>
//               {loading ? <Loader2 className="animate-spin" size={24} /> : <Send size={20}/>}
//               {loading ? "Traitement..." : initialData ? "Sauvegarder les modifications" : "Lancer l'archivage"}
//             </button>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ProjectModal;

// import React, { useState, useEffect } from 'react';
// import { X, AlertCircle, Github, FileText, Image as ImageIcon, Send, Loader2, Trash2, ExternalLink, Layers, Calendar, CheckCircle, Hash } from 'lucide-react';
// import api from "../api/axios";

// const ProjectModal = ({ isOpen, onClose, onUploadSuccess, initialData = null }) => {
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [selectedPdf, setSelectedPdf] = useState(null);
//   const [selectedImages, setSelectedImages] = useState([]);
//   const [previews, setPreviews] = useState([]);
  
//   // États pour suivre les fichiers déjà existants sur Cloudinary (lors d'une modification)
//   const [existingPdfUrl, setExistingPdfUrl] = useState(null);
//   const [existingImages, setExistingImages] = useState([]);

//   // 🟢 Gestion des hashtags
//   const [tags, setTags] = useState([]);
//   const [tagInput, setTagInput] = useState('');

//   const [academicYears, setAcademicYears] = useState([
//     { id: 1, label: "2023-2024" },
//     { id: 2, label: "2024-2025" },
//     { id: 3, label: "2025-2026" },
//     { id: 4, label: "2026-2027" },
//     { id: 5, label: "2027-2028" },
//     { id: 6, label: "2028-2029" }
//   ]);

//   const [draft, setDraft] = useState({
//     title: '',
//     description: '',
//     github_url: '',
//     project_type: 'academic',
//     academic_year_id: 'auto'
//   });

//   const filledFields = [draft.title, draft.description, draft.github_url, (selectedPdf || existingPdfUrl), draft.project_type, tags.length > 0].filter(Boolean).length;
//   const progressPercent = (filledFields / 5) * 100;

//   useEffect(() => {
//     if (initialData && isOpen) {
//       setDraft({
//         title: initialData.title || '',
//         description: initialData.description || '',
//         github_url: initialData.github_url || '',
//         project_type: initialData.project_type || 'academic',
//         academic_year_id: initialData.academic_year_id || initialData.academic_year?.id || 'auto'
//       });

//       // 🟢 Récupération des tags existants de la BDD (convertis de chaîne à tableau)
//       if (initialData.tags) {
//         setTags(initialData.tags.split(',').map(t => t.trim()).filter(Boolean));
//       } else {
//         setTags([]);
//       }

//       setExistingPdfUrl(initialData.report_pdf_url || null);
//       setExistingImages(initialData.screenshots ? initialData.screenshots.split(',').filter(Boolean) : []);
      
//       setSelectedPdf(null);
//       setSelectedImages([]);
//       setPreviews([]);
//     } else {
//       setDraft({ 
//         title: '', 
//         description: '', 
//         github_url: '', 
//         project_type: 'academic', 
//         academic_year_id: 'auto' 
//       });
//       setTags([]);
//       setTagInput('');
//       setSelectedPdf(null);
//       setSelectedImages([]);
//       setPreviews([]);
//       setExistingPdfUrl(null);
//       setExistingImages([]);
//     }
//   }, [initialData, isOpen]);

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setDraft(prev => ({ ...prev, [name]: value }));
//   };

//   // 🟢 Fonctions pour la gestion des Hashtags
//   const handleTagKeyDown = (e) => {
//     if (e.key === 'Enter' || e.key === ',') {
//       e.preventDefault();
//       const cleanedTag = tagInput.trim().replace(/#/g, '');
//       if (cleanedTag && !tags.includes(cleanedTag)) {
//         setTags(prev => [...prev, cleanedTag]);
//       }
//       setTagInput('');
//     }
//   };

//   const removeTag = (indexToRemove) => {
//     setTags(prev => prev.filter((_, index) => index !== indexToRemove));
//   };

//   const handleImageChange = (e) => {
//     const files = Array.from(e.target.files);
//     setSelectedImages(prev => [...prev, ...files]);
//     const newPreviews = files.map(file => URL.createObjectURL(file));
//     setPreviews(prev => [...prev, ...newPreviews]);
//   };

//   const removeImage = (index) => {
//     setSelectedImages(prev => prev.filter((_, i) => i !== index));
//     setPreviews(prev => prev.filter((_, i) => i !== index));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError(null);

//     const formData = new FormData();
//     formData.append('title', draft.title);
//     formData.append('description', draft.description);
//     formData.append('github_url', draft.github_url);
//     formData.append('project_type', draft.project_type);
    
//     // 🟢 Envoi des tags convertis en chaîne de caractères pour le backend FastAPI
//     if (tags.length > 0) {
//       formData.append('tags', tags.join(','));
//     }

//     if (draft.academic_year_id !== 'auto') {
//       formData.append('academic_year_id', draft.academic_year_id);
//     }

//     if (selectedPdf) {
//       formData.append('report_pdf', selectedPdf);
//     }
    
//     if (selectedImages.length > 0) {
//       selectedImages.forEach(file => formData.append('screenshot_files', file));
//     }

//     // 🟢 Optimisation UX : On ferme le modal immédiatement pour ne pas bloquer l'étudiant
//     onUploadSuccess(); 
//     onClose();

//     try {
//       if (initialData) {
//         await api.put(`/projects/${initialData.id}`, formData);
//       } else {
//         await api.post('/upload', formData);
//       }
//     } catch (err) {
//       console.error("Erreur tâche de fond upload:", err);
//       // Optionnel : Tu pourras relier un toast de notification global ici si l'API crash à retardement
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
//       <div className="flex min-h-full items-center justify-center p-4 sm:p-10">
//         <div className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
          
//           <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100">
//             <div 
//               className="h-full bg-dit-pink transition-all duration-700 ease-out"
//               style={{ width: `${progressPercent}%` }}
//             />
//           </div>

//           <div className="p-10 pb-6 flex justify-between items-center">
//             <div>
//               <h2 className="text-3xl font-black text-slate-900 tracking-tight italic">
//                 {initialData ? 'Modifier le' : 'Nouveau'} <span className="text-dit-pink">Dépôt</span>
//               </h2>
//               <p className="text-slate-500 font-medium mt-1">Nora synchronise avec ton profil étudiant.</p>
//             </div>
//             <button type="button" onClick={onClose} className="p-4 bg-slate-50 text-slate-400 hover:text-slate-900 hover:rotate-90 rounded-2xl transition-all">
//               <X size={24} />
//             </button>
//           </div>

//           <form onSubmit={handleSubmit} className="p-10 pt-4 space-y-8">
//             {error && (
//               <div className="p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3 text-sm font-bold border border-red-100">
//                 <AlertCircle size={20} /> {error}
//               </div>
//             )}

//             <div className="space-y-6">
//               <div className="space-y-2">
//                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Titre du Projet</label>
//                 <input required name="title" type="text" value={draft.title} onChange={handleInputChange} className="w-full bg-slate-50 border-none rounded-2xl px-6 py-5 font-bold focus:ring-2 focus:ring-dit-teal/20 outline-none transition-all placeholder:text-slate-300" placeholder="Ex: Dashboard DIT" />
//               </div>

//               {/* 🟢 NOUVEAU CHAMP : HASHTAGS DYNAMIQUES */}
//               <div className="space-y-2">
//                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1 flex items-center gap-1.5">
//                   <Hash size={12} className="text-dit-pink" /> Mots-clés / Hashtags
//                 </label>
//                 <input 
//                   type="text" 
//                   value={tagInput} 
//                   onChange={(e) => setTagInput(e.target.value)} 
//                   onKeyDown={handleTagKeyDown}
//                   className="w-full bg-slate-50 border-none rounded-2xl px-6 py-5 font-bold focus:ring-2 focus:ring-dit-teal/20 outline-none transition-all placeholder:text-slate-300" 
//                   placeholder="Tapez un tag et appuyez sur Entrée (Ex: SEO, React)" 
//                 />
                
//                 {/* Rendu visuel des badges de hashtags */}
//                 {tags.length > 0 && (
//                   <div className="flex flex-wrap gap-2 pt-2 animate-in fade-in duration-200">
//                     {tags.map((tag, index) => (
//                       <span key={index} className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-800 text-xs font-black rounded-full border border-slate-200 shadow-sm transition-all hover:bg-red-50 hover:text-red-600 group cursor-pointer" onClick={() => removeTag(index)}>
//                         #{tag}
//                         <X size={12} className="text-slate-400 group-hover:text-red-500 transition-colors" />
//                       </span>
//                     ))}
//                   </div>
//                 )}
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div className="space-y-2">
//                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1 flex items-center gap-2">
//                     <Layers size={14}/> Type de projet
//                   </label>
//                   <select name="project_type" value={draft.project_type} onChange={handleInputChange} className="w-full bg-slate-50 border-none rounded-2xl px-6 py-5 font-bold text-slate-700 focus:ring-2 focus:ring-dit-teal/20 outline-none transition-all cursor-pointer">
//                     <option value="academic">Projet Académique</option>
//                     <option value="group">Projet de Groupe</option>
//                     <option value="personal">Projet Personnel</option>
//                     <option value="final_year">Projet de fin d'année/Soutenance</option>
//                   </select>
//                 </div>

//                 <div className="space-y-2">
//                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1 flex items-center gap-2">
//                     <Calendar size={14}/> Année de réalisation
//                   </label>
//                   <select name="academic_year_id" value={draft.academic_year_id} onChange={handleInputChange} className="w-full bg-slate-50 border-none rounded-2xl px-6 py-5 font-bold text-slate-700 focus:ring-2 focus:ring-dit-teal/20 outline-none transition-all cursor-pointer">
//                     <option value="auto">Automatique (Mon année actuelle)</option>
//                     {academicYears.map(year => (
//                       <option key={year.id} value={year.id}>{year.label}</option>
//                     ))}
//                   </select>
//                 </div>
//               </div>

//               <div className="space-y-2">
//                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Description</label>
//                 <textarea required name="description" rows="3" value={draft.description} onChange={handleInputChange} className="w-full bg-slate-50 border-none rounded-2xl px-6 py-5 font-medium text-slate-700 focus:ring-2 focus:ring-dit-teal/20 outline-none transition-all resize-none" placeholder="Décrivez votre travail..." />
//               </div>

//               {/* 🟢 GITHUB OPTIONNEL (Retrait du style rouge forcé et du required) */}
//               <div className="space-y-2">
//                 <div className="flex justify-between items-center px-1">
//                     <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2"><Github size={14}/> GitHub URL (Optionnel)</label>
//                     <a href="https://github.com/join" target="_blank" rel="noreferrer" className="text-[10px] font-bold text-slate-400 hover:text-dit-pink flex items-center gap-1">
//                         Besoin d'un compte ? <ExternalLink size={10}/>
//                     </a>
//                 </div>
//                 <input name="github_url" type="url" value={draft.github_url} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-5 font-bold text-slate-700 focus:ring-2 focus:ring-dit-teal/20 outline-none transition-all placeholder:text-slate-300" placeholder="https://github.com/..." />
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div className="space-y-2">
//                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1 flex items-center gap-2"><FileText size={14}/> Rapport (PDF)</label>
//                   <div className="relative group h-14">
//                     <input type="file" accept=".pdf" onChange={(e) => setSelectedPdf(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
//                     <div className={`w-full h-full border-2 border-dashed rounded-2xl flex items-center justify-center transition-all ${selectedPdf ? 'bg-teal-50 border-dit-teal' : existingPdfUrl ? 'bg-slate-50/80 border-slate-300' : 'bg-slate-50 border-slate-200'}`}>
//                       <span className="text-[10px] font-bold truncate px-4 text-slate-500 flex items-center gap-1.5">
//                           {selectedPdf ? selectedPdf.name : existingPdfUrl ? "📄 Rapport déjà archivé (Modifier)" : "Ajouter le rapport PDF"}
//                       </span>
//                     </div>
//                   </div>
//                 </div>

//                 <div className="space-y-2">
//                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1 flex items-center gap-2"><ImageIcon size={14}/> Screenshots</label>
//                   <div className="relative group h-14">
//                     <input type="file" accept="image/*" multiple onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
//                     <div className="w-full h-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center group-hover:border-dit-pink transition-all">
//                       <span className="text-[10px] font-bold text-slate-400">
//                         {existingImages.length > 0 ? `Ajouter d'autres captures (${existingImages.length} existantes)` : "Ajouter des images"}
//                       </span>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {(existingImages.length > 0 || previews.length > 0) && (
//                 <div className="space-y-2">
//                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Aperçu de la galerie</label>
//                   <div className="grid grid-cols-4 gap-4 p-4 bg-slate-50 rounded-3xl border border-slate-100 shadow-inner">
//                     {existingImages.map((url, index) => (
//                       <div key={`existing-${index}`} className="relative aspect-square rounded-xl overflow-hidden border-2 border-white shadow-sm group">
//                         <img src={url} alt="existing preview" className="w-full h-full object-cover brightness-95" />
//                         <div className="absolute top-1 right-1 bg-emerald-500 text-white p-0.5 rounded-full shadow-sm">
//                           <CheckCircle size={12} />
//                         </div>
//                         <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
//                           <span className="text-[9px] text-white font-black uppercase tracking-wider">Cloudinary</span>
//                         </div>
//                       </div>
//                     ))}

//                     {previews.map((src, index) => (
//                       <div key={`new-${index}`} className="relative group aspect-square rounded-xl overflow-hidden border-2 border-pink-200 shadow-sm animate-in zoom-in-50">
//                         <img src={src} alt="new preview" className="w-full h-full object-cover" />
//                         <button type="button" onClick={() => removeImage(index)} className="absolute inset-0 bg-red-500/80 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
//                           <Trash2 size={16} />
//                         </button>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}
//             </div>

//             <button type="submit" disabled={loading} className={`w-full py-6 rounded-[24px] font-black text-sm uppercase tracking-[0.2em] flex justify-center items-center gap-4 transition-all ${loading ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white hover:bg-dit-teal shadow-xl shadow-teal-100 hover:-translate-y-1'}`}>
//               {loading ? <Loader2 className="animate-spin" size={24} /> : <Send size={20}/>}
//               {loading ? "Traitement..." : initialData ? "Sauvegarder les modifications" : "Lancer l'archivage"}
//             </button>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ProjectModal;

import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Github, FileText, Image as ImageIcon, Send, Loader2, Trash2, ExternalLink, Layers, Calendar, CheckCircle, Code } from 'lucide-react';
import api from "../api/axios";

const ProjectModal = ({ isOpen, onClose, onUploadSuccess, initialData = null }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  
  const [existingPdfUrl, setExistingPdfUrl] = useState(null);
  const [existingImages, setExistingImages] = useState([]);

  // 🟢 Gestion unifiée : Mots-clés / Technologies (qui agissent comme des hashtags)
  const [techTags, setTechTags] = useState([]);
  const [techInput, setTechInput] = useState('');

  const [academicYears] = useState([
    { id: 1, label: "2023-2024" },
    { id: 2, label: "2024-2025" },
    { id: 3, label: "2025-2026" },
    { id: 4, label: "2026-2027" },
    { id: 5, label: "2027-2028" },
    { id: 6, label: "2028-2029" }
  ]);

  const [draft, setDraft] = useState({
    title: '',
    description: '',
    github_url: '',
    project_type: 'academic',
    academic_year_id: 'auto'
  });

  const filledFields = [draft.title, draft.description, draft.github_url, (selectedPdf || existingPdfUrl), draft.project_type, techTags.length > 0].filter(Boolean).length;
  const progressPercent = (filledFields / 5) * 100;

  useEffect(() => {
    if (initialData && isOpen) {
      setDraft({
        title: initialData.title || '',
        description: initialData.description || '',
        github_url: initialData.github_url || '',
        project_type: initialData.project_type || 'academic',
        academic_year_id: initialData.academic_year_id || initialData.academic_year?.id || 'auto'
      });

      // Synchronisation avec technologies_list du backend
      if (initialData.technologies_list) {
        setTechTags(initialData.technologies_list.split(',').map(t => t.trim()).filter(Boolean));
      } else {
        setTechTags([]);
      }

      setExistingPdfUrl(initialData.report_pdf_url || null);
      setExistingImages(initialData.screenshots ? initialData.screenshots.split(',').filter(Boolean) : []);
      
      setSelectedPdf(null);
      setSelectedImages([]);
      setPreviews([]);
    } else {
      setDraft({ title: '', description: '', github_url: '', project_type: 'academic', academic_year_id: 'auto' });
      setTechTags([]);
      setTechInput('');
      setSelectedPdf(null);
      setSelectedImages([]);
      setPreviews([]);
      setExistingPdfUrl(null);
      setExistingImages([]);
    }
  }, [initialData, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDraft(prev => ({ ...prev, [name]: value }));
  };

  const handleTechKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const cleanedTech = techInput.trim().replace(/#/g, '');
      if (cleanedTech && !techTags.includes(cleanedTech)) {
        setTechTags(prev => [...prev, cleanedTech]);
      }
      setTechInput('');
    }
  };

  const removeTechTag = (indexToRemove) => {
    setTechTags(prev => prev.filter((_, index) => index !== indexToRemove));
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
    formData.append('project_type', draft.project_type);
    
    // 🟢 On passe les technos saisies sous forme de chaîne de caractères attendue par ton API
    if (techTags.length > 0) {
      formData.append('technologies_list', techTags.join(','));
    }

    if (draft.academic_year_id !== 'auto') {
      formData.append('academic_year_id', draft.academic_year_id);
    }

    if (selectedPdf) formData.append('report_pdf', selectedPdf);
    if (selectedImages.length > 0) {
      selectedImages.forEach(file => formData.append('screenshot_files', file));
    }

    // Fermeture UX instantanée
    onUploadSuccess(); 
    onClose();

    try {
      if (initialData) {
        await api.put(`/projects/${initialData.id}`, formData);
      } else {
        await api.post('/upload', formData);
      }
    } catch (err) {
      console.error("Erreur tâche de fond upload:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="flex min-h-full items-center justify-center p-4 sm:p-10">
        <div className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
          
          <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100">
            <div className="h-full bg-dit-pink transition-all duration-700 ease-out" style={{ width: `${progressPercent}%` }} />
          </div>

          <div className="p-10 pb-6 flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight italic">
                {initialData ? 'Modifier le' : 'Nouveau'} <span className="text-dit-pink">Dépôt</span>
              </h2>
              <p className="text-slate-500 font-medium mt-1">Nora synchronise avec ton profil étudiant.</p>
            </div>
            <button type="button" onClick={onClose} className="p-4 bg-slate-50 text-slate-400 hover:text-slate-900 hover:rotate-90 rounded-2xl transition-all">
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

              {/* 🟢 LE CHAMP DU MILIEU S'INSCRIT EN TANT QUE STACK TECHNIQUE DIRECTEMENT */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1 flex items-center gap-1.5">
                  <Code size={12} className="text-dit-pink" /> Technologies & Mots-clés (Stack)
                </label>
                <input 
                  type="text" 
                  value={techInput} 
                  onChange={(e) => setTechInput(e.target.value)} 
                  onKeyDown={handleTechKeyDown}
                  className="w-full bg-slate-50 border-none rounded-2xl px-6 py-5 font-bold focus:ring-2 focus:ring-dit-teal/20 outline-none transition-all placeholder:text-slate-300" 
                  placeholder="Tapez un outil/langage et faites Entrée (Ex: React, Python, Django)" 
                />
                
                {techTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {techTags.map((tech, index) => (
                      <span key={index} className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-50 text-slate-700 text-xs font-black rounded-full border border-slate-200 shadow-sm transition-all hover:bg-red-50 hover:text-red-600 group cursor-pointer" onClick={() => removeTechTag(index)}>
                        #{tech.toUpperCase()}
                        <X size={12} className="text-slate-400 group-hover:text-red-500" />
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1 flex items-center gap-2"><Layers size={14}/> Type de projet</label>
                  <select name="project_type" value={draft.project_type} onChange={handleInputChange} className="w-full bg-slate-50 border-none rounded-2xl px-6 py-5 font-bold text-slate-700 focus:ring-2 focus:ring-dit-teal/20 outline-none transition-all cursor-pointer">
                    <option value="academic">Projet Académique</option>
                    <option value="group">Projet de Groupe</option>
                    <option value="personal">Projet Personnel</option>
                    <option value="final_year">Projet de fin d'année/Soutenance</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1 flex items-center gap-2"><Calendar size={14}/> Année de réalisation</label>
                  <select name="academic_year_id" value={draft.academic_year_id} onChange={handleInputChange} className="w-full bg-slate-50 border-none rounded-2xl px-6 py-5 font-bold text-slate-700 focus:ring-2 focus:ring-dit-teal/20 outline-none transition-all cursor-pointer">
                    <option value="auto">Automatique (Mon année actuelle)</option>
                    {academicYears.map(year => <option key={year.id} value={year.id}>{year.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Description</label>
                <textarea required name="description" rows="3" value={draft.description} onChange={handleInputChange} className="w-full bg-slate-50 border-none rounded-2xl px-6 py-5 font-medium text-slate-700 focus:ring-2 focus:ring-dit-teal/20 outline-none transition-all resize-none" placeholder="Décrivez votre travail..." />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2"><Github size={14}/> GitHub URL (Optionnel)</label>
                    <a href="https://github.com/join" target="_blank" rel="noreferrer" className="text-[10px] font-bold text-slate-400 hover:text-dit-pink flex items-center gap-1">Besoin d'un compte ? <ExternalLink size={10}/></a>
                </div>
                <input name="github_url" type="url" value={draft.github_url} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-5 font-bold text-slate-700 focus:ring-2 focus:ring-dit-teal/20 outline-none transition-all placeholder:text-slate-300" placeholder="https://github.com/..." />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1 flex items-center gap-2"><FileText size={14}/> Rapport (PDF)</label>
                  <div className="relative group h-14">
                    <input type="file" accept=".pdf" onChange={(e) => setSelectedPdf(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <div className={`w-full h-full border-2 border-dashed rounded-2xl flex items-center justify-center transition-all ${selectedPdf ? 'bg-teal-50 border-dit-teal' : existingPdfUrl ? 'bg-slate-50/80 border-slate-300' : 'bg-slate-50 border-slate-200'}`}>
                      <span className="text-[10px] font-bold truncate px-4 text-slate-500">{selectedPdf ? selectedPdf.name : existingPdfUrl ? "📄 Rapport déjà archivé (Modifier)" : "Ajouter le rapport PDF"}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1 flex items-center gap-2"><ImageIcon size={14}/> Screenshots</label>
                  <div className="relative group h-14">
                    <input type="file" accept="image/*" multiple onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <div className="w-full h-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center group-hover:border-dit-pink transition-all">
                      <span className="text-[10px] font-bold text-slate-400">{existingImages.length > 0 ? `Ajouter d'autres captures (${existingImages.length})` : "Ajouter des images"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full py-6 bg-slate-900 text-white hover:bg-dit-teal rounded-[24px] font-black text-sm uppercase tracking-[0.2em] flex justify-center items-center gap-4 transition-all shadow-xl shadow-teal-100 hover:-translate-y-1">
              <Send size={20}/> Lancer l'archivage
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProjectModal;