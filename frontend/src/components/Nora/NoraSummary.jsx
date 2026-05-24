import { MessageCircle, Repeat2, Heart, Share, MoreHorizontal } from 'lucide-react';
import ReactMarkdown from "react-markdown";
import NoraAvatar from "./NoraAvatar";

const NoraSummary = ({ summary, isLoading }) => {
  return (
    <div className="bg-[#004751] border border-slate-800 rounded-3xl p-6 shadow-2xl font-sans">
      
      {/* HEADER : Avatar + Nom + Handle */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-700 bg-slate-800 flex-shrink-0">
            <img 
              src="/nora_one.png"
              alt="Nora" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="font-bold text-white hover:underline cursor-pointer">Nora</span>
              {/* <span className="text-slate-500 text-sm"></span> */}
            </div>
            <span className="text-slate-500 text-sm">@nora_ia_dit</span>
          </div>
        </div>
        <MoreHorizontal className="text-slate-600 cursor-pointer" size={20} />
      </div>

      {/* CONTENU : Le texte pur */}
      <div className="mb-4">
        {isLoading ? (
          <div className="space-y-3 animate-pulse py-2">
            <div className="h-4 bg-slate-800 rounded w-full"></div>
            <div className="h-4 bg-slate-800 rounded w-4/5"></div>
          </div>
        ) : (
          <div className="text-[19px] leading-relaxed text-slate-100 prose prose-invert prose-slate max-w-none 
                prose-p:mb-4 prose-headings:text-white prose-headings:text-xl prose-headings:font-bold 
                prose-strong:text-white prose-li:marker:text-slate-500">
            <ReactMarkdown>
              {summary || "Nora n'a pas encore analysé ce projet."}
            </ReactMarkdown>
          </div>
        )}
      </div>

    </div>
  );
};

export default NoraSummary;