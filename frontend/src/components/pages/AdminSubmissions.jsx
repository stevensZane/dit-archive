import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  UploadCloud, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Search, 
  UserCheck,
  Calendar,
  GraduationCap,
  X 
} from "lucide-react";
import api from "../api/axios";
import Navbar from "../navigations/Navbar";

const AdminSubmissions = () => {
  const [selectedLevel, setSelectedLevel] = useState("L1");
  const [selectedYear, setSelectedYear] = useState("2025-2026");
  const [projectType, setProjectType] = useState("soutenance"); // "soutenance" | "all"
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all, deposited, missing
  const [rosterData, setRosterData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // États pour le lecteur de rapport interne
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportUrl, setReportUrl] = useState("");

  const levels = ["L1", "L2", "L3", "M1", "M2"];
  const academicYears = ["2023-2024", "2024-2025", "2025-2026", "2026-2027"];

  // Charger le statut des dépôts avec Filtres (Niveau, Année, Type de projet)
  const fetchSubmissionsStatus = async () => {
    setLoading(true);
    try {
      const res = await api.get(
        `/admin/submissions-status?level=${selectedLevel}&academic_year=${selectedYear}&project_type=${projectType}`
      );
      setRosterData(res.data);
    } catch (err) {
      console.error("Erreur lors de la récupération des dépôts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissionsStatus();
  }, [selectedLevel, selectedYear, projectType]);

  // Gérer l'import du fichier de la liste officielle
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("level", selectedLevel);
    formData.append("academic_year", selectedYear);

    setUploading(true);
    try {
      await api.post("/admin/roster/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      alert("Liste officielle mise à jour et synchronisée avec succès !");
      fetchSubmissionsStatus();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Erreur lors de l'importation du fichier.");
    } finally {
      setUploading(false);
    }
  };

  // Ouvrir le rapport en mode sécurisé
  const handleViewReport = (projectId) => {
    const baseUrl = api.defaults.baseURL.replace(/\/$/, "");
    const token = localStorage.getItem("token") || localStorage.getItem("votre_cle_token") || "";
    const secureUrl = `${baseUrl}/projects/${projectId}/report?action=view&token=${token}`;
    setReportUrl(secureUrl);
    setIsReportOpen(true);
  };

  // Filtrage des données côté client (Recherche & Statut)
  const filteredStudents = rosterData.filter((student) => {
    const fullName = `${student.first_name} ${student.last_name}`.toLowerCase();
    const matchesSearch = fullName.includes(searchQuery.toLowerCase()) || student.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterStatus === "deposited") return matchesSearch && student.has_deposited;
    if (filterStatus === "missing") return matchesSearch && !student.has_deposited;
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#FDFDFD] pb-12">
      <Navbar />
      
      <main className="max-w-7xl mx-auto pt-28 px-6">
        {/* En-tête */}
        <button
          onClick={() => window.location.href = "/admin-space"}
          className="inline-flex items-center gap-2 text-gray-500 hover:text-[#004751] font-medium mb-6 transition-colors group text-sm"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Retour à la Console Admin
        </button>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-2 text-emerald-600">
              <UserCheck size={18} />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">
                Scolarité & Suivi Pédagogique
              </span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
              Suivi des <span className="text-[#004751]">Rapports</span>
            </h1>
          </div>

          {/* Import Roster */}
          <div className="relative">
            <label className={`flex items-center gap-3 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider border-2 border-dashed transition-all cursor-pointer ${
              uploading 
                ? "bg-slate-50 border-slate-300 text-slate-400" 
                : "bg-white border-slate-200 text-slate-700 hover:border-[#004751] hover:bg-slate-50 shadow-sm"
            }`}>
              <UploadCloud size={16} className="text-slate-400" />
              <span>{uploading ? "Importation..." : `Importer Roster ${selectedLevel} (${selectedYear})`}</span>
              <input 
                type="file" 
                accept=".csv, .xlsx, .xls, .txt" 
                className="hidden" 
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </label>
          </div>
        </div>

        {/* Barre de Filtres Principaux : Niveau + Année + Type de Projet */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 bg-slate-50/80 p-3 rounded-3xl border border-slate-200/80">
          <div className="flex flex-wrap items-center gap-4">
            {/* Sélecteur de Niveau */}
            <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
              {levels.map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setSelectedLevel(lvl)}
                  className={`px-5 py-2 rounded-xl text-[11px] font-black uppercase transition-all ${
                    selectedLevel === lvl 
                      ? "bg-[#004751] text-white shadow-sm" 
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>

            {/* Sélecteur d'Année Académique */}
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm">
              <Calendar size={16} className="text-[#004751]" />
              <span className="text-xs font-bold text-slate-400 uppercase">Année:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                {academicYears.map((yr) => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Filtre Type de projet */}
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm">
            <GraduationCap size={18} className="text-[#004751]" />
            <span className="text-xs font-bold text-slate-400 uppercase">Projets:</span>
            <select
              value={projectType}
              onChange={(e) => setProjectType(e.target.value)}
              className="bg-transparent text-xs font-bold text-[#004751] focus:outline-none cursor-pointer"
            >
              <option value="soutenance">🎓 Fin d'Année / Soutenance</option>
              <option value="all">📁 Tous les projets</option>
            </select>
          </div>
        </div>

        {/* Recherche et Filtres d'état */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher par nom ou e-mail..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#004751] transition-all shadow-sm"
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
            <button
              onClick={() => setFilterStatus("all")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${filterStatus === "all" ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-600"}`}
            >
              Tous ({rosterData.length})
            </button>
            <button
              onClick={() => setFilterStatus("deposited")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${filterStatus === "deposited" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-white border border-slate-200 text-slate-600"}`}
            >
              Déposés ({rosterData.filter(r => r.has_deposited).length})
            </button>
            <button
              onClick={() => setFilterStatus("missing")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${filterStatus === "missing" ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-white border border-slate-200 text-slate-600"}`}
            >
              Manquants ({rosterData.filter(r => !r.has_deposited).length})
            </button>
          </div>
        </div>

        {/* Grand Tableau de Suivi avec Défilement Interne */}
        <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden">
          {loading ? (
            <div className="text-center py-28 text-slate-400 font-medium animate-pulse">
              Chargement des dépôts pour la promotion {selectedLevel} ({selectedYear})...
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-28 bg-slate-50/50 italic text-slate-400 text-sm">
              Aucun étudiant trouvé pour {selectedLevel} - {selectedYear}.
            </div>
          ) : (
            /* Zone de Scroll Fixe : Hauteur Maximale de 650px */
            <div className="overflow-x-auto max-h-[650px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                {/* En-tête Sticky (Fixe au scroll) */}
                <thead className="sticky top-0 z-10 bg-slate-100/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
                  <tr>
                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-wider text-slate-500">Étudiant</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-500">Statut</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-500">Date de dépôt</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-500">Sujet de Soutenance</th>
                    <th className="px-8 py-4 text-right text-[10px] font-black uppercase tracking-wider text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((student, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-8 py-4">
                        <div className="font-bold text-slate-800 text-sm">
                          {student.last_name.toUpperCase()} {student.first_name}
                        </div>
                        <div className="text-xs text-slate-400">{student.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        {student.has_deposited ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-200/60">
                            <CheckCircle2 size={14} /> Déposé
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-700 rounded-full text-xs font-bold border border-rose-200/60">
                            <XCircle size={14} /> Manquant
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {student.deposited_at 
                          ? new Date(student.deposited_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) 
                          : "-"}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-700 max-w-sm truncate">
                        {student.project_title || "-"}
                      </td>
                      <td className="px-8 py-4 text-right">
                        {student.has_deposited && student.project_id ? (
                          <button
                            onClick={() => handleViewReport(student.project_id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-[#004751] text-[#004751] hover:text-white rounded-xl text-xs font-bold transition-all border border-teal-100 shadow-sm"
                          >
                            <FileText size={14} /> Voir le rapport
                          </button>
                        ) : (
                          <span className="text-xs text-slate-300 pointer-events-none">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Lecteur PDF Modal */}
      {isReportOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full h-full max-w-5xl rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2 text-[#004751]">
                <FileText size={20} />
                <span className="text-xs font-black uppercase tracking-widest">Visionneuse de Rapport Institutionnel</span>
              </div>
              <button 
                onClick={() => setIsReportOpen(false)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 bg-slate-800">
              <iframe
                src={reportUrl}
                title="Lecteur de Rapport PDF"
                className="w-full h-full border-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSubmissions;