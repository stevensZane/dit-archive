import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Github, Plus, Loader2, X, AlertCircle, FileArchive, Link as LinkIcon, Sparkles, Send, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import api from "./api/axios";
import Navbar from './Navbar';

const StudentPortal = () => {
  const navigate = useNavigate();
  
  // --- ÉTATS ---
  const [projects, setProjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Données de formulaire dynamiques
  const [programs, setPrograms] = useState([]);
  const [years, setYears] = useState([]);
  const [uploadMethod, setUploadMethod] = useState('files'); // 'files' ou 'github'

  // --- INITIALISATION ---
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const initPortal = async () => {
    setFetchLoading(true);
    try {
      const [projRes, progRes, yearRes] = await Promise.all([
        api.get('/projects/me'),
        api.get('/programs'),
        api.get('/academic-years')
      ]);
      setProjects(projRes.data);
      setPrograms(progRes.data);
      setYears(yearRes.data);
    } catch (err) {
      setError("Erreur lors du chargement des données.");
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    if (!localStorage.getItem('token')) navigate('/login');
    else initPortal();
  }, []);

  // --- SOUMISSION DU FORMULAIRE ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.target);
    const endpoint = uploadMethod === 'files' ? '/upload' : '/projects/auto-archive';

    try {
      await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setIsModalOpen(false);
      initPortal(); // Rafraîchir la liste
    } catch (err) {
      setError(err.response?.data?.detail || "Une erreur est survenue lors de l'envoi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900">
      <Navbar />

      <main className="max-w-4xl mx-auto pt-32 pb-20 px-6">
        {/* HEADER : Bonjour & Action */}
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
            className="group bg-[#004751] text-white px-6 py-4 hover:bg-[#007A87] rounded-2xl flex items-center gap-3"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform" />
            <span className="font-bold text-sm uppercase tracking-wider">Ajouter un projet</span>
          </button>
        </header>

        {/* LISTE DES ARCHIVES PERSONNELLES */}
        <section>
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Tes Archives</h2>
            <div className="h-[1px] flex-1 bg-slate-200"></div>
          </div>
          
          {fetchLoading ? (
            <div className="py-20 flex flex-col items-center gap-4 text-dit-teal opacity-50">
                <Loader2 size={40} className="animate-spin" />
                <span className="text-xs font-bold uppercase">Nora consulte les registres...</span>
            </div>
          ) : projects.length > 0 ? (
            <div className="grid gap-4">
              {projects.map((p) => (
                <Link key={p.id} to={`/project/${p.id}`} className="group bg-white border border-slate-100 p-6 rounded-3xl flex justify-between items-center hover:border-pink/30 hover:shadow-lg transition-all">
                  <div className="flex items-center gap-5">
                    <div className={`p-3 rounded-2xl ${p.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                        {p.status === 'approved' ? <CheckCircle2 size={24} /> : <Clock size={24} />}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-800 group-hover:text-dit-pink transition-colors">{p.title}</h3>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">
                        {p.program?.name} • {p.academic_year?.label}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${p.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {p.status === 'approved' ? 'Archivé' : 'En cours'}
                    </span>
                    <ArrowRight size={18} className="text-slate-300 group-hover:text-dit-pink group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
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

      {/* MODAL DE DÉPÔT DYNAMIQUE - VERSION LARGE & AÉRÉE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          {/* Conteneur de centrage qui gère le scroll proprement */}
          <div className="flex min-h-full items-center justify-center p-4 sm:p-10">
            
            <div className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
              
              {/* Header : Toujours aussi spacieux */}
              <div className="p-10 pb-6 flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight italic">
                    Nouveau <span className="text-dit-pink">Dépôt</span>
                  </h2>
                  <p className="text-slate-500 font-medium mt-1">Laisse Nora s'occuper de la mise en rayon.</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="p-4 bg-slate-50 text-slate-400 hover:text-slate-900 hover:rotate-90 rounded-2xl transition-all duration-300"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Sélecteur de Méthode (Design épuré) */}
              <div className="px-10 mb-4">
                  <div className="flex bg-slate-50 p-2 rounded-2xl">
                      <button 
                          type="button"
                          onClick={() => setUploadMethod('files')}
                          className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-xl text-xs font-black transition-all ${uploadMethod === 'files' ? 'bg-white shadow-md text-dit-teal' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                          <FileArchive size={18} /> FICHIERS (ZIP/PDF)
                      </button>
                      <button 
                          type="button"
                          onClick={() => setUploadMethod('github')}
                          className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-xl text-xs font-black transition-all ${uploadMethod === 'github' ? 'bg-white shadow-md text-dit-teal' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                          <Github size={18} /> IMPORT GITHUB
                      </button>
                  </div>
              </div>

              <form onSubmit={handleSubmit} className="p-10 pt-4 space-y-8">
                {error && (
                  <div className="p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3 text-sm font-bold border border-red-100 animate-bounce">
                    <AlertCircle size={20} /> {error}
                  </div>
                )}

                {/* Corps du formulaire en grille aérée */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  
                  <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Titre du Projet</label>
                      <input required name="title" type="text" placeholder="Ex: Dashboard de gestion DIT" className="w-full bg-slate-50 border-none rounded-2xl px-6 py-5 font-bold focus:ring-2 focus:ring-dit-teal/20 outline-none transition-all placeholder:text-slate-300" />
                  </div>

                  <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Description</label>
                      <textarea 
                          required 
                          name="description" 
                          rows="4" 
                          placeholder="Quels sont les objectifs de ce projet ?" 
                          className="w-full bg-slate-50 border-none rounded-2xl px-6 py-5 font-medium text-slate-700 focus:ring-2 focus:ring-dit-teal/20 outline-none transition-all resize-none"
                      ></textarea>
                  </div>

                  {uploadMethod === 'github' ? (
                    <> 
                      <div className="md:col-span-2 space-y-2">
                            <label className="text-[10px] font-black uppercase text-dit-pink tracking-[0.2em] ml-1 flex items-center gap-2">
                              <Github size={14}/> URL du Repo GitHub
                            </label>
                            <input required name="github_url" type="url" placeholder="https://github.com/..." className="w-full bg-pink-50/30 border border-pink-100 rounded-2xl px-6 py-5 font-bold text-dit-pink focus:ring-2 focus:ring-pink-200 outline-none transition-all" />
                        </div>

                        <div className="md:col-span-2 space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1 italic">Mémoire/Rapport de projet (PDF)</label>
                                <input required type="file" name="report_file" className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-dit-pink file:text-white cursor-pointer bg-slate-50 p-4 rounded-2xl" />
                        </div>
                      </>
                  ) : (
                      <>
                          <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1 italic">Code (.zip)</label>
                              <input required type="file" name="code_file" className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-slate-900 file:text-white cursor-pointer bg-slate-50 p-4 rounded-2xl" />
                          </div>
                          <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1 italic">Mémoire/Rapport de projet (PDF)</label>
                              <input required type="file" name="report_file" className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-dit-pink file:text-white cursor-pointer bg-slate-50 p-4 rounded-2xl" />
                          </div>
                      </>
                  )}

                  <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Filière</label>
                      <select name="program_id" className="w-full bg-slate-50 rounded-2xl px-6 py-5 font-bold outline-none cursor-pointer appearance-none">
                          {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                  </div>

                  <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Année Académique</label>
                      <select name="year_id" className="w-full bg-slate-50 rounded-2xl px-6 py-5 font-bold outline-none cursor-pointer">
                          {years.map(y => <option key={y.id} value={y.id}>{y.label}</option>)}
                      </select>
                  </div>
                  
                  <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Niveau</label>
                      <select name="level" className="w-full bg-slate-50 rounded-2xl px-6 py-5 font-bold outline-none cursor-pointer">
                          <option value="L3">Licence 3</option>
                          <option value="M1">Master 1</option>
                          <option value="M2">Master 2</option>
                      </select>
                  </div>

                  <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Techno Clé</label>
                      <input name="primary_language" type="text" placeholder="Ex: React" className="w-full bg-slate-50 rounded-2xl px-6 py-5 font-bold outline-none transition-all" />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className={`w-full py-6 rounded-[24px] font-black text-sm uppercase tracking-[0.2em] transition-all flex justify-center items-center gap-4 shadow-2xl ${
                    loading 
                    ? 'bg-slate-100 text-slate-400' 
                    : 'bg-slate-900 text-white hover:bg-dit-teal shadow-teal-100 hover:-translate-y-1'
                  }`}
                >
                  {loading ? <Loader2 className="animate-spin" size={24} /> : <Send size={20}/>}
                  {loading ? "Nora traite ton projet..." : "Confirmer l'archivage"}
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