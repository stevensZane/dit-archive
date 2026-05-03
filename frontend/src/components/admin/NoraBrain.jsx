import React, { useState, useEffect, useRef } from 'react';
import { CloudUpload, Loader2, FileText, Trash2, Database, Info } from 'lucide-react';
import api from '../api/axios';

const NoraBrain = () => {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Récupérer uniquement la liste des documents
  const loadDocuments = async () => {
    try {
        const res = await api.get('/chatbot/documents'); 
        setDocs(res.data || []);
    } catch (err) { 
        console.error("Erreur lors de la récupération de la base de connaissances"); 
    } finally { 
        setLoading(false); 
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || file.type !== "application/pdf") {
        return alert("Veuillez sélectionner un fichier PDF valide.");
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      await api.post('/chatbot/upload-doc', formData);
      alert("Document ingéré avec succès !");
      loadDocuments(); 
    } catch (err) { 
      alert("Erreur lors de l'ingestion du PDF (Vérifiez la taille ou le format)"); 
    } finally { 
      setUploading(false); 
      if (fileInputRef.current) fileInputRef.current.value = ""; // Reset input
    }
  };

  const deleteDoc = async (docId) => {
      if (!window.confirm("Supprimer ce document de la mémoire de Nora ?")) return;
      try {
          await api.delete(`/chatbot/documents/${docId}`);
          setDocs(docs.filter(d => d.id !== docId));
      } catch (err) { alert("Erreur lors de la suppression"); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-purple-600" /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* HEADER INFO */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-10 rounded-[40px] text-white shadow-xl shadow-purple-100 relative overflow-hidden">
        <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
                <Database size={24} />
                <h2 className="text-2xl font-black">Base de connaissances</h2>
            </div>
            <p className="text-purple-100 text-sm max-w-xl leading-relaxed">
                Ajoutez des documents PDF pour enrichir la mémoire de Nora. 
                Elle utilisera ces informations pour répondre aux questions des étudiants sur les règlements, les cours et la vie du DIT.
            </p>
        </div>
        <div className="absolute top-0 right-0 p-8 opacity-10">
            <Database size={120} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ZONE UPLOAD */}
        <div className="lg:col-span-1">
            <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm sticky top-8 text-center">
                <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" accept=".pdf" />
                <div className="w-20 h-20 bg-purple-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <CloudUpload className="text-purple-600" size={32} />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">Nouveau Savoir</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-8">PDF uniquement</p>
                
                <button 
                    onClick={() => fileInputRef.current.click()}
                    disabled={uploading}
                    className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase hover:bg-purple-600 transition-all flex items-center justify-center gap-3 shadow-lg"
                >
                    {uploading ? <Loader2 className="animate-spin" size={18} /> : "Téléverser le PDF"}
                </button>
            </div>
        </div>

        {/* LISTE DES DOCUMENTS */}
        <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between px-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Documents Ingrédients ({docs.length})</h3>
            </div>

            {docs.length === 0 ? (
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[40px] p-20 text-center">
                    <Info className="mx-auto text-slate-300 mb-4" size={32} />
                    <p className="text-slate-400 text-sm font-medium">La mémoire de Nora est vide.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3">
                    {docs.map(doc => (
                        <div key={doc.id} className="flex items-center justify-between p-5 bg-white rounded-3xl border border-slate-100 hover:border-purple-200 hover:shadow-md transition-all group">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                    <FileText size={20} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-slate-700 truncate max-w-[250px]">{doc.name}</span>
                                    <span className="text-[10px] text-slate-400 font-medium">Ajouté le {new Date(doc.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <button 
                                onClick={() => deleteDoc(doc.id)}
                                className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default NoraBrain;