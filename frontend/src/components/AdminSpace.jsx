// import React, { useState, useEffect } from 'react';
// import { CheckCircle, XCircle, Clock, ExternalLink, Loader2, ShieldCheck, Search, Eye } from 'lucide-react';
// import api from "./api/axios";
// import Navbar from './Navbar';

// const AdminSpace = () => {
//   const [projects, setProjects] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [actionLoading, setActionLoading] = useState(null); // ID du projet en cours de modération
//   const [filter, setFilter] = useState('pending');

//   const fetchProjects = async () => {
//     setLoading(true);
//     try {
//       const response = await api.get('/admin/projects'); // On suppose cet endpoint côté FastAPI
//       setProjects(response.data);
//     } catch (err) {
//       console.error("Erreur admin fetch:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchProjects();
//   }, []);

//   const handleStatusUpdate = async (projectId, newStatus) => {
//     setActionLoading(projectId);
//     try {
//       await api.patch(`/admin/projects/${projectId}/status`, { status: newStatus });
//       // On retire le projet de la liste locale après action
//       setProjects(projects.filter(p => p.id !== projectId));
//     } catch (err) {
//       alert("Erreur lors de la mise à jour du statut.");
//     } finally {
//       setActionLoading(null);
//     }
//   };

//   const handleReject = async (projectId) => {
//   const reason = window.prompt("Motif du rejet (ex: Fichier corrompu, dépôt incomplet...)");
//   if (reason) {
//     handleStatusUpdate(projectId, 'error', reason);
//     }
//   };

//   const filteredProjects = projects.filter(p => p.status === filter);

//   return (
//     <div className="min-h-screen bg-[#FDFDFD] font-sans text-slate-900">
//       <Navbar />

//       <main className="max-w-6xl mx-auto pt-32 pb-20 px-6">
//         {/* HEADER ADMIN */}
//         <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
//           <div>
//             <div className="flex items-center gap-2 mb-2">
//                 <ShieldCheck className="text-dit-teal" size={20} />
//                 <span className="text-[10px] font-black uppercase tracking-[0.3em] text-dit-teal">Panneau de Modération</span>
//             </div>
//             <h1 className="text-4xl font-black tracking-tight text-slate-900 italic">
//                 Espace <span className="text-dit-pink">Admin</span>
//             </h1>
//           </div>

//           <div className="flex bg-slate-100 p-1.5 rounded-2xl">
//             {['pending', 'archived', 'error'].map((s) => (
//               <button
//                 key={s}
//                 onClick={() => setFilter(s)}
//                 className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${
//                   filter === s ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'
//                 }`}
//               >
//                 {s === 'pending' ? 'En attente' : s === 'archived' ? 'Validés' : 'Erreurs'}
//               </button>
//             ))}
//           </div>
//         </div>

//         {/* LISTE DE MODÉRATION */}
//         {loading ? (
//           <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-dit-pink" size={40} /></div>
//         ) : filteredProjects.length > 0 ? (
//           <div className="grid gap-6">
//             {filteredProjects.map((project) => (
//               <div key={project.id} className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-center gap-8">
                
//                 <div className="flex-1 space-y-4">
//                   <div className="flex items-center gap-3">
//                     <span className="bg-slate-100 text-slate-600 text-[10px] font-black px-3 py-1 rounded-full">ID #{project.id}</span>
//                     <span className="text-slate-400 text-xs font-bold uppercase tracking-tighter italic">{project.owner?.name || "Étudiant inconnu"}</span>
//                   </div>
                  
//                   <div>
//                     <h3 className="text-xl font-bold text-slate-900 mb-1">{project.title}</h3>
//                     <p className="text-sm text-slate-500 line-clamp-2 max-w-xl">{project.description}</p>
//                   </div>

//                   <div className="flex flex-wrap gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
//                     <span className="bg-teal-50 text-dit-teal px-2 py-1 rounded">{project.program?.name}</span>
//                     <span className="bg-pink-50 text-dit-pink px-2 py-1 rounded">{project.level}</span>
//                     <span className="bg-slate-50 text-slate-500 px-2 py-1 rounded">{project.academic_year?.label}</span>
//                   </div>
//                 </div>

//                 {/* ACTIONS */}
//                 <div className="flex items-center gap-3 border-l border-slate-50 pl-8">
//                   <a 
//                     href={project.github_repository_url} 
//                     target="_blank" 
//                     rel="noreferrer"
//                     className="p-4 bg-slate-50 text-slate-600 rounded-2xl hover:bg-black hover:text-white transition-all"
//                     title="Voir le code"
//                   >
//                     <ExternalLink size={20} />
//                   </a>

//                   {filter === 'pending' && (
//                     <>
//                         <button 
//                             disabled={actionLoading === project.id}
//                             onClick={() => handleStatusUpdate(project.id, 'archived')}
//                             className="flex items-center gap-2 bg-emerald-500 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50"
//                         >
//                             {actionLoading === project.id ? <Loader2 className="animate-spin" size={16}/> : <CheckCircle size={18} />}
//                             Approuver
//                         </button>

