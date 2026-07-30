import React, { useState, useEffect } from "react";
import { Database, X, Upload, Link as LinkIcon, AlertCircle } from "lucide-react";
import api from "../api/axios";

const CATEGORIES = [
  "NLP & IA Vocale",
  "Mobilité & Transport",
  "Fintech & Finance",
  "Agriculture & Climat",
  "Santé Publique",
  "Autre"
];

const FORMAT_OPTIONS = ["CSV", "JSON", "Parquet", "ZIP", "XLSX", "Audio / WAV", "Autre"];

const INITIAL_FORM = {
  title: "",
  category: "NLP & IA Vocale",
  format: "CSV",
  size_label: "Inconnu",
  rows_label: "Inconnu",
  description: "",
  sourceName: "DIT Lab",
  external_url: "",
  file: null
};

// Utilitaire pour détecter le format à partir d'un nom de fichier ou d'une URL
const detectFormat = (filenameOrUrl = "") => {
  if (!filenameOrUrl) return "Autre";
  
  // Extraire l'extension (ex: .csv -> CSV)
  const cleanPath = filenameOrUrl.split("?")[0]; // Supprime les paramètres d'URL si présent
  const ext = cleanPath.split(".").pop().toUpperCase();

  if (["CSV", "TXT", "TSV"].includes(ext)) return "CSV";
  if (ext === "JSON" || ext === "JSONL") return "JSON";
  if (ext === "PARQUET") return "Parquet";
  if (["ZIP", "RAR", "7Z", "TAR", "GZ"].includes(ext)) return "ZIP";
  if (["XLSX", "XLS"].includes(ext)) return "XLSX";
  if (["WAV", "MP3", "FLAC", "OGG", "M4A"].includes(ext)) return "Audio / WAV";

  return FORMAT_OPTIONS.includes(ext) ? ext : "Autre";
};

