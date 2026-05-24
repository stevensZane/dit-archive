import React from 'react';
import { 
  Github, 
  Database, 
  ArrowRight, 
  Sparkles, 
  Terminal, 
  Shield,
  BrainCircuit,
  Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';

const HomeFeatures = () => {
  return (
    <section className="relative overflow-hidden py-20 px-6">
      
      {/* Background décoratif */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-[#004751]/5 blur-3xl rounded-full"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-500/5 blur-3xl rounded-full"></div>

      <div className="max-w-7xl mx-auto relative z-10">

        {/* Header */}
        <div className="mb-14 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#004751]/10 text-[#004751] text-xs font-bold tracking-widest uppercase">
            <Sparkles size={14} />
            Intelligence Augmentée du DIT
          </div>

          <h1 className="mt-5 text-4xl md:text-5xl font-black tracking-tight text-gray-900 leading-tight">
            Explorez les projets, les stacks <br />
            et la mémoire technique du DIT
          </h1>

          <p className="mt-5 text-gray-500 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
            Nora centralise les rapports, les dépôts GitHub et les technologies utilisées
            afin de transformer les archives du DIT en véritable moteur d’exploration intelligent.
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">

          {/* Bloc Nora */}
          <div className="lg:col-span-5 relative group">

            <div className="absolute inset-0 bg-gradient-to-br from-[#004751]/10 to-emerald-500/5 rounded-3xl blur-xl opacity-70 group-hover:opacity-100 transition-all"></div>

            <div className="relative h-full bg-white border border-gray-100 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300">

              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#004751]/10 text-[#004751] text-[11px] font-bold uppercase tracking-wider">
                <BrainCircuit size={14} />
                IA Gardienne
              </div>

              {/* Profile */}
              <div className="mt-8 flex flex-col items-center text-center">

                <div className="relative">
                  <div className="absolute inset-0 bg-[#004751]/20 blur-2xl rounded-full"></div>

                  <img
                    src="/nora_one.png"
                    alt="Nora"
                    className="relative z-10 w-40 h-40 rounded-full object-cover border-[6px] border-white shadow-xl"
                  />
                </div>

                <h2 className="mt-6 text-3xl font-black text-gray-900">
                  Salut, je suis{' '}
                  <span className="text-[#004751]">Nora</span>
                </h2>

                <p className="mt-4 text-sm text-gray-500 leading-relaxed max-w-md">
                  Je synthétise les rapports académiques, les architectures logicielles
                  et les stacks technologiques afin de vous aider à découvrir les meilleurs
                  projets du DIT plus rapidement.
                </p>

                {/* CTA */}
                <Link
                  to="/nora"
                  className="mt-7 inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#004751] text-white text-sm font-bold hover:bg-[#00363d] transition-all shadow-lg shadow-[#004751]/20"
                >
                  Discuter avec Nora
                  <ArrowRight size={16} />
                </Link>

              </div>

            </div>
          </div>

          {/* Bloc Data Place */}
          <div className="lg:col-span-7 flex flex-col gap-6">

            {/* Intro */}
            <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300">

              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-[#004751]/10 flex items-center justify-center">
                  <Database className="text-[#004751]" size={22} />
                </div>

                <div>
                  <h3 className="text-2xl font-black text-gray-900">
                    Archive Intelligente & Data Place
                  </h3>

                  <p className="text-xs text-gray-400 font-medium mt-1 uppercase tracking-wider">
                    Visualisation • Exploration • Analyse
                  </p>
                </div>
              </div>

              <p className="text-sm text-gray-500 leading-relaxed max-w-3xl">
                Analysez les technologies les plus utilisées dans les projets du DIT,
                comparez l’évolution des frameworks au fil des promotions et découvrez
                les meilleures architectures utilisées par les étudiants.
              </p>

            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">

              {[
                {
                  value: '200+',
                  label: 'Projets Indexés',
                  color: 'text-[#004751]'
                },
                {
                  value: '5K+',
                  label: 'Données Analysées',
                  color: 'text-[#004751]'
                },
                {
                  value: '100%',
                  label: 'Repos GitHub',
                  color: 'text-slate-800'
                },
                {
                  value: '99%',
                  label: 'Précision IA',
                  color: 'text-emerald-600'
                }
              ].map((stat, index) => (
                <div
                  key={index}
                  className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                >
                  <p className={`text-4xl font-black tracking-tight ${stat.color}`}>
                    {stat.value}
                  </p>

                  <p className="mt-2 text-[11px] uppercase tracking-wider text-gray-400 font-bold">
                    {stat.label}
                  </p>
                </div>
              ))}

            </div>

            {/* Features */}
            <div className="grid md:grid-cols-2 gap-5">

              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                    <Github size={18} className="text-slate-700" />
                  </div>

                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">
                      Culture GitHub First
                    </h4>

                    <p className="mt-2 text-xs text-gray-500 leading-relaxed">
                      Accès direct aux repositories, historiques de commits et
                      codes sources des étudiants pour une exploration technique complète.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                    <Shield size={18} className="text-emerald-600" />
                  </div>

                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">
                      Sécurité & Traçabilité
                    </h4>

                    <p className="mt-2 text-xs text-gray-500 leading-relaxed">
                      Indexation sémantique avancée avec contrôle des rôles académiques
                      et suivi intelligent des données analysées.
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom CTA */}
            <div className="bg-gradient-to-r from-[#004751] to-[#00606d] rounded-3xl p-8 text-white shadow-xl">

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">

                <div>
                  <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/70">
                    <Activity size={14} />
                    Data Intelligence Platform
                  </div>

                  <h3 className="mt-3 text-2xl font-black">
                    Ouvrez Archives
                  </h3>

                  <p className="mt-2 text-sm text-white/80 max-w-xl leading-relaxed">
                    Explorez les technologies dominantes, les tendances IA
                    et les projets les plus innovants du DIT.
                  </p>
                </div>

                <Link
                  to="/explore"
                  className="inline-flex items-center justify-center gap-2 px-6 py-4 bg-white text-[#004751] rounded-2xl font-black text-sm hover:scale-105 transition-all shadow-lg"
                >
                  Explorer maintenant
                  <ArrowRight size={16} />
                </Link>

              </div>

            </div>

          </div>

        </div>
      </div>
    </section>
  );
};

export default HomeFeatures;