//                         <button 
//                             disabled={actionLoading === project.id}
//                             onClick={() => handleStatusUpdate(project.id, 'error')}
//                             className="flex items-center gap-2 bg-white border-2 border-red-100 text-red-500 px-6 py-4 rounded-2xl font-black text-xs uppercase hover:bg-red-50 transition-all disabled:opacity-50"
//                         >
//                             <XCircle size={18} />
//                             Rejeter
//                         </button>
//                     </>
//                   )}
//                 </div>
//               </div>
//             ))}
//           </div>
//         ) : (
//           <div className="py-32 text-center">
//             <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
//                 <Clock className="text-slate-300" size={32} />
//             </div>
//             <p className="text-slate-400 font-bold uppercase text-xs tracking-[0.2em]">Rien à modérer pour le moment</p>
//           </div>
//         )}
//       </main>
//     </div>
//   );
// };

// export default AdminSpace;

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, XCircle, Clock, ExternalLink, Loader2, 
  ShieldCheck, Search, Eye, Users, FileText, UserPlus, PlusCircle, X, Send, FileArchive, Github,
  Trophy, Heart, Star, Zap
} from 'lucide-react';
import api from "./api/axios";
import Navbar from './Navbar';

const AdminSpace = () => {
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({ total_projects: 0, students: 0, admins: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [filter, setFilter] = useState('pending');
  const [isModalOpen, setIsModalOpen] = useState(false); // Pour l'ajout admin

  // Fetch initial
  const fetchData = async () => {
    setLoading(true);
    try {
      const [projRes, statsRes] = await Promise.all([
        api.get('/admin/projects'),
        api.get('/admin/stats') // Tu devras créer cet endpoint
      ]);
      setProjects(projRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error("Erreur admin:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Validation / Rejet
  const handleStatusUpdate = async (projectId, newStatus, reason = null) => {
    setActionLoading(projectId);
    try {
      await api.patch(`/admin/projects/${projectId}/status`, { 
        status: newStatus,
        rejection_reason: reason 
      });
      setProjects(projects.map(p => p.id === projectId ? { ...p, status: newStatus } : p));
      // Optionnel: On refetch les stats car un projet est passé de pending à archived
      fetchData(); 
    } catch (err) {
      alert("Erreur lors de la modération.");
    } finally {
      setActionLoading(null);
    }
  };

  const onReject = (projectId) => {
    const reason = window.prompt("Motif du rejet (ex: Code source manquant) :");
    if (reason) handleStatusUpdate(projectId, 'error', reason);
  };

  const filteredProjects = projects.filter(p => p.status === filter);

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-sans text-slate-900 pb-20">
      <Navbar />

      <main className="max-w-6xl mx-auto pt-32 px-6">
        
        {/* SECTION 1: QUICK STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <StatCard icon={<FileText className="text-dit-teal" />} label="Projets Archivés" value={stats.total_archived_projects} color="teal" />
          <StatCard icon={<ShieldCheck className="text-slate-400" />} label="Projets en attente" value={stats.pending_projects} color="slate" />
          <StatCard icon={<Users className="text-dit-pink" />} label="Étudiants" value={stats.students} color="pink" />
          <StatCard icon={<ShieldCheck className="text-slate-400" />} label="Modérateurs" value={stats.admins} color="slate" />
          {/* Carte : Top Contributeur */}
          <StatCard 
            icon={<Trophy className="text-amber-500" />} 
            label="Top Contributeur" 
            value={stats.top_student || "N/A"} 
            subValue={`${stats.top_student || 0} projets`}
            color="amber" 
          />

          {/* Carte : Projet Star (Plus liké ou plus vu) */}
          <StatCard 
            icon={<Heart className="text-red-500" />} 
            label="Projet Star" 
            value={stats.most_liked || "Aucun"} 
            subValue={`${stats.most_liked|| 0} favoris`}
            color="red" 
            className="text-[10px]"
          />
          
        </div>

        {/* SECTION 2: HEADER & ACTIONS */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2 text-dit-teal">
                <ShieldCheck size={18} />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Console de Gestion</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight italic">Flux de <span className="text-dit-pink">Modération</span></h1>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Filtres de Status */}
            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                {['pending', 'archived', 'error'].map((s) => (
                <button key={s} onClick={() => setFilter(s)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${filter === s ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>
                    {s === 'pending' ? 'À Valider' : s === 'archived' ? 'Archives' : 'Rejetés'}
                </button>
                ))}
            </div>

            {/* Bouton Ajout Admin */}
            <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase hover:bg-dit-teal transition-all shadow-xl shadow-slate-200"
            >
                <PlusCircle size={18} /> Ajouter un Projet
            </button>
          </div>
        </div>

        {/* SECTION 3: LISTE DES PROJETS */}
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-dit-pink" size={40} />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nora synchronise les données...</p>
          </div>
        ) : filteredProjects.length > 0 ? (
          <div className="grid gap-6">
            {filteredProjects.map((project) => (
              <ProjectAdminRow 
                key={project.id} 
                project={project} 
                onApprove={() => handleStatusUpdate(project.id, 'archived')}
                onReject={() => onReject(project.id)}
                isProcessing={actionLoading === project.id}
                showActions={filter === 'pending'}
              />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}

        {/* SECTION 4: PLACEHOLDERS "COMING SOON" */}
        <div className="mt-20 border-t border-slate-100 pt-10">
            <h4 className="text-[10px] font-black uppercase text-slate-300 tracking-[0.4em] mb-6 text-center">Fonctionnalités prochainement disponibles</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 opacity-40 grayscale">
                <div className="p-6 border border-dashed border-slate-200 rounded-3xl text-center text-[9px] font-bold uppercase tracking-widest">Export Excel</div>
                <div className="p-6 border border-dashed border-slate-200 rounded-3xl text-center text-[9px] font-bold uppercase tracking-widest">Logs de Nora</div>
                <div className="p-6 border border-dashed border-slate-200 rounded-3xl text-center text-[9px] font-bold uppercase tracking-widest">Gestion des Filières</div>
                <div className="p-6 border border-dashed border-slate-200 rounded-3xl text-center text-[9px] font-bold uppercase tracking-widest">Audit Sécurité</div>
            </div>
        </div>
      </main>

      {/* MODAL AJOUT ADMIN (Placeholder: On réutilise ton modal précédent si besoin) */}
      {isModalOpen && <AdminAddProjectModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
};

// --- SOUS-COMPOSANTS ---

const StatCard = ({ icon, label, value, color }) => (
    <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-6">
        <div className={`p-4 rounded-2xl bg-slate-50`}>{icon}</div>
        <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-3xl font-black text-slate-900 tracking-tighter">{value}</p>
        </div>
    </div>
);

const ProjectAdminRow = ({ project, onApprove, onReject, isProcessing, showActions }) => (
    <div className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm hover:shadow-lg hover:border-dit-teal/10 transition-all flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3">
                <span className="bg-slate-900 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase">ID #{project.id}</span>
                <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest italic">{project.owner?.name}</span>
            </div>
            <div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">{project.title}</h3>
                <p className="text-sm text-slate-500 line-clamp-2 max-w-xl">{project.description}</p>
            </div>
        </div>

        <div className="flex items-center gap-4">
            <a href={project.github_repository_url} target="_blank" rel="noreferrer" className="p-4 bg-slate-50 text-slate-400 hover:text-dit-teal rounded-2xl transition-all">
                <ExternalLink size={20} />
            </a>

            {showActions && (
                <div className="flex gap-2">
                    <button onClick={onApprove} disabled={isProcessing} className="bg-emerald-500 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase hover:bg-emerald-600 transition-all flex items-center gap-2 shadow-lg shadow-emerald-100">
                        {isProcessing ? <Loader2 className="animate-spin" size={16}/> : <CheckCircle size={18} />} Approuver
                    </button>
                    <button onClick={onReject} disabled={isProcessing} className="bg-white border-2 border-red-50 text-red-500 px-6 py-4 rounded-2xl font-black text-[10px] uppercase hover:bg-red-50 transition-all">
                        Rejeter
                    </button>
                </div>
            )}
            
            {project.status === 'error' && (
                <div className="bg-red-50 text-red-500 p-4 rounded-2xl text-[10px] font-bold max-w-[200px]">
                    ⚠️ Motif: {project.rejection_reason || "Aucune raison spécifiée"}
                </div>
            )}
        </div>
    </div>
);

const EmptyState = () => (
    <div className="py-32 text-center bg-slate-50/50 rounded-[40px] border-2 border-dashed border-slate-100">
        <Clock className="mx-auto text-slate-200 mb-4" size={48} />
        <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.2em]">Flux de modération vide</p>
    </div>
);

// Modal Simplifié pour l'admin
const AdminAddProjectModal = ({ onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
        <div className="bg-white w-full max-w-lg rounded-[40px] p-10 relative">
            <button onClick={onClose} className="absolute top-8 right-8 text-slate-300 hover:text-slate-900"><X /></button>
            <h2 className="text-2xl font-black italic mb-2">Ajout <span className="text-dit-pink">Direct</span></h2>
            <p className="text-xs text-slate-500 mb-8 font-medium">Archivage manuel d'un projet par l'administration.</p>
            <div className="space-y-6">
                <p className="text-center py-10 border-2 border-dashed border-slate-100 rounded-3xl text-slate-300 font-bold uppercase text-[9px]">Formulaire d'ajout manuel (Bientôt disponible)</p>
                <button onClick={onClose} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase">Fermer</button>
            </div>
        </div>
    </div>
);

export default AdminSpace;