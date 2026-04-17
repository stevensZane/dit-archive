import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, ArrowLeft, Timer, Sparkles } from 'lucide-react';
import Navbar from './Navbar';

const Leaderboard = () => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900">
      <Navbar />

      <main className="max-w-4xl mx-auto pt-32 pb-20 px-6 flex flex-col items-center justify-center text-center">
        {/* Icône animée */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-dit-teal/20 blur-3xl rounded-full animate-pulse"></div>
          <div className="relative bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
            <Trophy size={60} className="text-dit-pink animate-bounce" />
          </div>
          <Sparkles className="absolute -top-2 -right-2 text-amber-400 animate-pulse" size={32} />
        </div>

        {/* Texte de teasing */}
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-6">
          Le <span className="text-dit-teal">Leaderboard</span> arrive...
        </h1>
        
        <p className="text-lg text-slate-500 max-w-lg mx-auto font-medium leading-relaxed mb-10">
          Nora est en train de compiler les scores et d'analyser la qualité de chaque projet. Bientôt, les meilleurs architectes du DIT seront mis en lumière ici.
        </p>

        {/* Badge "Bientôt" */}
        <div className="flex items-center gap-3 bg-slate-100 px-6 py-3 rounded-2xl border border-slate-200 text-slate-400 mb-12">
          <Timer size={20} />
          <span className="font-black uppercase text-xs tracking-[0.2em]">Disponible prochainement</span>
        </div>

        {/* Bouton retour */}
        <Link 
          to="/explore" 
          className="inline-flex items-center gap-2 text-slate-500 hover:text-dit-pink font-bold transition-all group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          Retourner explorer les projets
        </Link>
      </main>
    </div>
  );
};

export default Leaderboard;