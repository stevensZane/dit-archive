import React from "react";
import { Link } from "react-router-dom";
import { Database, ArrowLeft, Timer, Sparkles } from "lucide-react";
import Navbar from "../navigations/Navbar";

const DataPlace = () => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900">
      <Navbar />

      <main className="max-w-4xl mx-auto pt-32 pb-20 px-6 flex flex-col items-center justify-center text-center">
        {/* Icône animée dans son bloc premium */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-[#004751]/10 blur-3xl rounded-full animate-pulse"></div>
          <div className="relative bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
            <Database size={60} className="text-[#004751]" />
          </div>
          <Sparkles
            className="absolute -top-2 -right-2 text-emerald-500 animate-pulse"
            size={32}
          />
        </div>

        {/* Titre de la page */}
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-6">
          Le <span className="text-[#004751]">Data Place</span> arrive...
        </h1>

        {/* Nouveau texte qui fusionne tes deux idées */}
        <p className="text-lg text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed mb-10">
          Le hub de données ultime du DIT. Bientôt, vous pourrez télécharger des{" "}
          <span className="text-[#004751] font-bold">datasets populaires</span>{" "}
          pour vos modèles, accéder aux données réelles de trafic de la
          plateforme, et laisser Nora analyser l'évolution des langages et des
          stacks technologiques de toutes nos archives.
        </p>

        {/* Badge "Bientôt" épuré */}
        <div className="flex items-center gap-3 bg-slate-100 px-6 py-3 rounded-2xl border border-slate-200 text-slate-400 mb-12">
          <Timer size={20} />
          <span className="font-black uppercase text-xs tracking-[0.2em]">
            Préparation des pipelines et des jeux de données
          </span>
        </div>

        {/* Bouton retour discret */}
        <Link
          to="/home"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-[#004751] font-bold transition-all group"
        >
          <ArrowLeft
            size={20}
            className="group-hover:-translate-x-1 transition-transform"
          />
          Retourner à l'Acceuil
        </Link>
      </main>
    </div>
  );
};

export default DataPlace;
