import React, { useState, useEffect, useRef } from "react"; // Ajout de useRef
import { useNavigate, Link } from "react-router-dom";
import { LogOut, Menu, X } from "lucide-react";
import NoraAvatar from "../Nora/NoraAvatar";

const Navbar = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false); 
  
  // On stocke la position du scroll au moment de l'ouverture
  const scrollStartRef = useRef(0);

  // On capture le scroll de départ quand le menu s'ouvre
  useEffect(() => {
    if (isOpen) {
      scrollStartRef.current = window.scrollY;
    }
  }, [isOpen]);

  // Détection du scroll avec seuil de tolérance pour éviter les micro-mouvements tactiles
  useEffect(() => {
    const handleScroll = () => {
      if (!isOpen) return;

      const currentScroll = window.scrollY;
      const totalScrolled = Math.abs(currentScroll - scrollStartRef.current);

      // Seuil de 15 pixels : Évite que le menu se ferme tout seul au moindre toucher de doigt
      if (totalScrolled > 15) {
        setIsOpen(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isOpen]);

  const storedUser = localStorage.getItem("user");
  let user = null;

  try {
    user = storedUser ? JSON.parse(storedUser) : null;
  } catch {
    user = null;
  }

  const isGuest = user?.role === "guest";
  const isAdminOrSuperAdmin = user?.role === "admin" || user?.role === "superadmin";

  const navLinkClass =
    "relative py-1 text-gray-900 font-semibold hover:text-[#004751] transition-colors duration-200 after:absolute after:bottom-[-2px] after:left-0 after:w-full after:h-[2px] after:bg-[#004751] after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-200 after:origin-left";

  const mobileNavLinkClass =
    "block py-2 text-gray-900 font-semibold hover:text-[#004751] transition-colors duration-200";

  const renderProfileBlock = () => {
    const profileContent = (
      <div className="bg-gray-100 h-10 w-10 rounded-full flex items-center justify-center border border-gray-200 overflow-hidden shrink-0 shadow-sm">
        {user?.avatar_url ? (
          <img
            src={user.avatar_url}
            alt={`Avatar de ${user.username}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-dit-yellow font-bold text-sm px-3 whitespace-nowrap">
            {user?.username ?? "User"}
          </span>
        )}
      </div>
    );

    if (isGuest) {
      return (
        <div className="flex items-center space-x-4 md:border-l md:pl-6 border-gray-200 cursor-default">
          {profileContent}
        </div>
      );
    }

    return (
      <Link to={isAdminOrSuperAdmin ? "/admin-space" : "/dashboard"}>
        <div className="relative group flex items-center space-x-4 md:border-l md:pl-6 border-gray-200 cursor-pointer hover:opacity-85 transition-opacity">
          {profileContent}
          
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 whitespace-nowrap bg-slate-900 text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none shadow-md z-50">
            {isAdminOrSuperAdmin ? "Espace Admin" : "Mon Dashboard"}
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45" />
          </div>
        </div>
      </Link>
    );
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto flex justify-between items-center h-16">
        
        {/* Logo */}
        <Link to="/home">
          <div className="flex items-center cursor-pointer">
            <img
              src="/logo-archive.png"
              alt="DIT Archive Logo"
              className="h-20 md:h-30 w-auto object-contain"
            />
          </div>
        </Link>

        {/* Bouton Burger - Mobile */}
        <div className="flex items-center md:hidden">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-gray-900 hover:text-[#004751] focus:outline-none"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Liens et Actions - DESKTOP */}
        <div className="hidden md:flex items-center space-x-8">
          <Link to="/home" className={navLinkClass}>
            Accueil
          </Link>
          <Link to="/explore" className={navLinkClass}>
            Archives
          </Link>
          <Link to="/data-place" className={navLinkClass}>
            Le Data Place
          </Link>
          
          {!isGuest && (
            <Link to="/feedback" className={navLinkClass}>
              Feedback
            </Link>
          )}

          {/* Lien Nora + Tooltip */}
          <div className="relative group flex items-center justify-center">
            <Link
              to="/nora"
              className="relative py-1 flex items-center gap-1.5 text-gray-900 font-semibold hover:text-[#004751] transition-colors duration-200 after:absolute after:bottom-[-2px] after:left-0 after:w-full after:h-[2px] after:bg-[#004751] after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-200 after:origin-left"
            >
              <NoraAvatar size="sm" />
            </Link>

            <div className="absolute top-full mt-3 whitespace-nowrap bg-slate-900 text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none shadow-md z-50">
              Demander à Nora
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45" />
            </div>
          </div>

          {/* Profil Utilisateur */}
          {renderProfileBlock()}

          {/* Bouton Logout + Tooltip */}
          <div className="relative group flex items-center justify-center">
            <button
              onClick={() => {
                localStorage.clear();
                navigate("/login");
              }}
              className="text-sm font-medium text-slate-400 hover:text-red-500 transition-colors"
            >
              <LogOut />
            </button>

            <div className="absolute top-full mt-3 whitespace-nowrap bg-red-600 text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none shadow-md z-50">
              Déconnexion
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-600 rotate-45" />
            </div>
          </div>
        </div>
      </div>

      {/* Menu Deroulant - MOBILE */}
      {isOpen && (
        <div className="md:hidden pt-4 pb-2 space-y-3 border-t border-gray-100 animate-in fade-in slide-in-from-top-5 duration-200">
          <Link to="/home" className={mobileNavLinkClass} onClick={() => setIsOpen(false)}>
            Accueil
          </Link>
          <Link to="/explore" className={mobileNavLinkClass} onClick={() => setIsOpen(false)}>
            Archives
          </Link>
          <Link to="/leaderboard" className={mobileNavLinkClass} onClick={() => setIsOpen(false)}>
            Leaderboard
          </Link>
          <Link to="/data-place" className={mobileNavLinkClass} onClick={() => setIsOpen(false)}>
            Le Data Place
          </Link>
          
          {!isGuest && (
            <Link to="/feedback" className={mobileNavLinkClass} onClick={() => setIsOpen(false)}>
              Feedback
            </Link>
          )}
          
          <Link to="/nora" className="flex items-center gap-2 py-2 text-gray-900 font-semibold" onClick={() => setIsOpen(false)}>
            <NoraAvatar size="sm" /> Nora
          </Link>

          <hr className="border-gray-100 my-2" />

          <div className="flex items-center justify-between pt-2">
            {renderProfileBlock()}
            
            <button
              onClick={() => {
                localStorage.clear();
                navigate("/login");
                setIsOpen(false);
              }}
              className="text-slate-400 hover:text-red-500 p-2 transition-colors"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;