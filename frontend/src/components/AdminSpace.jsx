// import React, { useState, useEffect } from 'react';
// import { 
//   ExternalLink, Loader2, ShieldCheck, Users, FileText, 
//   Trophy, Trash2, AlertCircle, RefreshCw, Archive
// } from 'lucide-react';
// import api from "./api/axios";
// import Navbar from './Navbar';

// const AdminSpace = () => {
//   const [projects, setProjects] = useState([]);
//   const [stats, setStats] = useState({ total_projects: 0, students: 0, admins: 0 });
//   const [loading, setLoading] = useState(true);
//   const [actionLoading, setActionLoading] = useState(null);
//   const [filter, setFilter] = useState('archived'); 

//   const fetchData = async (isSilent = false) => {
//     // Si on a déjà des données (du cache), on ne montre pas le gros loader central
//     if (!isSilent) setLoading(true);
    
//     try {
//       const [projRes, statsRes] = await Promise.all([
//         api.get('/admin/projects'),
//         api.get('/admin/stats')
//       ]);
      
//       setProjects(projRes.data);
//       setStats(statsRes.data);
      
//       // Mise à jour des caches admin
//       localStorage.setItem("dit_admin_projects_cache", JSON.stringify(projRes.data));
//       localStorage.setItem("dit_admin_stats_cache", JSON.stringify(statsRes.data));
//     } catch (err) {
//       console.error("Erreur fetching admin data:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     // 1. Charger le cache immédiatement
//     const cachedProjects = localStorage.getItem("dit_admin_projects_cache");
//     const cachedStats = localStorage.getItem("dit_admin_stats_cache");

//     if (cachedProjects && cachedStats) {
//       setProjects(JSON.parse(cachedProjects));
//       setStats(JSON.parse(cachedStats));
//       setLoading(false);
//       // On rafraîchit quand même "en silence" en arrière-plan
//       fetchData(true);
//     } else {
//       // Si pas de cache, chargement classique
//       fetchData();
//     }
//   }, []);

//   const handleDelete = async (projectId) => {
//     if (!window.confirm("Supprimer définitivement ce projet de l'archive ?")) return;
    
//     setActionLoading(projectId);
//     try {
//       await api.delete(`/admin/projects/${projectId}`);
//       const updatedList = projects.filter(p => p.id !== projectId);
//       setProjects(updatedList);
//       // Mettre à jour le cache après suppression
//       localStorage.setItem("dit_admin_projects_cache", JSON.stringify(updatedList));
//       fetchData(true); // Rafraîchir les stats silencieusement
//     } catch (err) {
//       alert("Erreur lors de la suppression.");
//     } finally {
//       setActionLoading(null);
//     }
//   };

//   // Filtrage
//   const filteredProjects = projects.filter(p => p.status === filter);

//   return (
//     <div className="min-h-screen bg-[#FDFDFD] font-sans text-slate-900 pb-20">
//       <Navbar />

//       <main className="max-w-6xl mx-auto pt-32 px-6">
        
//         {/* STATS RAPIDES */}
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
//           <StatCard icon={<Archive className="text-[#004751]" />} label="Projets en Ligne" value={stats.total_archived_projects || 0} />
//           <StatCard icon={<Users className="text-[#E91E63]" />} label="Communauté" value={`${stats.students || 0} Étudiants`} />
//           <StatCard icon={<Trophy className="text-amber-500" />} label="Top Auteur" value={stats.top_student || "—"} />
//         </div>

//         {/* HEADER & FILTRES SIMPLIFIÉS */}
//         <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
//           <div>
//             <div className="flex items-center gap-2 mb-2 text-[#004751]">
//                 <ShieldCheck size={18} />
//                 <span className="text-[10px] font-black uppercase tracking-[0.3em]">Gestion de l'Archive</span>
//             </div>
//             <h1 className="text-4xl font-black tracking-tight italic text-slate-900">Console <span className="text-[#E91E63]">Admin</span></h1>
//           </div>

//           <div className="flex items-center gap-4">
//             <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
//                 <button 
//                   onClick={() => setFilter('archived')} 
//                   className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${filter === 'archived' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}
//                 >
//                     Projets Actifs
//                 </button>
//                 <button 
//                   onClick={() => setFilter('error')} 
//                   className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${filter === 'error' ? 'bg-white shadow-sm text-red-500' : 'text-slate-400'}`}
//                 >
//                     Échecs (Nora)
//                 </button>
//             </div>
//             <button onClick={() => fetchData()} className="p-3.5 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all text-slate-400 shadow-sm">
//                 <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
//             </button>
//           </div>
//         </div>

