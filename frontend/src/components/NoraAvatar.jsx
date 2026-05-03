import React from 'react';

const NoraAvatar = ({ size = "md", showStatus = true }) => {
  // Gestion des tailles dynamiques
  const sizes = {
    sm: "w-8 h-8",
    md: "w-11 h-11",
    lg: "w-16 h-16",
    xl: "w-24 h-24"
  };

  return (
    <div className={`relative shrink-0 ${sizes[size]}`}>
      {/* Halo lumineux derrière l'image pour le côté IA Premium */}
      <div className="absolute inset-0 bg-dit-teal/20 blur-lg rounded-full animate-pulse"></div>
      
      {/* Conteneur de l'image */}
      <div className="relative w-full h-full rounded-2xl overflow-hidden border-2 border-white shadow-sm group-hover:border-dit-teal/30 transition-colors">
        <img 
          src="/nora-profile.png" // C'est ici qu'on mettra ton image générée
          alt="Nora AI"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      </div>

      {/* Indicateur de statut (petit point vert) */}
      {showStatus && (
        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full z-10 shadow-sm">
          <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75"></span>
        </span>
      )}
    </div>
  );
};

export default NoraAvatar;