import React from "react";
import { ThumbsUp, MessageSquare, Award } from "lucide-react";

const ProjectStatsCard = ({ score, likesCount = 0, commentsCount = 0, projectId, onLikeClicked }) => {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-xs font-black text-slate-400 uppercase mb-4">
        Indicateurs du projet
      </h3>
      
      <div className="grid grid-cols-3 gap-3">
        {/* Score Nora */}
        <div className="bg-[#004751]/5 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
          <Award className="text-[#004751] mb-1" size={20} />
          <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Score</span>
          <span className="text-lg font-black text-[#004751]">
            {score !== null && score !== undefined ? `${score}/100` : "--"}
          </span>
        </div>

        {/* Likes (Bouton cliquable raccordé) */}
        <button 
          onClick={onLikeClicked}
          className="bg-slate-50 rounded-2xl p-4 flex flex-col items-center justify-center text-center hover:bg-slate-100/70 transition-all border border-transparent active:scale-95"
        >
          <ThumbsUp className="text-[#E91E63] mb-1" size={18} />
          <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Likes</span>
          <span className="text-lg font-black text-slate-800">{likesCount}</span>
        </button>

        {/* Commentaires */}
        <div className="bg-slate-50 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
          <MessageSquare className="text-[#669099] mb-1" size={18} />
          <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Comments</span>
          <span className="text-lg font-black text-slate-800">{commentsCount}</span>
        </div>
      </div>
    </div>
  );
};

export default ProjectStatsCard;