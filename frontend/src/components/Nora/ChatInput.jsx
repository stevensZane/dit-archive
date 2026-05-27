import React, { useState, useEffect, useRef } from 'react';
import { Send, Plus, X, AlertCircle } from 'lucide-react';

const ChatInput = ({ 
  input, 
  setInput, 
  handleSend, 
  isLoading 
}) => {
  const [showModal, setShowModal] = useState(false);
  const textareaRef = useRef(null);

  // Ajuste automatiquement la hauteur du champ selon le texte
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Réinitialise la hauteur pour recalculer correctement
    textarea.style.height = 'auto';
    
    // Calcule la nouvelle hauteur (max 160px ici, soit environ 5-6 lignes)
    const nextHeight = Math.min(textarea.scrollHeight, 160);
    textarea.style.height = `${nextHeight}px`;
  }, [input]);

  // Gestion du clavier : Entrée = Envoyer, Shift + Entrée = Saut de ligne
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Évite le saut de ligne par défaut
      if (input.trim() && !isLoading) {
        handleSend(e);
      }
    }
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent">
      <div className="max-w-3xl mx-auto relative">
        
        {/* Formulaire Principal */}
        <form onSubmit={handleSend} className="relative flex items-end bg-slate-50 border border-slate-200 rounded-[1.5rem] p-1.5 focus-within:bg-white focus-within:ring-4 focus-within:ring-[#004751]/5 focus-within:border-[#004751]/20 transition-all duration-300">
          
          {/* Bouton Plus (Déclenche le Modal de Teasing) */}
          <button 
            type="button"
            onClick={() => setShowModal(true)}
            className="p-3 text-slate-400 hover:text-[#004751] hover:bg-slate-100 rounded-full transition-colors mb-0.5"
          >
            <Plus size={22} />
          </button>
          
          {/* Zone de texte dynamique (Textarea à la place de Input) */}
          <textarea 
            ref={textareaRef}
            rows={1}
            placeholder="Posez une question à Nora..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-none text-[15px] text-slate-700 font-medium px-2 py-3 resize-none outline-none focus:outline-none focus:ring-0 min-h-[46px] max-h-[160px] custom-scrollbar"
            style={{ height: 'auto' }}
          />

          {/* Bouton d'envoi */}
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className={`p-3 rounded-2xl transition-all shadow-lg mb-0.5 ${
              input.trim() ? 'bg-[#004751] text-white shadow-[#004751]/20' : 'bg-slate-200 text-slate-400 shadow-none cursor-not-allowed'
            }`}
          >
            <Send size={20} />
          </button>
        </form>
        
        {/* Warning RGPD / IA */}
        <div className="mt-3 text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest opacity-60">
            Nora AI peut faire des erreurs. Vérifiez les informations importantes.
          </span>
        </div>

        {/* MODAL PERSPECTIVE D'AVENIR (UPLOAD) */}
        {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          {/* Remplacement du max-w-sm par max-w-md pour donner plus d'espace */}
          <div className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col">
            
            {/* Zone Image / Avatar de Nora */}
            <div className="relative w-full h-48 bg-gradient-to-br from-[#004751] via-[#00363d] to-slate-900 flex flex-col items-center justify-center overflow-hidden">
              {/* Cercles décoratifs en arrière-plan */}
              <div className="absolute w-72 h-72 rounded-full bg-white/5 -top-20 -left-10 blur-xl pointer-events-none" />
              <div className="absolute w-60 h-60 rounded-full bg-[#004751]/40 -bottom-25 -right-10 blur-xl pointer-events-none" />
              
              {/* Image temporaire de Nora (À remplacer par ton asset exact au besoin) */}
              <div className="relative z-10 w-24 h-24 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-300">
                <img 
                  src="/logo-archive.png" // Tu pourras mettre ici ton image / avatar spécifique de Nora
                  alt="Nora Robot" 
                  className="w-16 h-16 object-contain opacity-90 drop-shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
                  onError={(e) => {
                    // Fallback si l'image n'est pas trouvée pour éviter un carré blanc cassé
                    e.target.style.display = 'none';
                    e.target.parentNode.innerHTML = '🤖';
                  }}
                />
              </div>
              
              {/* Petit badge optionnel */}
              <span className="absolute bottom-4 right-4 bg-amber-500 text-white font-black text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-full shadow-sm">
                V2 Preview
              </span>
            </div>

            {/* Zone de Contenu textuel */}
            <div className="p-8 space-y-4 text-center">
              <div className="space-y-2">
                <h3 className="font-black text-slate-900 tracking-tight text-xl md:text-2xl">
                  Analyse de fichiers <br />
                  <span className="text-[#004751]">bientôt disponible !</span>
                </h3>
                <div className="w-12 h-1 bg-amber-500 rounded-full mx-auto my-1" />
              </div>
              
              <p className="text-sm text-slate-500 leading-relaxed font-medium max-w-sm mx-auto">
                Je ne peux pas encore lire vos documents, mais pas de panique ! L'équipe technique du DIT me prépare une mise à jour majeure pour que je puisse analyser tous vos fichiers très prochainement. 😉
              </p>

              {/* Bouton d'action principal bien large */}
              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-full sm:w-auto px-8 py-3.5 text-sm font-bold text-white bg-[#004751] hover:bg-[#00363d] rounded-2xl shadow-lg shadow-[#004751]/10 hover:shadow-xl transition-all duration-200"
                >
                  D'accord, compris !
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      </div>
    </div>
  );
};

export default ChatInput;