import React, { useState, useMemo } from "react";
import {
  Database,
  Search,
  Download,
  ExternalLink,
  Filter,
  FileSpreadsheet,
  Globe,
  Sparkles,
  Plus,
  Copy,
  Check,
  Tag,
  BarChart2,
  FolderArchive,
  X,
  Share2,
} from "lucide-react";
import Navbar from "../navigations/Navbar";

// Jeux de données référencés (Exemples contextualisés DIT & Afrique / Open Data)
const INITIAL_DATASETS = [
  {
    id: "ds-1",
    title: "Dakar Traffic & Mobility Dataset",
    description: "Relevés de trafic urbain et flux de transport en commun (BRT, Dakar Dem Dikk) sur les grands axes de la région de Dakar.",
    category: "Mobilité & Transport",
    format: "CSV",
    size: "142 MB",
    rowsCount: "450k+ lignes",
    sourceName: "OpenData Sénégal",
    downloadUrl: "https://github.com/",
    license: "CC BY 4.0",
    downloadsCount: 320,
    isPopular: true,
    tags: ["Dakar", "Trafic", "SIG", "Transport"],
  },
  {
    id: "ds-2",
    title: "Wolof Speech & NLP Audio Corpus",
    description: "Dataset audio et transcriptions textuelles en Wolof pour le traitement automatique du langage naturel (STT / TTS).",
    category: "NLP & IA Vocale",
    format: "JSON / Audio",
    size: "1.8 GB",
    rowsCount: "12,000 audios",
    sourceName: "Hugging Face",
    downloadUrl: "https://huggingface.co/datasets",
    license: "MIT",
    downloadsCount: 540,
    isPopular: true,
    tags: ["Wolof", "Audio", "Whisper", "NLP"],
  },
  {
    id: "ds-3",
    title: "West African Agricultural Crop Yields",
    description: "Données de rendements agricoles et météo par satellite (NDVI) pour le Sénégal et la sous-région Ouest-Africaine (2015-2024).",
    category: "Agriculture & Climat",
    format: "Parquet",
    size: "85 MB",
    rowsCount: "120k relevés",
    sourceName: "Kaggle",
    downloadUrl: "https://www.kaggle.com/datasets",
    license: "Public Domain",
    downloadsCount: 185,
    isPopular: false,
    tags: ["Satellite", "Climat", "AgriTech"],
  },
  {
    id: "ds-4",
    title: "Sub-Saharan FinTech Transactions Benchmark",
    description: "Données anonymisées de transactions Mobile Money pour la détection de fraudes et l'analyse de séries temporelles.",
    category: "Fintech & Finance",
    format: "CSV",
    size: "310 MB",
    rowsCount: "1.2M lignes",
    sourceName: "DIT Research Lab",
    downloadUrl: "https://drive.google.com",
    license: "Académique DIT",
    downloadsCount: 412,
    isPopular: true,
    tags: ["Mobile Money", "Fraude", "Finance"],
  },
  {
    id: "ds-5",
    title: "Senegalese Healthcare Centers & Equipment",
    description: "Cartographie et caractéristiques des structures de santé publiques et privées au Sénégal avec capacités d'accueil.",
    category: "Santé Publique",
    format: "GEOJSON",
    size: "12 MB",
    rowsCount: "3,200 points",
    sourceName: "Ministère de la Santé",
    downloadUrl: "https://github.com/",
    license: "Open Data",
    downloadsCount: 95,
    isPopular: false,
    tags: ["Santé", "SIG", "Hôpitaux"],
  },
];

const CATEGORIES = [
  "Tous",
  "NLP & IA Vocale",
  "Mobilité & Transport",
  "Fintech & Finance",
  "Agriculture & Climat",
  "Santé Publique",
];

