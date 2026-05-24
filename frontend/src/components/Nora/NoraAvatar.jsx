import React from 'react';

const NoraAvatar = ({ size = "md" }) => {
  // Gestion des tailles dynamiques
  const sizes = {
    sm: "w-8 h-8",
    md: "w-11 h-11",
    lg: "w-16 h-16",
    xl: "w-24 h-24"
  };

  return (
    <div className={`relative shrink-0 ${sizes[size]}`}>
      {/* Halo lumineux discret en arrière-plan */}
      <div className="absolute inset-0 bg-dit-teal/20 blur-lg rounded-full"></div>
      
      {/* Conteneur de l'image de Nora */}
      <div className="relative w-full h-full rounded-2xl overflow-hidden border-2 border-white dark:border-slate-800 shadow-sm transition-all duration-300">
        <img 
          src="/nora_one.png" // Mis à jour avec le nom de ta nouvelle image
          alt="Nora AI"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
};

export default NoraAvatar;