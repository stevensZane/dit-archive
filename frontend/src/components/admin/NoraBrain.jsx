import React, { useState, useEffect, useRef } from 'react';
import { CloudUpload, Loader2, FileText, Trash2, Database, Info, RefreshCw } from 'lucide-react';
import api from '../api/axios';

const NoraBrain = () => {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const fileInputRef = useRef(null);

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
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSyncWeb = async () => {
    setSyncing(true);
    try {
      await api.post('/chatbot/sync-web');
      alert("La synchronisation du site web a été lancée en arrière-plan. Les pages apparaîtront d'ici quelques instants !");
      setTimeout(() => loadDocuments(), 5000); // Rechargement doux de la liste après lancement
    } catch (err) {
      alert("Erreur lors du lancement de la synchronisation.");
    } finally {
      setSyncing(false);
    }
  };

  const deleteDoc = async (docId) => {
      if (!window.confirm("Supprimer cet élément de la mémoire de Nora ?")) return;
      try {
          await api.delete(`/chatbot/documents/${docId}`);
          setDocs(docs.filter(d => d.id !== docId));
      } catch (err) { alert("Erreur lors de la suppression"); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#004751]" /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* HEADER INFO */}
      <div className="bg-gradient-to-r from-[#004751] to-[#002f36] p-10 rounded-[40px] text-white shadow-xl shadow-[#004751]/10 relative overflow-hidden">
        <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
                <Database size={24} />
                <h2 className="text-2xl font-black">Base de connaissances</h2>
            </div>
            <p className="text-slate-200 text-sm max-w-xl leading-relaxed">
                Ajoutez des documents PDF ou synchronisez le site web pour enrichir la mémoire de Nora. 
                Elle combinera ces sources pour répondre au mieux aux questions.
            </p>
        </div>
        <div className="absolute top-0 right-0 p-8 opacity-10">
            <Database size={120} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ZONE ACTIONS (UPLOAD + SYNC WEB) */}
        <div className="lg:col-span-1 space-y-4 sticky top-8">
            {/* Action 1 : PDF */}
            <div className="bg-white p-6 rounded-[40px] border border-slate-100 shadow-sm text-center">
                <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" accept=".pdf" />
                <div className="w-14 h-14 bg-[#004751]/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <CloudUpload className="text-[#004751]" size={24} />
                </div>
                <h3 className="font-bold text-slate-900 text-sm mb-1">Nouveau Document</h3>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-4">PDF unique</p>
                
                <button 
                    onClick={() => fileInputRef.current.click()}
                    disabled={uploading || syncing}
                    className="w-full bg-slate-900 text-white py-3 rounded-xl font-black text-xs uppercase hover:bg-[#004751] transition-all flex items-center justify-center gap-2"
                >
                    {uploading ? <Loader2 className="animate-spin" size={16} /> : "Téléverser le PDF"}
                </button>
            </div>

            {/* Action 2 : Synchronisation Site Web */}
            <div className="bg-white p-6 rounded-[40px] border border-slate-100 shadow-sm text-center">
                <div className="w-14 h-14 bg-[#004751]/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <RefreshCw className="text-[#004751]" size={24} />
                </div>
                <h3 className="font-bold text-slate-900 text-sm mb-1">Site Web Global</h3>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-4">Mise à jour dit.sn</p>
                
                <button 
                    onClick={handleSyncWeb}
                    disabled={uploading || syncing}
                    className="w-full border-2 border-[#004751] text-[#004751] py-3 rounded-xl font-black text-xs uppercase hover:bg-[#004751] hover:text-white transition-all flex items-center justify-center gap-2"
                >
                    {syncing ? <Loader2 className="animate-spin" size={16} /> : "Synchroniser le site"}
                </button>
            </div>
        </div>

        {/* LISTE DES DOCUMENTS */}
        {/* LISTE DES DOCUMENTS */}
        <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between px-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Éléments Ingrédients ({docs.length})</h3>
            </div>

            {docs.length === 0 ? (
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[40px] p-20 text-center">
                    <Info className="mx-auto text-slate-300 mb-4" size={32} />
                    <p className="text-slate-400 text-sm font-medium">La mémoire de Nora est vide.</p>
                </div>
            ) : (
                /* 🎯 Ajout des limites de hauteur et du scroll ici */
                <div className="grid grid-cols-1 gap-3 max-h-[460px] overflow-y-auto pr-2 scrollbar-thin">
                    {docs.map((doc, idx) => (
                        <div key={idx} className="flex items-center justify-between p-5 bg-white rounded-3xl border border-slate-100 hover:border-[#004751]/20 hover:shadow-md transition-all group">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-[#004751]/5 text-[#004751] rounded-2xl group-hover:bg-[#004751] group-hover:text-white transition-colors">
                                    <FileText size={20} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-slate-700 truncate max-w-[280px]">{doc.name}</span>
                                    <span className="text-[10px] text-slate-400 font-medium">{doc.created_at}</span>
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