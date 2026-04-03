import React, { useState, useEffect } from 'react';
import { 
  ExternalLink, Loader2, ShieldCheck, Users, FileText, 
  Trophy, Trash2, AlertCircle, RefreshCw, Archive
} from 'lucide-react';
import api from "./api/axios";
import Navbar from './Navbar';

const AdminSpace = () => {
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({ total_projects: 0, students: 0, admins: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [filter, setFilter] = useState('archived'); 

  const fetchData = async () => {
    setLoading(true);
    try {
      const [projRes, statsRes] = await Promise.all([
        api.get('/admin/projects'),
        api.get('/admin/stats')
      ]);
      setProjects(projRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error("Erreur fetching admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (projectId) => {
    if (!window.confirm("Supprimer définitivement ce projet de l'archive ?")) return;
    
    setActionLoading(projectId);
    try {
      await api.delete(`/admin/projects/${projectId}`);
      setProjects(projects.filter(p => p.id !== projectId));
      fetchData();
    } catch (err) {
      alert("Erreur lors de la suppression.");
    } finally {
      setActionLoading(null);
    }
  };

  // On ne filtre plus que sur 'archived' ou 'error'
  const filteredProjects = projects.filter(p => p.status === filter);

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-sans text-slate-900 pb-20">
      <Navbar />

      <main className="max-w-6xl mx-auto pt-32 px-6">
        
        {/* STATS RAPIDES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <StatCard icon={<Archive className="text-dit-teal" />} label="Projets en Ligne" value={stats.total_archived_projects || 0} />
          <StatCard icon={<Users className="text-dit-pink" />} label="Communauté" value={`${stats.students || 0} Étudiants`} />
          <StatCard icon={<Trophy className="text-amber-500" />} label="Top Auteur" value={stats.top_student || "—"} />
        </div>

        {/* HEADER & FILTRES SIMPLIFIÉS */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2 text-dit-teal">
                <ShieldCheck size={18} />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Gestion de l'Archive</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight italic text-slate-900">Console <span className="text-dit-pink">Admin</span></h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                <button 
                  onClick={() => setFilter('archived')} 
                  className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${filter === 'archived' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}
                >
                    Projets Actifs
                </button>
                <button 
                  onClick={() => setFilter('error')} 
                  className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${filter === 'error' ? 'bg-white shadow-sm text-red-500' : 'text-slate-400'}`}
                >
                    Échecs (Nora)
                </button>
            </div>
            <button onClick={fetchData} className="p-3.5 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all text-slate-400 shadow-sm">
                <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* LISTE */}
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-dit-pink" size={40} />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mise à jour de l'index...</p>
          </div>
        ) : filteredProjects.length > 0 ? (
          <div className="grid gap-6">
            {filteredProjects.map((project) => (
              <div key={project.id} className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm hover:shadow-lg transition-all flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="bg-slate-900 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">#{project.id}</span>
                        <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest italic">{project.owner?.name}</span>
                        {project.status === 'error' && (
                          <span className="text-red-500 text-[9px] font-black uppercase bg-red-50 px-3 py-1 rounded-full flex items-center gap-1">
                            <AlertCircle size={12} /> Erreur de traitement
                          </span>
                        )}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-1">{project.title}</h3>
                    <p className="text-sm text-slate-500 line-clamp-2 max-w-xl">{project.description}</p>
                </div>

                <div className="flex items-center gap-3">
                    <a href={project.github_repository_url} target="_blank" rel="noreferrer" className="p-4 bg-slate-50 text-slate-400 hover:text-dit-teal rounded-2xl transition-all shadow-inner">
                        <ExternalLink size={20} />
                    </a>
                    
                    <button 
                      onClick={() => handleDelete(project.id)} 
                      disabled={actionLoading === project.id}
                      className="p-4 bg-white border-2 border-slate-50 text-slate-200 hover:text-red-500 hover:border-red-50 rounded-2xl transition-all"
                    >
                        {actionLoading === project.id ? <Loader2 className="animate-spin" size={20}/> : <Trash2 size={20} />}
                    </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-32 text-center bg-slate-50/30 rounded-[40px] border-2 border-dashed border-slate-100">
              <FileText className="mx-auto text-slate-200 mb-4" size={48} />
              <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.2em]">Aucun projet répertorié ici</p>
          </div>
        )}
      </main>
    </div>
  );
};

const StatCard = ({ icon, label, value }) => (
    <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-6 hover:shadow-md transition-shadow">
        <div className="p-4 rounded-2xl bg-slate-50">{icon}</div>
        <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-3xl font-black text-slate-900 tracking-tighter">{value}</p>
        </div>
    </div>
);

export default AdminSpace;