export const DatasetModalSubmit = ({ isOpen, onClose, onSubmitSuccess, datasetToEdit = null }) => {
  const [tab, setTab] = useState("file");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [formData, setFormData] = useState(INITIAL_FORM);

  const isEditing = Boolean(datasetToEdit);

  useEffect(() => {
    if (datasetToEdit) {
      setFormData({
        title: datasetToEdit.title || "",
        category: datasetToEdit.category || "NLP & IA Vocale",
        format: datasetToEdit.format || "CSV",
        size_label: datasetToEdit.size_label || "N/A",
        rows_label: datasetToEdit.rows_label || "N/A",
        description: datasetToEdit.description || "",
        sourceName: datasetToEdit.source_name || "DIT Lab",
        external_url: datasetToEdit.download_url || "",
        file: null
      });
      setTab(datasetToEdit.cloudinary_public_id ? "file" : "external");
    } else {
      setFormData(INITIAL_FORM);
      setTab("file");
    }
  }, [datasetToEdit, isOpen]);

  if (!isOpen) return null;

  // Traitement silencieux en arrière-plan (Taille, Format, Lignes)
  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // 1. Taille formatée
    const sizeInMB = selectedFile.size / (1024 * 1024);
    const calculatedSize =
      sizeInMB >= 1
        ? `${sizeInMB.toFixed(1)} MB`
        : `${Math.round(selectedFile.size / 1024)} KB`;

    // 2. Détection automatique du format
    const detectedFormat = detectFormat(selectedFile.name);

    // 3. Décompte/Estimation des lignes
    const ext = selectedFile.name.split(".").pop().toUpperCase();
    let calculatedRows = "N/A";

    if (["CSV", "TXT", "JSONL"].includes(ext) || selectedFile.type.includes("text")) {
      try {
        const slice = selectedFile.slice(0, 2 * 1024 * 1024); // 2 Mo
        const text = await slice.text();
        const lineBreakMatches = text.match(/\r\n|\n/g);
        let lines = lineBreakMatches ? lineBreakMatches.length : 1;

        if (selectedFile.size > 2 * 1024 * 1024) {
          const estimated = Math.round((lines / (2 * 1024 * 1024)) * selectedFile.size);
          calculatedRows = `~${(estimated / 1000).toFixed(0)}k lignes`;
        } else {
          calculatedRows = `${lines.toLocaleString()} lignes`;
        }
      } catch (err) {
        calculatedRows = "Standard";
      }
    } else if (ext === "JSON") {
      calculatedRows = "Structure JSON";
    } else if (["ZIP", "RAR", "7Z"].includes(ext)) {
      calculatedRows = "Archive d'éléments";
    } else if (["WAV", "MP3", "FLAC"].includes(ext)) {
      calculatedRows = "Fichiers Audio";
    }

    // Mise à jour discrète du state
    setFormData((prev) => ({
      ...prev,
      file: selectedFile,
      size_label: calculatedSize,
      format: detectedFormat,
      rows_label: calculatedRows
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      if (isEditing) {
        const payload = {
          title: formData.title,
          category: formData.category,
          format: formData.format,
          size_label: formData.size_label,
          rows_label: formData.rows_label,
          description: formData.description,
          source_name: formData.sourceName
        };

        await api.put(`/api/dataplace/${datasetToEdit.id}`, payload);
      } else {
        const data = new FormData();
        data.append("title", formData.title);
        data.append("category", formData.category);
        data.append("description", formData.description);
        data.append("source_name", formData.sourceName);

        if (tab === "file") {
          if (!formData.file) {
            setErrorMsg("Veuillez sélectionner un fichier (Max 200 Mo).");
            setLoading(false);
            return;
          }
          if (formData.file.size > 200 * 1024 * 1024) {
            setErrorMsg("Le fichier dépasse 200 Mo. Utilisez l'option 'Lien externe'.");
            setLoading(false);
            return;
          }
          data.append("file", formData.file);
          data.append("format", formData.format);
          data.append("size_label", formData.size_label);
          data.append("rows_label", formData.rows_label);
        } else {
          if (!formData.external_url) {
            setErrorMsg("Veuillez renseigner un lien de téléchargement valide.");
            setLoading(false);
            return;
          }
          // Détection automatique du format depuis l'URL externe si possible
          const detectedUrlFormat = detectFormat(formData.external_url);

          data.append("external_url", formData.external_url);
          data.append("format", detectedUrlFormat);
          data.append("size_label", "Lien Externe");
          data.append("rows_label", "Variable");
        }

        await api.post("/api/dataplace", data, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      }

      setFormData(INITIAL_FORM);
      onSubmitSuccess();
      onClose();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || "Erreur lors du traitement du dataset.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2 text-[#004751]">
            <Database size={20} />
            <h3 className="font-extrabold text-base text-slate-900">
              {isEditing ? "Modifier le Dataset" : "Proposer un Dataset"}
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {!isEditing && (
          <div className="flex bg-slate-100 p-1 rounded-xl mt-4">
            <button
              type="button"
              onClick={() => setTab("file")}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                tab === "file" ? "bg-white text-[#004751] shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Upload size={14} /> Fichier direct (&le; 200 Mo)
            </button>
            <button
              type="button"
              onClick={() => setTab("external")}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                tab === "external" ? "bg-white text-[#004751] shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <LinkIcon size={14} /> Lien externe (Drive / HuggingFace)
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Titre du Dataset *</label>
            <input
              type="text"
              required
              placeholder="ex: Sénégal Mobile Money Transactions"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#004751] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Catégorie</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#004751] focus:outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {!isEditing && (
            tab === "file" ? (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Fichier (Max 200 Mo) *</label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-teal-50 file:text-[#004751] hover:file:bg-teal-100"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">URL Externe (Drive, HuggingFace, GitHub) *</label>
                <input
                  type="url"
                  placeholder="https://huggingface.co/datasets/..."
                  value={formData.external_url}
                  onChange={(e) => setFormData({ ...formData, external_url: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#004751] focus:outline-none"
                />
              </div>
            )
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Courte Description</label>
            <textarea
              rows={3}
              placeholder="Décrivez l'utilité du dataset..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#004751] focus:outline-none"
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-1/2 py-2.5 bg-[#004751] text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all disabled:opacity-50"
            >
              {loading ? "Envoi en cours..." : isEditing ? "Enregistrer" : "Soumettre"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};