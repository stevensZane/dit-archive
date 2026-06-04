import React, { useState } from 'react';
import { Info, ExternalLink } from 'lucide-react';
import PrivacyPolicyModal from './PrivacyPolicyModal'; // 🟢 Import de la modal

const ChatTermsBanner = () => {
  const [isPolicyOpen, setIsPolicyOpen] = useState(false); // 🟢 État de contrôle

  return (
    <>
      <div className="flex items-start gap-2.5 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[11px] leading-relaxed text-slate-500 max-w-3xl mx-auto my-3">
        <Info size={14} className="text-[#004751] shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-700">Rappel sur la confidentialité :</span> Les échanges avec Nora sont indexés et conservés de manière sécurisée afin d'enrichir continuellement les modèles d'apprentissage et le Data Place du DIT.{' '}
          {/* 🟢 Changement du lien <a href> par un bouton d'action pour la modal */}
          <button 
            onClick={() => setIsPolicyOpen(true)}
            className="inline-flex items-center gap-0.5 text-[#004751] font-bold hover:underline bg-transparent border-none p-0 cursor-pointer vertical-baseline align-middle"
          >
            En savoir plus <ExternalLink size={10} className="inline ml-0.5" />
          </button>
        </div>
      </div>

      {/* 🟢 Ajout de la Modal dans le DOM (Affiche uniquement si isPolicyOpen est vrai) */}
      <PrivacyPolicyModal 
        isOpen={isPolicyOpen} 
        onClose={() => setIsPolicyOpen(false)} 
      />
    </>
  );
};

export default ChatTermsBanner;