import React, { useState, useEffect, useMemo } from "react";
import { Database, Search, Plus, Globe, Sparkles, FolderArchive, BarChart2, X } from "lucide-react";
import Navbar from "../navigations/Navbar";
import { DatasetCard } from "../dataplace/DatasetCard";
import { DatasetModalSubmit } from "../dataplace/DatasetModalSubmit";
import api from "../api/axios";

const CATEGORIES = [
  "Tous",
  "NLP & IA Vocale",
  "Mobilité & Transport",
  "Fintech & Finance",
  "Agriculture & Climat",
  "Santé Publique",
  "Autre"
];

const DataPlace = () => {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tous");
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  // Inspection sécurisée du localStorage pour identifier l'utilisateur
  const storedUser = localStorage.getItem("user");
  let user = null;

  try {
    user = storedUser ? JSON.parse(storedUser) : null;
  } catch {
    user = null;
  }

  const currentUserId = user?.id ?? null;
  const userRole = user?.role ?? "guest";

  // Vérification si l'utilisateur est authentifié et non-guest
  const canSubmitDataset = user !== null && userRole !== "guest";

  // Récupération dynamique depuis l'API centralisée
  const fetchDatasets = async () => {
    try {
      const response = await api.get("/api/dataplace");
      setDatasets(response.data);
    } catch (err) {
      console.error("Erreur chargement datasets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  // Suppression sécurisée via Axios
  const handleDelete = async (id) => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce dataset ?")) return;
    try {
      await api.delete(`/api/dataplace/${id}`);
      setDatasets((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      console.error("Erreur suppression:", err);
      alert(err.response?.data?.detail || "Action non autorisée ou erreur serveur.");
    }
  };

  const filteredDatasets = useMemo(() => {
    return datasets.filter((ds) => {
      const matchesSearch =
        ds.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ds.description && ds.description.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory =
        selectedCategory === "Tous" || ds.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [datasets, searchTerm, selectedCategory]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 pb-24">
      <Navbar />

      <header className="pt-32 pb-12 bg-white border-b border-slate-200/80 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-50 text-[#004751] border border-teal-100 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
              <Database size={14} />
              <span>DIT Open Data Hub</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              Data <span className="text-[#004751]">Place</span>
            </h1>
            <p className="text-sm md:text-base text-slate-500 mt-2 max-w-2xl font-medium leading-relaxed">
              Le catalogue centralisé des jeux de données ouverts et académiques. Partagez vos datasets ou accédez aux sources officielles.
            </p>
          </div>

          {/* Affichage conditionnel du bouton : Masqué pour les Guests */}
          {canSubmitDataset && (
            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="flex items-center gap-2 px-5 py-3 bg-[#004751] text-white rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-all shadow-md shadow-teal-900/10 shrink-0"
            >
              <Plus size={16} />
              <span>Proposer un Dataset</span>
            </button>
          )}
        </div>
      </header>

      {/* STATS RAPIDES */}
      <section className="max-w-6xl mx-auto px-6 mt-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatMiniCard icon={FolderArchive} label="Datasets Référencés" value={`${datasets.length}+`} />
          <StatMiniCard icon={BarChart2} label="Domaines d'Étude" value="8 Filières" />
          <StatMiniCard icon={Globe} label="Accès Direct" value="100% Open" />
          <StatMiniCard icon={Sparkles} label="Recommandés Nora" value="Standard DIT" />
        </div>
      </section>

      {/* RECHERCHE ET FILTRES */}
      <main className="max-w-6xl mx-auto px-6 mt-10">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par titre ou description..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#004751]"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  selectedCategory === cat ? "bg-[#004751] text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* LISTE DES DATASETS */}
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-sm font-medium">Chargement des datasets...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredDatasets.length > 0 ? (
              filteredDatasets.map((ds) => (
                <DatasetCard
                  key={ds.id}
                  dataset={ds}
                  currentUserId={currentUserId}
                  userRole={userRole}
                  onDelete={handleDelete}
                />
              ))
            ) : (
              <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                <Database size={40} className="mx-auto text-slate-300 mb-3" />
                <p className="text-slate-600 font-bold text-sm">Aucun dataset disponible.</p>
              </div>
            )}
          </div>
        )}
      </main>

      <DatasetModalSubmit
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onSubmitSuccess={fetchDatasets}
      />
    </div>
  );
};

const StatMiniCard = ({ icon: Icon, label, value }) => (
  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
    <div className="p-2.5 bg-slate-100 text-[#004751] rounded-xl">
      <Icon size={18} />
    </div>
    <div>
      <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-sm font-bold text-slate-900">{value}</p>
    </div>
  </div>
);

export default DataPlace;