//         {/* LISTE */}
//         {loading && projects.length === 0 ? (
//           <div className="py-20 flex flex-col items-center gap-4">
//             <Loader2 className="animate-spin text-[#E91E63]" size={40} />
//             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mise à jour de l'index...</p>
//           </div>
//         ) : filteredProjects.length > 0 ? (
//           <div className="grid gap-6">
//             {filteredProjects.map((project) => (
//               <div key={project.id} className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm hover:shadow-lg transition-all flex flex-col md:flex-row justify-between items-center gap-8">
//                 <div className="flex-1">
//                     <div className="flex items-center gap-3 mb-4">
//                         <span className="bg-slate-900 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">#{project.id}</span>
//                         <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest italic">{project.owner?.name}</span>
//                         {project.status === 'error' && (
//                           <span className="text-red-500 text-[9px] font-black uppercase bg-red-50 px-3 py-1 rounded-full flex items-center gap-1">
//                             <AlertCircle size={12} /> Erreur de traitement
//                           </span>
//                         )}
//                     </div>
//                     <h3 className="text-xl font-bold text-slate-900 mb-1">{project.title}</h3>
//                     <p className="text-sm text-slate-500 line-clamp-2 max-w-xl">{project.description}</p>
//                 </div>

//                 <div className="flex items-center gap-3">
//                     <a href={project.github_repository_url} target="_blank" rel="noreferrer" className="p-4 bg-slate-50 text-slate-400 hover:text-[#004751] rounded-2xl transition-all shadow-inner">
//                         <ExternalLink size={20} />
//                     </a>
                    
//                     <button 
//                       onClick={() => handleDelete(project.id)} 
//                       disabled={actionLoading === project.id}
//                       className="p-4 bg-white border-2 border-slate-50 text-slate-200 hover:text-red-500 hover:border-red-50 rounded-2xl transition-all"
//                     >
//                         {actionLoading === project.id ? <Loader2 className="animate-spin" size={20}/> : <Trash2 size={20} />}
//                     </button>
//                 </div>
//               </div>
//             ))}
//           </div>
//         ) : (
//           <div className="py-32 text-center bg-slate-50/30 rounded-[40px] border-2 border-dashed border-slate-100">
//               <FileText className="mx-auto text-slate-200 mb-4" size={48} />
//               <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.2em]">Aucun projet répertorié ici</p>
//           </div>
//         )}
//       </main>
//     </div>
//   );
// };

// const StatCard = ({ icon, label, value }) => (
//     <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-6 hover:shadow-md transition-shadow">
//         <div className="p-4 rounded-2xl bg-slate-50">{icon}</div>
//         <div>
//             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
//             <p className="text-3xl font-black text-slate-900 tracking-tighter">{value}</p>
//         </div>
//     </div>
// );

// export default AdminSpace;

import React, { useState, useEffect, useRef } from 'react';
import { 
  ExternalLink, Loader2, ShieldCheck, Users, FileText, 
  Trophy, Trash2, AlertCircle, RefreshCw, Archive, 
  BrainCircuit, CloudUpload, CheckCircle2, Info
} from 'lucide-react';
import api from "./api/axios";
import Navbar from './Navbar';

