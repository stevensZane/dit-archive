import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Github, Plus, Loader2, X, AlertCircle, Sparkles, Send, CheckCircle2, Clock, ArrowRight, Pencil, Trash2, Image as ImageIcon, FileText } from 'lucide-react';
import api from "./api/axios";
import Navbar from './Navbar';

const StudentPortal = () => {
  const navigate = useNavigate();
  
  const [projects, setProjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [programs, setPrograms] = useState([]);
  const [years, setYears] = useState([]);

  // --- ÉTATS POUR LES FICHIERS ---
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);

  // --- ÉTAT DU FORMULAIRE ---
  const [draft, setDraft] = useState({
    title: '',
    description: '',
    github_url: '',
    program_id: '',
    year_id: '',
    level: 'L3'
  });

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const initPortal = async (silent = false) => {
    if (!silent) setFetchLoading(true);
    setError(null);
    try {
      const [projRes, progRes, yearRes] = await Promise.all([
        api.get('/projects/me'),
        api.get('/programs'),
        api.get('/academic-years'),
      ]);
      
      setProjects(projRes.data);
      setPrograms(progRes.data);
      setYears(yearRes.data);

      localStorage.setItem("dit_student_projects", JSON.stringify(projRes.data));
      localStorage.setItem("dit_programs", JSON.stringify(progRes.data));
      localStorage.setItem("dit_years", JSON.stringify(yearRes.data));
    } catch (err) {
      console.error("Erreur chargement:", err);
      setError("Erreur lors du chargement des données.");
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login');
      return;
    }

    const cachedProj = localStorage.getItem("dit_student_projects");
    const cachedProg = localStorage.getItem("dit_programs");
    const cachedYears = localStorage.getItem("dit_years");
    const savedDraft = localStorage.getItem("dit_upload_draft");

    if (cachedProj) setProjects(JSON.parse(cachedProj));
    if (cachedProg) setPrograms(JSON.parse(cachedProg));
    if (cachedYears) setYears(JSON.parse(cachedYears));
    if (savedDraft) setDraft(JSON.parse(savedDraft));

    if (cachedProj) setFetchLoading(false);
    initPortal(!!cachedProj);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const newDraft = { ...draft, [name]: value };
    setDraft(newDraft);
    localStorage.setItem("dit_upload_draft", JSON.stringify(newDraft));
  };

  // --- SOUMISSION AVEC FORMDATA ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData();
    // 1. Champs textes (on mappe year_id -> academic_year_id pour le backend)
    formData.append('title', draft.title);
    formData.append('description', draft.description);
    formData.append('github_url', draft.github_url);
    formData.append('program_id', draft.program_id);
    formData.append('academic_year_id', draft.year_id); 
    formData.append('level', draft.level);

    // 2. Le PDF
    if (selectedPdf) {
      formData.append('report_pdf', selectedPdf);
    } else {
      setError("Le rapport PDF est obligatoire.");
      setLoading(false);
      return;
    }

    // 3. Les Images (multiples)
    if (selectedImages.length > 0) {
      Array.from(selectedImages).forEach((file) => {
        formData.append('screenshot_files', file);
      });
    }

    try {
      await api.post('/upload-project', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      // Reset
      localStorage.removeItem("dit_upload_draft");
      setDraft({ title: '', description: '', github_url: '', program_id: '', year_id: '', level: 'L3' });
      setSelectedPdf(null);
      setSelectedImages([]);
      
      setIsModalOpen(false);
      initPortal(true); 
    } catch (err) {
      setError(err.response?.data?.detail || "Erreur lors de l'envoi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900">
      <Navbar />

      <main className="max-w-4xl mx-auto pt-32 pb-20 px-6">
        <header className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900">
              Bonjour, <span className="text-dit-teal">{user?.name || "Étudiant"} !</span>
            </h1>
            <p className="text-slate-500 mt-2 font-medium">
              Prêt à immortaliser ton travail dans les archives du DIT ?
            </p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="group bg-[#004751] text-white px-6 py-4 hover:bg-[#007A87] rounded-2xl flex items-center gap-3 transition-all shadow-lg shadow-teal-900/10"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform" />
            <span className="font-bold text-sm uppercase tracking-wider">Ajouter un projet</span>
          </button>
        </header>

        <section>
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Tes Archives</h2>
            <div className="h-[1px] flex-1 bg-slate-200"></div>
          </div>
          
          {fetchLoading && projects.length === 0 ? (
            <div className="py-20 flex flex-col items-center gap-4 text-dit-teal opacity-50">
                <Loader2 size={40} className="animate-spin" />
                <span className="text-xs font-bold uppercase">Nora consulte les registres...</span>
            </div>
          ) : projects.length > 0 ? (
            <div className="grid gap-6">
              {projects.map((p) => (
                <div key={p.id} className="group relative bg-white border border-slate-100 p-6 rounded-3xl flex justify-between items-center hover:border-dit-pink/30 hover:shadow-xl transition-all">
                  <Link to={`/project/${p.id}`} className="flex items-center gap-6 flex-1">
                    <div className={`p-4 rounded-2xl ${p.analysis_status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                        {p.analysis_status === 'completed' ? <CheckCircle2 size={24} /> : <Clock size={24} />}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-800 group-hover:text-dit-pink transition-colors">{p.title}</h3>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter mb-2">
                        {p.program?.name} • {p.academic_year?.label}
                      </p>
                      
                      <div className="flex flex-wrap gap-1.5">
                        {p.technologies_list ? (
                          p.technologies_list.split(', ').slice(0, 4).map(tech => (
                            <span key={tech} className="text-[9px] font-black bg-slate-50 text-slate-500 px-2 py-0.5 rounded border border-slate-100 uppercase">
                              {tech}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-300 italic">Analyse en cours...</span>
                        )}
                      </div>
                    </div>
                  </Link>

                  <div className="flex items-center gap-3 ml-4">
                    <button className="p-3 text-slate-300 hover:text-dit-teal hover:bg-teal-50 rounded-xl transition-all" title="Modifier">
                      <Pencil size={18} />
                    </button>
                    <button className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Supprimer">
                      <Trash2 size={18} />
                    </button>
                    <div className="w-[1px] h-8 bg-slate-100 mx-1"></div>
                    <ArrowRight size={18} className="text-slate-300 group-hover:text-dit-pink group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center bg-white border-2 border-dashed border-slate-100 rounded-[40px]">
              <Sparkles size={40} className="mx-auto text-slate-200 mb-4" />
              <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Ton historique est vide pour le moment</p>
            </div>
          )}
        </section>
      </main>

      {/* MODAL DE DÉPÔT */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="flex min-h-full items-center justify-center p-4 sm:p-10">
            <div className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
              
              <div className="p-10 pb-6 flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight italic">
                    Nouveau <span className="text-dit-pink">Dépôt</span>
                  </h2>
                  <p className="text-slate-500 font-medium mt-1">Dites à Nora ce que vous avez créé.</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="p-4 bg-slate-50 text-slate-400 hover:text-slate-900 hover:rotate-90 rounded-2xl transition-all duration-300"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-10 pt-4 space-y-8">
                {error && (
                  <div className="p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3 text-sm font-bold border border-red-100">
                    <AlertCircle size={20} /> {error}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Titre du Projet</label>
                      <input 
                        required 
                        name="title" 
                        type="text" 
                        value={draft.title}
                        onChange={handleInputChange}
                        placeholder="Ex: Dashboard de gestion DIT" 
                        className="w-full bg-slate-50 border-none rounded-2xl px-6 py-5 font-bold focus:ring-2 focus:ring-dit-teal/20 outline-none transition-all placeholder:text-slate-300" 
                      />
                  </div>

                  <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Description</label>
                      <textarea 
                        required 
                        name="description" 
                        rows="3" 
                        value={draft.description}
                        onChange={handleInputChange}
                        placeholder="Objectifs et fonctionnalités clés..." 
                        className="w-full bg-slate-50 border-none rounded-2xl px-6 py-5 font-medium text-slate-700 focus:ring-2 focus:ring-dit-teal/20 outline-none transition-all resize-none"
                      ></textarea>
                  </div>

                  <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] font-black uppercase text-dit-pink tracking-[0.2em] ml-1 flex items-center gap-2">
                        <Github size={14}/> URL du Dépôt GitHub (Public)
                      </label>
                      <input 
                        required 
                        name="github_url" 
                        type="url" 
                        value={draft.github_url}
                        onChange={handleInputChange}
                        placeholder="https://github.com/votre-nom/votre-projet" 
                        className="w-full bg-pink-50/30 border border-pink-100 rounded-2xl px-6 py-5 font-bold text-dit-pink focus:ring-2 focus:ring-pink-200 outline-none transition-all" 
                      />
                  </div>

                  {/* SECTION FICHIERS */}
                  <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1 italic flex items-center gap-2">
                        <FileText size={14}/> Rapport (PDF)
                      </label>
                      <div className="relative group">
                        <input 
                          required 
                          type="file" 
                          accept=".pdf" 
                          onChange={(e) => setSelectedPdf(e.target.files[0])}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                        />
                        <div className="w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center group-hover:border-dit-teal transition-all">
                           <span className="text-[10px] font-bold text-slate-400 uppercase">
                             {selectedPdf ? selectedPdf.name : "Cliquez pour joindre le PDF"}
                           </span>
                        </div>
                      </div>
                  </div>

                  <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1 flex items-center gap-2">
                        <ImageIcon size={14}/> Captures (Images)
                      </label>
                      <div className="relative group">
                        <input 
                          type="file" 
                          accept="image/*" 
                          multiple 
                          onChange={(e) => setSelectedImages(e.target.files)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                        />
                        <div className="w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center group-hover:border-dit-pink transition-all">
                           <span className="text-[10px] font-bold text-slate-400 uppercase">
                             {selectedImages.length > 0 ? `${selectedImages.length} images` : "Sélectionner des images"}
                           </span>
                        </div>
                      </div>
                  </div>

                  <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Filière</label>
                      <select 
                        required 
                        name="program_id" 
                        value={draft.program_id}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 rounded-2xl px-6 py-5 font-bold outline-none cursor-pointer appearance-none"
                      >
                          <option value="">Sélectionner</option>
                          {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                  </div>

                  <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Année</label>
                      <select 
                        required 
                        name="year_id" 
                        value={draft.year_id}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 rounded-2xl px-6 py-5 font-bold outline-none cursor-pointer"
                      >
                          <option value="">Sélectionner</option>
                          {years.map(y => <option key={y.id} value={y.id}>{y.label}</option>)}
                      </select>
                  </div>

                  <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Niveau</label>
                      <select 
                        required 
                        name="level" 
                        value={draft.level}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 rounded-2xl px-6 py-5 font-bold outline-none cursor-pointer"
                      >
                          <option value="L3">Licence 3</option>
                          <option value="M1">Master 1</option>
                          <option value="M2">Master 2</option>
                      </select>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className={`w-full py-6 rounded-[24px] font-black text-sm uppercase tracking-[0.2em] transition-all flex justify-center items-center gap-4 shadow-2xl ${
                    loading 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                    : 'bg-slate-900 text-white hover:bg-dit-teal shadow-teal-100 hover:-translate-y-1'
                  }`}
                >
                  {loading ? <Loader2 className="animate-spin" size={24} /> : <Send size={20}/>}
                  {loading ? "Nora analyse le dépôt..." : "Lancer l'archivage"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentPortal;