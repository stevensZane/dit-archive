import React, { useState } from 'react';
import { RefreshCw, ShieldAlert } from 'lucide-react';

const ServiceDown = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRetry = () => {
  setIsRefreshing(true);
  
  // Au lieu de recharger la page de secours, on tente un retour à la racine du site
  setTimeout(() => {
    window.location.href = "/"; 
  }, 800);
};

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col justify-center items-center p-6 text-center selection:bg-[#004751]/30">
      
      {/* max-w-md -> max-w-lg (Carte globale plus large et p-10 -> p-12) */}
      <div className="max-w-lg w-full bg-white rounded-[2.5rem] shadow-2xl p-10 md:p-12 space-y-8 border border-slate-100 flex flex-col items-center relative overflow-hidden">
        
        {/* --- ZONE MASCOTTE NORA --- */}
        <div className="w-full flex flex-col items-center pt-2">
          {/* Bulle de texte : texte augmenté à text-xs / text-[13px] */}
          <div className="relative bg-[#004751] text-white text-[13px] md:text-sm font-medium px-5 py-3 rounded-2xl max-w-[320px] mb-4 shadow-sm animate-bounce">
            <span className="block text-[10px] font-black uppercase text-slate-300 mb-0.5 tracking-wider text-left">
              Nora l'archiviste
            </span>
            Un petit problème technique est survenu, mais notre équipe s'en occupe !
            {/* Flèche de la bulle */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-2.5 h-2.5 bg-[#004751]" />
          </div>

          {/* Hublot de l'image agrandi : w-28 h-28 -> w-36 h-36 */}
          <div className="w-36 h-36 rounded-full bg-slate-50 border-4 border-slate-100 shadow-inner flex items-center justify-center overflow-hidden group">
            <img 
              src="/nora_one.png" 
              alt="Nora Archiviste" 
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            {/* Taille de l'émoji de secours augmentée */}
            <div className="hidden w-full h-full bg-slate-50 items-center justify-center text-3xl text-slate-300">
              🖼️
            </div>
          </div>
        </div>

        {/* --- EN-TÊTE PRINCIPAL --- */}
        <div className="space-y-3">
          {/* text-xl -> text-2xl et tracking plus marqué */}
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-wider">
            Maintenance de <span className="text-[#004751]">dit archive</span>
          </h1>
          {/* text-xs -> text-sm */}
          <p className="text-sm text-slate-500 leading-relaxed max-w-md mx-auto">
            Le serveur central ou l'IA d'indexation est momentanément injoignable suite à une opération technique.
          </p>
        </div>

        {/* --- BLOC RASSURANT --- */}
        {/* text-[11px] -> text-xs / text-[13px] */}
        <div className="w-full bg-slate-50 rounded-2xl p-5 border border-slate-100 flex items-start gap-4 text-left">
          <div className="p-2 bg-amber-50 rounded-xl text-amber-500 shrink-0 mt-0.5">
            <ShieldAlert size={18} />
          </div>
          <p className="text-[13px] font-medium text-slate-600 leading-relaxed">
            <span className="font-bold text-slate-800">Données protégées :</span> Vos projets, codes sources et livrables d'étudiants restent en totale sécurité pendant cette coupure.
          </p>
        </div>

        {/* --- BOUTON D'ACTION DIT STYLE --- */}
        {/* py-4 -> py-4.5 et texte text-[10px] -> text-xs */}
        <div className="w-full pt-2">
          <button
            onClick={handleRetry}
            disabled={isRefreshing}
            className="w-full flex items-center justify-center gap-2.5 bg-[#004751] hover:bg-slate-900 text-white font-black py-4.5 rounded-xl text-xs uppercase tracking-widest transition-all shadow-xl shadow-[#004751]/10 active:scale-95 disabled:opacity-60 cursor-pointer"
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
            {isRefreshing ? "Reconnexion..." : "Réessayer la connexion"}
          </button>
        </div>

      </div>
      
      {/* --- CREDIT DE PROD --- */}
      {/* text-[9px] -> text-[10px] */}
      <p className="mt-10 text-[10px] font-bold text-slate-600 uppercase tracking-widest opacity-40">
        DIT Archive Technical Team
      </p>
    </div>
  );
};

export default ServiceDown;