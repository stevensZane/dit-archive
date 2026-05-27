import React, { useState, useRef, useEffect } from 'react';
import { Shield, Scroll, X } from 'lucide-react';

const TermsModal = ({ isOpen, onClose, onAccept }) => {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const scrollRef = useRef(null);

  // Détecter si l'utilisateur a lu (scrollé) jusqu'au bout du texte légal
  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      // Marge de tolérance de 5px
      if (scrollHeight - scrollTop <= clientHeight + 5) {
        setHasScrolledToBottom(true);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-xl flex flex-col max-h-[85vh] border border-slate-100 overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#004751]/10 rounded-xl flex items-center justify-center text-[#004751]">
              <Shield size={20} />
            </div>
            <div>
              <h3 className="font-black text-gray-900 text-lg">Politique de Confidentialité & CGU</h3>
              <p className="text-xs text-gray-400 font-medium">Traitement des données de l'IA Nora</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Long Text Body */}
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="p-6 overflow-y-auto text-sm text-slate-600 space-y-4 leading-relaxed custom-scrollbar"
        >
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#004751]">
            <Scroll size={14} /> Section 1 : Collecte & Finalité de l'IA
          </div>
          <p>
            En utilisant la plateforme DIT Archive et l'agent conversationnel <strong>Nora</strong>, vous acceptez expressément que vos requêtes (prompts), documents téléversés et historiques d'interaction soient enregistrés et analysés.
          </p>
          <p>
            Ces données ont pour unique but d'améliorer les performances du grand modèle de langage (Fine-Tuning), de corriger les erreurs de contextualisation technique et de nourrir de manière anonyme la base de connaissances du <strong>Data Place</strong> pour les promotions futures.
          </p>

          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#004751] pt-2">
            <Scroll size={14} /> Section 2 : Anonymisation & RBAC
          </div>
          <p>
            Toutes les conversations exploitées à des fins d'entraînement ou de statistiques sont rigoureusement dissociées de votre identité nominative. L'accès aux analyses approfondies est restreint selon votre niveau d'habilitation (étudiant ou administrateur académique) régi par le protocole RBAC du système.
          </p>

          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#004751] pt-2">
            <Scroll size={14} /> Section 3 : Droits de l'utilisateur
          </div>
          <p>
            Conformément aux réglementations sur la protection des données, vous conservez un droit de regard sur la traçabilité de vos documents techniques soumis. Vous pouvez demander leur retrait de l'indexation sémantique globale via l'espace d'administration ou en soumettant une demande officielle de feedback.
          </p>
          
          {!hasScrolledToBottom && (
            <div className="text-center text-xs font-bold text-amber-600 bg-amber-50 p-3 rounded-xl animate-pulse mt-4">
              ⬇️ Veuillez faire défiler le texte jusqu'au bas de la page pour activer l'acceptation.
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <label className={`flex items-center gap-3 cursor-pointer select-none transition-opacity ${!hasScrolledToBottom ? 'opacity-40 pointer-events-none' : ''}`}>
            <input 
              type="checkbox" 
              disabled={!hasScrolledToBottom}
              checked={isChecked}
              onChange={(e) => setIsChecked(e.target.checked)}
              className="w-5 h-5 rounded border-slate-300 text-[#004751] focus:ring-[#004751]/30 transition-all cursor-pointer"
            />
            <span className="text-xs font-semibold text-slate-700 leading-tight">
              Je confirme avoir lu et j'accepte que mes prompts soient conservés pour améliorer Nora.
            </span>
          </label>

          <button
            disabled={!isChecked}
            onClick={onAccept}
            className={`w-full sm:w-auto px-6 py-3 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shrink-0 ${
              isChecked 
                ? 'bg-[#004751] text-white hover:bg-[#00363d] shadow-[#004751]/10' 
                : 'bg-slate-200 text-slate-400 shadow-none cursor-not-allowed'
            }`}
          >
            Confirmer
          </button>
        </div>

      </div>
    </div>
  );
};

export default TermsModal;