import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, Code2 } from "lucide-react";
import api from "./api/axios";

const ProjectCard = ({ project, from }) => {
  const [isLiked, setIsLiked] = useState(project.is_liked_by_me || false);
  const [likesCount, setLikesCount] = useState(project.likes_count || 0);
  const navigate = useNavigate();

  const authorDisplay = project.is_historical 
    ? project.author_name 
    : `${project.owner?.first_name} ${project.owner?.last_name}`;

  // Gestion du Like (Empêche la navigation vers les détails)
  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
        // On récupère la donnée brute de la réponse
        const { data } = await api.post(`/projects/${project.id}/like`);
        
        // On synchronise l'UI avec la réalité de la DB
        // Le serveur nous dit 'True' (liké) ou 'False' (unliké)
        setIsLiked(data.liked); 
        
        // On ajuste le compteur intelligemment
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
    <div className="group relative bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      {/* Zone cliquable principale (Lien vers détails) */}
      <Link 
        to={`/project/${project.id}`} 
        state={{ from }} 
        className="block p-6 no-underline text-inherit"
      >
        <div className="flex gap-2 mb-4">
          <span className="bg-pink-50 text-dit-pink text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
            {project.level}
          </span>
          <span className="bg-blue-50 text-dit-blue text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
            {project.program?.name}
          </span>
        </div>
        
        <h3 className="text-xl font-bold text-gray-900 group-hover:text-dit-pink transition-colors">
          {project.title}
        </h3>
        
        <p className="text-gray-600 text-sm mt-3 line-clamp-2 leading-relaxed">
          {project.description}
        </p>

        <div className="flex gap-1.5 mt-4 flex-wrap">
          {project.technologies?.slice(0, 3).map(tech => (
            <span key={tech.id} className="text-[10px] bg-gray-50 text-gray-400 px-2 py-0.5 rounded italic">
              #{tech.name}
            </span>
          ))}
        </div>
      </Link>

      {/* Footer Séparé (Non cliquable par le lien parent) */}
      <div className="px-6 pb-6 pt-4 border-t border-gray-50 flex justify-between items-center relative z-10">
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-400 uppercase tracking-tight font-bold">Auteur</span>
          <span className="text-sm font-medium text-gray-700">{authorDisplay}</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="block text-[10px] text-gray-400 uppercase tracking-tight font-bold">Promotion</span>
            <span className="text-sm font-bold text-gray-900">{project.academic_year?.label}</span>
          </div>

          {/* Bouton Like Interactif */}
          <button 
            onClick={handleLike}
            className={`flex flex-col items-center transition-transform active:scale-90 ${isLiked ? 'text-pink-500' : 'text-gray-300 hover:text-pink-400'}`}
          >
            <Heart size={20} fill={isLiked ? "currentColor" : "none"} strokeWidth={2.5} />
            <span className="text-[10px] font-extrabold mt-0.5">{likesCount}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;