import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import api from "../api/axios";

const ExploreProjectCard = ({ project, from }) => {
  const [isLiked, setIsLiked] = useState(project.is_liked_by_me || false);
  const [likesCount, setLikesCount] = useState(project.likes_count || 0);
  const navigate = useNavigate();

  const authorDisplay = project.is_historical 
    ? project.author_name 
    : `${project.owner?.first_name} ${project.owner?.last_name}`;

  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
        const { data } = await api.post(`/projects/${project.id}/like`);
        setIsLiked(data.liked); 
        setLikesCount(prev => data.liked ? prev + 1 : prev - 1);
    } catch (err) {
        if (err.response && err.response.status === 401) {
            alert("Nora dit : 'Tu dois être connecté pour liker ce projet !'");
            navigate("/login");
        } else {
            console.error("Erreur Nora-Like:", err);
        }
    }
  };

  return (
    /* 🟢 CORRECTION 1 : 'flex flex-col justify-between h-[380px]' -> On agrandit un peu la carte (hauteur fixe) et on pousse le contenu aux extrémités */
    <div className="group relative bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left flex flex-col justify-between h-[300px] w-full">
      
      {/* Zone du haut (Contenu cliquable) */}
      <Link to={`/project/${project.id}`} state={{ from }} className="block p-6 no-underline text-inherit flex-1">
        <div className="flex gap-2 mb-4">
          <span className="bg-pink-50 text-dit-pink text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
            {project.level || "L1"}
          </span>
          <span className="bg-blue-50 text-dit-blue text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
            {project.program?.name || "Filière"}
          </span>
        </div>
        
        <h3 className="text-xl font-bold text-gray-900 group-hover:text-dit-pink transition-colors line-clamp-1">
          {project.title}
        </h3>
        
        {/* 🟢 CORRECTION 2 : 'h-[48px] line-clamp-2' -> S'il y a trop de texte, c'est coupé à 2 lignes max. S'il n'y en a pas assez, l'espace reste réservé ! */}
        <p className="text-gray-600 text-sm mt-3 line-clamp-2 leading-relaxed h-[48px]">
          {project.description || "Aucune description fournie pour ce projet."}
        </p>

        <div className="flex gap-1.5 mt-4 flex-wrap">
          <div className="flex gap-1.5 mt-4 flex-wrap">
          {(() => {
            // 1. Si c'est le format string de ta BDD "React, Node, etc."
            if (typeof project.technologies_list === 'string' && project.technologies_list.trim() !== '') {
              return project.technologies_list
                .split(',') // On découpe le texte à chaque virgule
                .slice(0, 3) // On prend les 3 premières
                .map((techName, index) => (
                  <span key={`list-${index}`} className="text-[10px] bg-gray-50 text-gray-400 px-2 py-0.5 rounded italic">
                    #{techName.trim()}
                  </span>
                ));
            }

            // 2. Si c'est un tableau de strings ['React', 'Node']
            if (Array.isArray(project.technologies_list)) {
              return project.technologies_list.slice(0, 3).map((techName, index) => (
                <span key={`arr-${index}`} className="text-[10px] bg-gray-50 text-gray-400 px-2 py-0.5 rounded italic">
                  #{techName.trim()}
                </span>
              ));
            }

            // 3. Fallback historique : Si c'est l'ancien format d'objets du seed [{id: 1, name: 'React'}]
            if (Array.isArray(project.technologies)) {
              return project.technologies.slice(0, 3).map(tech => (
                <span key={tech.id} className="text-[10px] bg-gray-50 text-gray-400 px-2 py-0.5 rounded italic">
                  #{tech.name}
                </span>
              ));
            }

            return null;
          })()}
        </div>
        </div>
      </Link>

      {/* 🟢 CORRECTION 3 : Footer Séparé -> Toujours scotché tout en bas et parfaitement aligné sur la grille */}
      <div className="px-6 pb-6 pt-4 border-t border-gray-50 flex justify-between items-center bg-white rounded-b-2xl">
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-400 uppercase tracking-tight font-bold">Auteur</span>
          <span className="text-sm font-medium text-gray-700 truncate max-w-[120px]">{authorDisplay}</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="block text-[10px] text-gray-400 uppercase tracking-tight font-bold">Promotion</span>
            <span className="text-sm font-bold text-gray-900">{project.academic_year?.label || "2025-2026"}</span>
          </div>

          <button onClick={handleLike} className={`flex flex-col items-center transition-transform active:scale-90 ${isLiked ? 'text-pink-500' : 'text-gray-300 hover:text-pink-400'}`}>
            <Heart size={20} fill={isLiked ? "currentColor" : "none"} strokeWidth={2.5} />
            <span className="text-[10px] font-extrabold mt-0.5">{likesCount}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExploreProjectCard;