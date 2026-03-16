// import { Link } from "react-router-dom";
// import { Heart, Code2, BookOpen } from "lucide-react"; // Si tu utilises lucide-react

// const ProjectCard = ({ project, from }) => {
//   // Déterminer l'auteur (soit l'User, soit le nom historique)
//   const authorDisplay = project.is_historical 
//     ? project.author_name 
//     : `${project.owner?.first_name} ${project.owner?.last_name}`;

//   return (
//     <Link 
//       to={`/project/${project.id}`} 
//       state={{ from }} 
//       className="group block relative overflow-hidden bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500"
//     >
//       {/* Badge Historique / Status */}
//       {project.is_historical && (
//         <div className="absolute -right-12 top-6 rotate-45 bg-amber-100 text-amber-700 text-[10px] font-bold py-1 w-40 text-center shadow-sm border border-amber-200">
//           ARCHIVE
//         </div>
//       )}

//       {/* Header : Niveau & Filière */}
//       <div className="flex flex-wrap gap-2 mb-4">
//         <span className="bg-pink-50 text-dit-pink text-[10px] font-extrabold px-3 py-1 rounded-lg uppercase tracking-wider">
//           {project.level}
//         </span>
//         <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-3 py-1 rounded-lg uppercase tracking-wider">
//           {project.program?.name}
//         </span>
//       </div>
      
//       {/* Titre & Langage Principal */}
//       <div className="mb-2">
//         <h3 className="text-lg font-bold text-gray-900 group-hover:text-dit-pink transition-colors line-clamp-1">
//           {project.title}
//         </h3>
//         {project.primary_language && (
//           <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1">
//             <Code2 size={12} /> {project.primary_language}
//           </span>
//         )}
//       </div>
      
//       <p className="text-gray-500 text-sm line-clamp-2 min-h-[40px]">
//         {project.description}
//       </p>

//       {/* Technos (chips miniatures) */}
//       <div className="flex gap-1.5 mt-4 flex-wrap">
//         {project.technologies?.slice(0, 3).map(tech => (
//           <span key={tech.id} className="text-[9px] bg-gray-50 text-gray-500 px-2 py-0.5 rounded border border-gray-100">
//             #{tech.name}
//           </span>
//         ))}
//       </div>
      
//       {/* Footer : Auteur, Promo & Likes */}
//       <div className="mt-5 pt-4 border-t border-gray-50 flex justify-between items-end">
//         <div className="flex items-center gap-3">
//             <div className="h-8 w-8 rounded-full bg-dit-pink/10 flex items-center justify-center text-dit-pink font-bold text-xs">
//                 {authorDisplay?.charAt(0)}
//             </div>
//             <div className="flex flex-col">
//               <span className="text-[9px] text-gray-400 uppercase font-bold">Auteur</span>
//               <span className="text-xs font-semibold text-gray-700 truncate max-w-[100px]">{authorDisplay}</span>
//             </div>
//         </div>

//         <div className="flex flex-col items-end">
//             <div className="flex items-center gap-1 text-pink-500 mb-1">
//                 <Heart size={14} fill={project.likes_count > 0 ? "currentColor" : "none"} />
//                 <span className="text-xs font-bold">{project.likes_count || 0}</span>
//             </div>
//             <span className="text-[10px] font-bold text-gray-900">{project.academic_year?.label}</span>
//         </div>
//       </div>
//     </Link>
//   );
// };

// export default ProjectCard;

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