const AdminSpace = () => {
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({ total_projects: 0, students: 0, admins: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [filter, setFilter] = useState('archived'); // 'archived', 'error', 'knowledge'
  
  // États pour l'upload manuel
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const fileInputRef = useRef(null);

  const fetchData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const [projRes, statsRes] = await Promise.all([
        api.get('/admin/projects'),
        api.get('/admin/stats')
      ]);
      setProjects(projRes.data);
      setStats(statsRes.data);
      localStorage.setItem("dit_admin_projects_cache", JSON.stringify(projRes.data));
    } catch (err) {
      console.error("Erreur fetching admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- ACTION : INGESTION MANUELLE DE PDF ---
  const handleManualUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingDoc(true);
    setUploadMsg("Nora analyse le document...");
    const formData = new FormData();
    formData.append("file", file);

    try {
      await api.post('/chatbot/upload-doc', formData);
      setUploadMsg("✅ Document intégré au savoir de Nora !");
      setTimeout(() => setUploadMsg(""), 3000);
    } catch (err) {
      setUploadMsg("❌ Erreur lors de l'ingestion.");
    } finally {
      setUploadingDoc(false);
      e.target.value = null;
    }
  };

  // --- ACTION : APPRENDRE UN PROJET EXISTANT ---
  const handleIngestProject = async (projectId) => {
    setActionLoading(`ingest-${projectId}`);
    try {
      await api.post(`/chatbot/ingest/${projectId}`);
      alert("Nora a commencé l'apprentissage de ce projet en tâche de fond.");
    } catch (err) {
      alert("Erreur lors de l'envoi à Nora.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (projectId) => {
    if (!window.confirm("Supprimer définitivement ce projet ?")) return;
    setActionLoading(`delete-${projectId}`);
    try {
      await api.delete(`/admin/projects/${projectId}`);
      setProjects(projects.filter(p => p.id !== projectId));
    } catch (err) {
      alert("Erreur suppression.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] pb-20">
      <Navbar />

      <main className="max-w-6xl mx-auto pt-32 px-6">
        
        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <StatCard icon={<Archive className="text-[#004751]" />} label="Projets en Ligne" value={stats.total_archived_projects || 0} />
          <StatCard icon={<Users className="text-[#E91E63]" />} label="Communauté" value={`${stats.students || 0} Étudiants`} />
          <StatCard icon={<BrainCircuit className="text-purple-500" />} label="Index Nora" value="IA Active" />
        </div>

        {/* NAVIGATION & FILTRES */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6 border-b border-slate-100 pb-8">
          <div>
            <div className="flex items-center gap-2 mb-2 text-[#004751]">
                <ShieldCheck size={18} />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Console de contrôle</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900">Archive <span className="text-[#E91E63]">Manager</span></h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                <FilterBtn active={filter==='archived'} label="Projets" onClick={()=>setFilter('archived')} />
                <FilterBtn active={filter==='error'} label="Échecs" onClick={()=>setFilter('error')} />
                <FilterBtn active={filter==='knowledge'} label="Cerveau Nora" onClick={()=>setFilter('knowledge')} color="text-purple-600" />
            </div>
            <button onClick={() => fetchData()} className="p-3.5 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all text-slate-400">
                <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* CONTENU : CERVEAU NORA (UPLOAD MANUEL) */}
        {filter === 'knowledge' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-[40px] p-12 text-center max-w-2xl mx-auto">
              <div className="w-20 h-20 bg-purple-50 text-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <CloudUpload size={40} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-4">Enrichir le savoir de Nora</h2>
              <p className="text-slate-500 mb-8 leading-relaxed">
                Ajoutez des PDFs (règlements, cours, mémoires externes) directement dans la base vectorielle. 
                Nora pourra s'en servir pour répondre aux étudiants.
              </p>
              
              <input type="file" ref={fileInputRef} onChange={handleManualUpload} className="hidden" accept=".pdf" />
              
              <button 
                onClick={() => fileInputRef.current.click()}
                disabled={uploadingDoc}
                className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold hover:bg-black transition-all flex items-center gap-3 mx-auto disabled:opacity-50"
              >
                {uploadingDoc ? <Loader2 className="animate-spin" /> : <PlusCircle size={20} />}
                Sélectionner un PDF
              </button>

              {uploadMsg && (
                <p className="mt-6 text-sm font-bold text-purple-600 animate-pulse">{uploadMsg}</p>
              )}
            </div>
          </div>
        )}

        {/* CONTENU : LISTE DES PROJETS */}
        {(filter === 'archived' || filter === 'error') && (
          <div className="grid gap-6">
            {projects.filter(p => p.status === filter).map((project) => (
              <div key={project.id} className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="bg-slate-900 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase">#{project.id}</span>
                        <span className="text-slate-400 text-[10px] font-black uppercase italic">{project.owner?.first_name} {project.owner?.last_name}</span>
                        {project.status === 'error' && <span className="text-red-500 text-[9px] font-black uppercase bg-red-50 px-3 py-1 rounded-full flex items-center gap-1"><AlertCircle size={12} /> Erreur</span>}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-1">{project.title}</h3>
                    <p className="text-sm text-slate-500 line-clamp-2 max-w-xl">{project.description}</p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Bouton APPRENDRE (Ingestion vers Nora) */}
                    <button 
                      onClick={() => handleIngestProject(project.id)}
                      disabled={actionLoading === `ingest-${project.id}`}
                      className="flex items-center gap-2 px-5 py-3 bg-purple-50 text-purple-600 rounded-2xl text-xs font-black uppercase hover:bg-purple-100 transition-all border border-purple-100 disabled:opacity-50"
                      title="Forcer Nora à apprendre ce projet"
                    >
                      {actionLoading === `ingest-${project.id}` ? <Loader2 size={16} className="animate-spin" /> : <BrainCircuit size={16} />}
                      Apprendre
                    </button>

                    <a href={project.github_repository_url} target="_blank" rel="noreferrer" className="p-4 bg-slate-50 text-slate-400 hover:text-[#004751] rounded-2xl transition-all">
                        <ExternalLink size={20} />
                    </a>
                    
                    <button 
                      onClick={() => handleDelete(project.id)} 
                      disabled={actionLoading === `delete-${project.id}`}
                      className="p-4 bg-white border-2 border-slate-50 text-slate-200 hover:text-red-500 rounded-2xl transition-all"
                    >
                      {actionLoading === `delete-${project.id}` ? <Loader2 className="animate-spin" size={20}/> : <Trash2 size={20} />}
                    </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

// --- COMPOSANTS INTERNES ---

const StatCard = ({ icon, label, value }) => (
    <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-6">
        <div className="p-4 rounded-2xl bg-slate-50">{icon}</div>
        <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-3xl font-black text-slate-900 tracking-tighter">{value}</p>
        </div>
    </div>
);

const FilterBtn = ({ active, label, onClick, color="text-slate-900" }) => (
    <button 
        onClick={onClick} 
        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${active ? `bg-white shadow-sm ${color}` : 'text-slate-400'}`}
    >
        {label}
    </button>
);

const PlusCircle = ({size}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
)

export default AdminSpace;