import React, { useState, useEffect } from 'react';
import { ShieldCheck, RefreshCw, Archive, Users, BrainCircuit, PlusCircle } from 'lucide-react';
import api from "./api/axios";
import Navbar from './Navbar';
import NoraBrain from './admin/NoraBrain';
import StatCard from './admin/StatCard';
import ProjectItem from './admin/ProjectItem';
import AdminConfig from './admin/AdminConfig';
import HistoricalUploadModal from './admin/HistoricalUploadModal';

// Constantes pour le cache
const CACHE_KEYS = {
    PROJECTS: "dit_admin_projects_cache",
    STATS: "dit_admin_stats_cache",
    ACTIVE_TAB: "dit_admin_active_tab"
};

const AdminSpace = () => {
  // 1. Initialisation de l'onglet via localStorage (ou 'completed' par défaut)
  const [filter, setFilter] = useState(() => {
    return localStorage.getItem(CACHE_KEYS.ACTIVE_TAB) || 'completed';
  });

  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({ total_projects: 0, students: 0 });
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Sauvegarder l'onglet dès qu'il change
  useEffect(() => {
    localStorage.setItem(CACHE_KEYS.ACTIVE_TAB, filter);
  }, [filter]);

  const fetchData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const [projRes, statsRes] = await Promise.all([
        api.get('/admin/projects'),
        api.get('/admin/stats')
      ]);
      
      setProjects(projRes.data);
      setStats(statsRes.data);
      
      // Mise à jour du cache
      localStorage.setItem(CACHE_KEYS.PROJECTS, JSON.stringify(projRes.data));
      localStorage.setItem(CACHE_KEYS.STATS, JSON.stringify(statsRes.data));
    } catch (err) {
      console.error("Erreur API:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 2. Charger le cache immédiatement au montage
    const cachedProj = localStorage.getItem(CACHE_KEYS.PROJECTS);
    const cachedStats = localStorage.getItem(CACHE_KEYS.STATS);
    
    if (cachedProj) setProjects(JSON.parse(cachedProj));
    if (cachedStats) setStats(JSON.parse(cachedStats));

    // 3. Rafraîchir les données en arrière-plan
    fetchData(true);
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFDFD] pb-20">
      <Navbar />
      <main className="max-w-6xl mx-auto pt-32 px-6">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <StatCard icon={<Archive className="text-[#004751]" />} label="Projets" value={stats.completed_analysis || 0} />
          <StatCard icon={<Users className="text-[#E91E63]" />} label="Communauté" value={stats.students || 0} />
          <StatCard icon={<BrainCircuit className="text-purple-500" />} label="Index Nora" value="Actif" />
        </div>

        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6 border-b border-slate-100 pb-8">
          <div>
            <div className="flex items-center gap-2 mb-2 text-[#004751]">
                <ShieldCheck size={18} />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Console Admin</span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Archive <span className="text-[#E91E63]">Manager</span></h1>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-5 py-3 bg-[#004751] text-white rounded-2xl text-[10px] font-black uppercase hover:bg-slate-800 transition-all shadow-lg shadow-teal-900/20"
            >
                <PlusCircle size={16} />
                <span>Ajouter Projet</span>
            </button>

            <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                <FilterBtn active={filter==='completed'} label="Projets" onClick={()=>setFilter('completed')} />
                <FilterBtn active={filter==='error'} label="Échecs" onClick={()=>setFilter('error')} />
                <FilterBtn active={filter==='knowledge'} label="Nora" onClick={()=>setFilter('knowledge')} color="text-purple-600" />
                <FilterBtn active={filter==='config'} label="Système" onClick={()=>setFilter('config')} color="text-blue-600" />
            </div>
            
            <button onClick={() => fetchData()} className="p-3.5 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all text-slate-400">
                <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        <div className="min-h-[400px]">
            {filter === 'knowledge' ? (
            <NoraBrain />
            ) : filter === 'config' ? (
            <AdminConfig />
            ) : (
            <div className="grid gap-6 animate-in fade-in duration-500">
                {projects.filter(p => p.analysis_status === filter).length > 0 ? (
                    projects.filter(p => p.analysis_status === filter).map(project => (
                        <ProjectItem key={project.id} project={project} refresh={fetchData} />
                    ))
                ) : (
                    <div className="text-center py-20 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-100">
                        <p className="text-slate-400 font-medium italic text-sm">
                            {loading ? "Mise à jour de la base..." : "Aucun projet dans cette catégorie"}
                        </p>
                    </div>
                )}
            </div>
            )}
        </div>
      </main>
      
      <HistoricalUploadModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        refreshData={fetchData} 
      />
    </div>
  );
};

// Composant Bouton de filtre exporté localement pour la propreté
const FilterBtn = ({ active, label, onClick, color="text-slate-900" }) => (
    <button onClick={onClick} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${active ? `bg-white shadow-sm ${color}` : 'text-slate-400 hover:text-slate-600'}`}>
        {label}
    </button>
);

export default AdminSpace;