const DataPlace = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tous");
  const [selectedFormat, setSelectedFormat] = useState("Tous");
  const [copiedId, setCopiedId] = useState(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  // Formulaire de proposition de dataset
  const [newDataset, setNewDataset] = useState({
    title: "",
    category: "NLP & IA Vocale",
    format: "CSV",
    downloadUrl: "",
    description: "",
    sourceName: "Kaggle / GitHub / HuggingFace",
  });

  // Filtrage combiné (Recherche + Catégorie + Format)
  const filteredDatasets = useMemo(() => {
    return INITIAL_DATASETS.filter((ds) => {
      const matchesSearch =
        ds.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ds.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ds.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory =
        selectedCategory === "Tous" || ds.category === selectedCategory;

      const matchesFormat =
        selectedFormat === "Tous" ||
        ds.format.toLowerCase().includes(selectedFormat.toLowerCase());

      return matchesSearch && matchesCategory && matchesFormat;
    });
  }, [searchTerm, selectedCategory, selectedFormat]);

  const handleCopyLink = (id, url) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDatasetSubmit = (e) => {
    e.preventDefault();
    alert("Merci ! Le lien du dataset a été soumis pour validation par l'équipe administrative du DIT.");
    setIsSubmitModalOpen(false);
    setNewDataset({
      title: "",
      category: "NLP & IA Vocale",
      format: "CSV",
      downloadUrl: "",
      description: "",
      sourceName: "",
    });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 pb-24">
      <Navbar />

      {/* HEADER HERO */}
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
              Le catalogue centralisé des jeux de données open source, académiques et africains. 
              Accédez directement aux sources officielles et téléchargez les fichiers certifiés pour vos modèles.
            </p>
          </div>

          <button
            onClick={() => setIsSubmitModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 bg-[#004751] text-white rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-all shadow-md shadow-teal-900/10 shrink-0"
          >
            <Plus size={16} />
            <span>Proposer un Dataset</span>
          </button>
        </div>
      </header>

      {/* STATS RAPIDES */}
      <section className="max-w-6xl mx-auto px-6 mt-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatMiniCard icon={FolderArchive} label="Datasets Référencés" value="24+" />
          <StatMiniCard icon={BarChart2} label="Domaines d'Étude" value="8 Filières" />
          <StatMiniCard icon={Globe} label="Accès Direct" value="100% Open" />
          <StatMiniCard icon={Sparkles} label="Recommandés Nora" value="Standard DIT" />
        </div>
      </section>

      {/* BARRE DE RECHERCHE ET FILTRES */}
      <main className="max-w-6xl mx-auto px-6 mt-10">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
          
          {/* Champ Recherche */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par titre, mot-clé (ex: Wolof, Trafic)..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#004751] focus:bg-white transition-all"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filtres Catégories Pillules */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? "bg-[#004751] text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* LISTE DES DATASETS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredDatasets.length > 0 ? (
            filteredDatasets.map((ds) => (
              <div
                key={ds.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md hover:border-teal-200 transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Tag En-tête */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-[11px] font-bold rounded-lg border border-slate-200/60">
                      {ds.category}
                    </span>
                    <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-100">
                      {ds.format}
                    </span>
                  </div>

                  {/* Titre */}
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#004751] transition-colors mb-2 flex items-center gap-2">
                    {ds.title}
                    {ds.isPopular && (
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
                        Populaire
                      </span>
                    )}
                  </h3>

                  {/* Description */}
                  <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4 line-clamp-3">
                    {ds.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {ds.tags.map((tag, idx) => (
                      <span key={idx} className="text-[10px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Métadonnées & Actions */}
                <div className="pt-4 border-t border-slate-100">
                  <div className="grid grid-cols-3 gap-2 text-center mb-4 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-slate-600">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Taille</p>
                      <p className="text-xs font-bold text-slate-800">{ds.size}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Volume</p>
                      <p className="text-xs font-bold text-slate-800">{ds.rowsCount}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Source</p>
                      <p className="text-xs font-bold text-slate-800 truncate">{ds.sourceName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Bouton Téléchargement / Accès Lien Direct */}
                    <a
                      href={ds.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#004751] text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all shadow-sm"
                    >
                      <Download size={14} />
                      <span>Télécharger</span>
                      <ExternalLink size={12} className="opacity-70" />
                    </a>

                    {/* Copier le lien */}
                    <button
                      onClick={() => handleCopyLink(ds.id, ds.downloadUrl)}
                      title="Copier le lien source"
                      className="p-2.5 bg-slate-100 hover:bg-slate-200/70 text-slate-600 rounded-xl transition-all"
                    >
                      {copiedId === ds.id ? (
                        <Check size={16} className="text-emerald-600" />
                      ) : (
                        <Share2 size={16} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-slate-200">
              <Database size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-600 font-bold text-sm">Aucun dataset ne correspond à votre recherche.</p>
              <p className="text-slate-400 text-xs mt-1">Essayez d'ajuster les filtres ou le terme de recherche.</p>
            </div>
          )}
        </div>
      </main>

      {/* MODAL PROPOSER UN DATASET (Lien Externe) */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2 text-[#004751]">
                <Database size={20} />
                <h3 className="font-extrabold text-base text-slate-900">Proposer un Dataset Externes</h3>
              </div>
              <button 
                onClick={() => setIsSubmitModalOpen(false)} 
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleDatasetSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Titre du Dataset *</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Dakar Bus Routes & GPS Logs"
                  value={newDataset.title}
                  onChange={(e) => setNewDataset({ ...newDataset, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#004751] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Domaine / Catégorie</label>
                  <select
                    value={newDataset.category}
                    onChange={(e) => setNewDataset({ ...newDataset, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#004751] focus:outline-none"
                  >
                    {CATEGORIES.filter((c) => c !== "Tous").map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Format principal</label>
                  <input
                    type="text"
                    placeholder="ex: CSV, Parquet, JSON"
                    value={newDataset.format}
                    onChange={(e) => setNewDataset({ ...newDataset, format: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#004751] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Lien Source / Téléchargement (URL) *</label>
                <input
                  type="url"
                  required
                  placeholder="https://kaggle.com/..., https://huggingface.co/..."
                  value={newDataset.downloadUrl}
                  onChange={(e) => setNewDataset({ ...newDataset, downloadUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#004751] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Courte Description</label>
                <textarea
                  rows={3}
                  placeholder="Décrivez brièvement le contenu et l'utilité du dataset pour les étudiants..."
                  value={newDataset.description}
                  onChange={(e) => setNewDataset({ ...newDataset, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#004751] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="w-1/2 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-[#004751] text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all"
                >
                  Soumettre le lien
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Composant Carte Stat
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