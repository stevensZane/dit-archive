import React from 'react';
import { Github, Linkedin, Mail, MapPin, Search, Shield, FileText } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-[#004751] text-white border-t border-white/10">
      {/* Section Principale (Ajustée plus compacte) */}
      <div className="max-w-7xl mx-auto px-6 py-10 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Colonne 1 : Branding (Logo ajustable + Texte en bas) */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex flex-col items-start">
              <img 
                src="/logo-archive.png" 
                alt="DIT Logo" 
                className="h-19 w-auto object-contain" 
              />
              <span className="text-sm font-semibold tracking-wide text-white/90">
                DIT Archive
              </span>
            </div>
            <p className="text-xs text-slate-300/80 leading-relaxed max-w-xs">
              La plateforme d'archivage intelligente du Dakar Institute of Technology. Explorez les projets Big Data & IA qui façonnent l'Afrique de demain.
            </p>
            {/* Réseaux sociaux */}
            <div className="flex gap-2.5 pt-1">
              <a href="#" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all">
                <Linkedin size={15} />
              </a>
              <a href="#" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all">
                <Github size={15} />
              </a>
            </div>
          </div>

          {/* Colonne 2 : Navigation (Correction des balises li de l'historique) */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-white/60 tracking-wider uppercase">Navigation</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>
                <a href="/" className="hover:text-white transition-colors">Accueil</a>
              </li>
              <li>
                <a href="/leaderboard" className="hover:text-white transition-colors">Leaderboard</a>
              </li>
              <li>
                <a href="/explore" className="hover:text-white transition-colors">Data Place</a>
              </li>
              <li>
                <a href="/nora" className="hover:text-white transition-colors">Nora</a>
              </li>
              <li>
                <a href="/explore" className="text-white hover:underline flex items-center gap-1.5 pt-1 text-xs">
                  <Search size={13} /> Explorer les projets
                </a>
              </li>
            </ul>
          </div>

          {/* Colonne 3 : Filières Phares */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-white/60 tracking-wider uppercase">Filières</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="hover:text-white cursor-pointer transition-colors">• Big Data & Intelligence Artificielle</li>
              <li className="hover:text-white cursor-pointer transition-colors">• Marketing Digital</li>
            </ul>
          </div>

          {/* Colonne 4 : Contact & Localisation */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-white/60 tracking-wider uppercase">Contact</h4>
            <ul className="space-y-2.5 text-sm text-slate-300">
              <li className="flex items-start gap-2">
                <MapPin size={15} className="shrink-0 text-slate-400 mt-0.5" />
                <span className="text-xs">Dakar, Sénégal<br /><span className="text-slate-400">Cité Keur Gorgui</span></span>
              </li>
              <li className="flex items-center gap-2 text-xs">
                <Mail size={15} className="text-slate-400" />
                <a href="mailto:contact@dit.sn" className="hover:text-white transition-colors">contact@dit.sn</a>
              </li>
            </ul>
          </div>

        </div>

        {/* Ligne de séparation de fin */}
        <div className="mt-10 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          
          {/* Copyright dynamique */}
          <div>
            © {new Date().getFullYear()} DIT Archive. Tous droits réservés.
          </div>

          {/* Liens légaux / Sécurité */}
          <div className="flex gap-4">
            <a href="#" className="hover:text-white flex items-center gap-1 transition-colors">
              <Shield size={12} /> Confidentialité & RBAC
            </a>
            <a href="#" className="hover:text-white flex items-center gap-1 transition-colors">
              <FileText size={12} /> Conditions d'utilisation
            </a>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;