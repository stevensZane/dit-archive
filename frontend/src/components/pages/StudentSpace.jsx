import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Loader2, Sparkles } from "lucide-react";
import api from "../api/axios";
import Navbar from "../navigations/Navbar";
import ProjectModal from "../student-space/ProjectModal";
import ProjectCard from "../student-space/ProjectCard";

const StudentPortal = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // On ne fetch plus les filières et les années, le backend s'en occupe
  const fetchProjects = async (silent = false) => {
    if (!silent) setFetchLoading(true);
    try {
      const res = await api.get("/projects/me");
      setProjects(res.data);
    } catch (err) {
      console.error("Erreur lors de la récupération des projets :", err);
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
    } else {
      fetchProjects();
    }
  }, []);

  const handleEditClick = (project) => {
    setProjectToEdit(project);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setProjectToEdit(null);
  };

  useEffect(() => {
    // Si certains projets sont encore en "pending", on revérifie toutes les 10 secondes
    const hasPendingProjects = projects.some(
      (p) => p.analysis_status === "pending",
    );

    if (hasPendingProjects) {
      const interval = setInterval(() => {
        fetchProjects(true); // "true" pour le mode silencieux (pas de gros loader au milieu de l'écran)
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [projects]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900">
      <Navbar />

      <main className="max-w-4xl mx-auto pt-32 pb-20 px-6">
        <header className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900">
              Bonjour,{" "}
              <span className="text-dit-teal">
                {user?.username || "Étudiant"} !
              </span>
            </h1>
            <p className="text-slate-500 mt-2 font-medium">
              Prêt à immortaliser ton travail ?
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="group bg-[#004751] text-white px-6 py-4 hover:bg-[#007A87] rounded-2xl flex items-center gap-3 transition-all shadow-lg shadow-teal-900/10"
          >
            <Plus
              size={20}
              className="group-hover:rotate-90 transition-transform"
            />
            <span className="font-bold text-sm uppercase tracking-wider">
              Ajouter un projet
            </span>
          </button>
        </header>

        <section>
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">
              Tes Archives
            </h2>
            <div className="h-[1px] flex-1 bg-slate-200"></div>
          </div>

          {fetchLoading ? (
            <div className="py-20 flex flex-col items-center gap-4 text-dit-teal opacity-50">
              <Loader2 size={40} className="animate-spin" />
              <span className="text-xs font-bold uppercase tracking-widest">
                Nora consulte les registres...
              </span>
            </div>
          ) : projects.length > 0 ? (
            <div className="grid gap-6">
              {projects.map((p) => (
                <ProjectCard key={p.id} project={p} onEdit={handleEditClick} />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center bg-white border-2 border-dashed border-slate-100 rounded-[40px]">
              <Sparkles size={40} className="mx-auto text-slate-200 mb-4" />
              <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">
                Ton historique est vide
              </p>
            </div>
          )}
        </section>
      </main>

      {/* UNE SEULE MODALE : Elle gère Création et Edition via initialData */}
      <ProjectModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        initialData={projectToEdit}
        onUploadSuccess={() => fetchProjects(true)}
      />
    </div>
  );
};

export default StudentPortal;
