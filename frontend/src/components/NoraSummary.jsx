import { Sparkles, Bot } from 'lucide-react';

const NoraSummary = ({ summary, isLoading }) => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 text-white shadow-xl">
      {/* Petit effet visuel en fond */}
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Bot size={120} />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-dit-pink p-2 rounded-lg">
            <Sparkles size={18} className="text-white" />
          </div>
          <span className="font-black uppercase tracking-widest text-xs text-slate-400">
            Analyse de Nora
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-2 animate-pulse">
            <div className="h-4 bg-slate-700 rounded w-full"></div>
            <div className="h-4 bg-slate-700 rounded w-5/6"></div>
          </div>
        ) : (
          <p className="text-slate-200 leading-relaxed italic">
            "{summary || "Nora n'a pas encore analysé ce projet. L'archiveur est en cours..."}"
          </p>
        )}
      </div>
    </div>
  );
};

export default NoraSummary;