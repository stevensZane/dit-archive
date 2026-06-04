import React, { useState, useEffect, useRef } from "react";
import {
  ShieldCheck,
  Archive,
  Users,
  BrainCircuit,
  PlusCircle,
  MoreVertical,
  MessageSquare,
  Megaphone,
  RefreshCw,
} from "lucide-react";
import api from "../api/axios";
import Navbar from "../navigations/Navbar";
import NoraBrain from "../admin/NoraBrain";
import StatCard from "../admin/StatCard";
import ProjectItem from "../admin/ProjectItem";
import AdminConfig from "../admin/AdminConfig";
import HistoricalUploadModal from "../admin/HistoricalUploadModal";

// Nouveaux composants d'administration
import AdminFeedbacksModal from "../admin/AdminFeedbacksModal";
import AdminBroadcastModal from "../admin/AdminBroadcastModal";

const CACHE_KEYS = {
  PROJECTS: "dit_admin_projects_cache",
  STATS: "dit_admin_stats_cache",
  ACTIVE_TAB: "dit_admin_active_tab",
};

const AdminSpace = () => {
  const userString = localStorage.getItem("user");
  const currentUser = userString ? JSON.parse(userString) : null;
  const isSuperAdmin = currentUser?.role === "superadmin";

  const [filter, setFilter] = useState(() => {
    const savedTab = localStorage.getItem(CACHE_KEYS.ACTIVE_TAB);
    if ((savedTab === "knowledge" || savedTab === "config") && !isSuperAdmin) {
      return "completed";
    }
    return savedTab || "completed";
  });

  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({ total_projects: 0, students: 0 });
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // États pour les nouvelles fonctionnalités de feedbacks, broadcast et maintenance
  const [isFeedbacksOpen, setIsFeedbacksOpen] = useState(false);
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isSyncingScores, setIsSyncingScores] = useState(false);
  
  const menuRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(CACHE_KEYS.ACTIVE_TAB, filter);
  }, [filter]);

  // Fermer le menu contextuel si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const [projRes, statsRes] = await Promise.all([
        api.get("/admin/projects"),
        api.get("/admin/stats"),
      ]);
      setProjects(projRes.data);
      setStats(statsRes.data);
      localStorage.setItem(CACHE_KEYS.PROJECTS, JSON.stringify(projRes.data));
      localStorage.setItem(CACHE_KEYS.STATS, JSON.stringify(statsRes.data));
    } catch (err) {
      console.error("Erreur API:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const cachedProj = localStorage.getItem(CACHE_KEYS.PROJECTS);
    const cachedStats = localStorage.getItem(CACHE_KEYS.STATS);
    if (cachedProj) setProjects(JSON.parse(cachedProj));
    if (cachedStats) setStats(JSON.parse(cachedStats));
    fetchData(true);
  }, []);

  // Fonction de secours pour recalculer les scores
  const handleRefreshScores = async () => {
    setMenuOpen(false);
    if (!window.confirm("Forcer le recalcul global des métadonnées et scores Nora de tous les projets ?")) return;
    
    setIsSyncingScores(true);
    try {
      // Ton endpoint de recalcul global
      await api.post("/admin/sync-old-points");
      alert("Recalcul global terminé avec succès !");
      fetchData(true);
    } catch (err) {
      console.error(err);
      alert("Erreur lors du recalcul des scores.");
    } finally {
      setIsSyncingScores(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] pb-20">
      <Navbar />
      <main className="max-w-6xl mx-auto pt-32 px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <StatCard
            icon={<Archive className="text-[#004751]" />}
            label="Projets"
            value={stats.completed_analysis || 0}
          />
          <StatCard
            icon={<Users className="text-[#E91E63]" />}
            label="Communauté"
            value={stats.students || 0}
          />
          <StatCard
            icon={<BrainCircuit className="text-purple-500" />}
            label="Index Nora"
            value={isSyncingScores ? "Recalcul..." : "Actif"}
          />
        </div>

        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6 border-b border-slate-100 pb-8">
          <div>
            <div className="flex items-center gap-2 mb-2 text-[#004751]">
              <ShieldCheck size={18} />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">
                Console Admin
              </span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
              Archive <span className="text-[#004751]">Manager</span>
            </h1>
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
              <FilterBtn
                active={filter === "completed"}
                label="Projets"
                onClick={() => setFilter("completed")}
              />
              <FilterBtn
                active={filter === "error"}
                label="Échecs"
                onClick={() => setFilter("error")}
              />
              {isSuperAdmin && (
                <>
                  <FilterBtn
                    active={filter === "knowledge"}
                    label="Nora"
                    onClick={() => setFilter("knowledge")}
                    color="text-purple-600"
                  />
                  <FilterBtn
                    active={filter === "config"}
                    label="Système"
                    onClick={() => setFilter("config")}
                    color="text-blue-600"
                  />
                </>
              )}
            </div>

            {/* BOUTON DES TROIS POINTS (Remplacement du refresh) */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className={`p-3.5 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all text-slate-600 ${menuOpen ? "ring-2 ring-[#004751]" : ""}`}
              >
                {isSyncingScores || loading ? (
                  <RefreshCw size={18} className="animate-spin text-[#004751]" />
                ) : (
                  <MoreVertical size={18} />
                )}
              </button>

              {/* Menu Contextuel Déroulant */}
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 py-2 animate-in fade-in slide-in-from-top-3 duration-200">
                  <button
                    onClick={() => { setMenuOpen(false); setIsFeedbacksOpen(true); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-700 hover:bg-slate-50 transition-all text-left"
                  >
                    <MessageSquare size={16} className="text-[#004751]" />
                    <span>Feedbacks Étudiants</span>
                  </button>

                  <button
                    onClick={() => { setMenuOpen(false); setIsBroadcastOpen(true); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-700 hover:bg-slate-50 transition-all text-left"
                  >
                    <Megaphone size={16} className="text-pink-600" />
                    <span>Broadcast E-mails</span>
                  </button>

                  <hr className="border-slate-100 my-1" />

                  <button
                    onClick={handleRefreshScores}
                    disabled={isSyncingScores}
                    className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-wider text-orange-600 hover:bg-orange-50 transition-all text-left disabled:opacity-50"
                  >
                    <RefreshCw size={16} className={isSyncingScores ? "animate-spin" : ""} />
                    <span>Forcer les scores</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="min-h-[400px]">
          {filter === "knowledge" && isSuperAdmin ? (
            <NoraBrain />
          ) : filter === "config" && isSuperAdmin ? (
            <AdminConfig />
          ) : (
            <div className="grid gap-6 animate-in fade-in duration-500">
              {(() => {
                // Normalisation et filtrage intelligent
                const filteredProjects = projects.filter((p) => {
                  const status = p.analysis_status?.toLowerCase();
                  
                  if (filter === "completed") {
                    return status === "completed" || status === "success";
                  }
                  if (filter === "error") {
                    // Gère si ton back renvoie "error", "failed" ou "failed_analysis" en majuscules ou minuscules
                    return status === "error" || status === "failed" || status?.includes("fail");
                  }
                  return status === filter;
                });

                if (filteredProjects.length > 0) {
                  return filteredProjects.map((project) => (
                    <ProjectItem
                      key={project.id}
                      project={project}
                      refresh={fetchData}
                    />
                  ));
                }

                return (
                  <div className="text-center py-20 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-100">
                    <p className="text-slate-400 font-medium italic text-sm">
                      {loading
                        ? "Mise à jour de la base..."
                        : `Aucun projet dans la catégorie "${filter === "error" ? "Échecs" : "Projets"}"`}
                    </p>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </main>

      <HistoricalUploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        refreshData={fetchData}
      />

      {/* NOUVEAUX MODALS INJECTÉS EN BAS POUR GARDER LE CODE CLEAN */}
      <AdminFeedbacksModal isOpen={isFeedbacksOpen} onClose={() => setIsFeedbacksOpen(false)} />
      <AdminBroadcastModal isOpen={isBroadcastOpen} onClose={() => setIsBroadcastOpen(false)} />
    </div>
  );
};

const FilterBtn = ({ active, label, onClick, color = "text-slate-900" }) => (
  <button
    onClick={onClick}
    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${active ? `bg-white shadow-sm ${color}` : "text-slate-400 hover:text-slate-600"}`}
  >
    {label}
  </button>
);

export default AdminSpace;