import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  LogOut, Bot, ChevronDown, MoreVertical, 
  Home, Trophy, Search, LayoutDashboard, Settings 
} from 'lucide-react';
import NoraAvatar from './NoraAvatar';

const ChatHeader = ({ isSidebarOpen, setIsSidebarOpen, activeChatTitle }) => {
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const storedUser = localStorage.getItem("user");
  let user = null;
  try {
    user = storedUser ? JSON.parse(storedUser) : null;
  } catch {
    user = null;
  }

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-8 sticky top-0 z-40 transition-all">
      
      {/* GAUCHE : Logo & Toggle */}
      <div className="flex items-center gap-6">
        {!isSidebarOpen && (
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2.5 hover:bg-slate-50 rounded-xl text-dit-teal transition-all animate-in fade-in zoom-in border border-transparent hover:border-slate-100"
          >
            <NoraAvatar size="md" />
          </button>
        )}
        
        <Link to="/home" className="flex items-center transform hover:scale-105 transition-transform">
          <img src="/logo-archive.png" alt="Logo" className="h-22 w-auto object-contain" />
        </Link>

        <div className="h-8 w-[1px] bg-slate-100 mx-2 hidden md:block" />
        
        <div className="flex flex-col hidden lg:flex">
          <h2 className="text-sm font-bold text-slate-800 truncate max-w-[250px]">
            {activeChatTitle || "Nora Assistant"}
          </h2>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">
            DIT Intelligence Core
          </span>
        </div>
      </div>

      {/* DROITE : Navigation & Profil */}
      <div className="flex items-center space-x-6">
        
        {/* Liens rapides avec plus d'espace */}
        <nav className="hidden md:flex items-center border-r border-slate-100 pr-6 space-x-2">
          <Link title="Accueil" to="/home" className="p-3 text-slate-400 hover:text-dit-teal hover:bg-slate-50 rounded-xl transition-all">
            <Home size={22} />
          </Link>
          <Link title="Leaderboard" to="/leaderboard" className="p-3 text-slate-400 hover:text-dit-teal hover:bg-slate-50 rounded-xl transition-all">
            <Trophy size={22} />
          </Link>
          <Link title="Explorer" to="/explore" className="p-3 text-slate-400 hover:text-dit-teal hover:bg-slate-50 rounded-xl transition-all">
            <Search size={22} />
          </Link>
        </nav>

        {/* Profil Utilisateur - Plus imposant */}
        <div className="relative">
          <button 
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-4 pl-3 py-1.5 pr-2 rounded-2xl hover:bg-slate-50 transition-all border border-slate-50 hover:border-slate-200 shadow-sm hover:shadow-md"
          >
            <div className="flex flex-col items-end hidden sm:flex">
              <span className="text-xs font-black text-slate-800 leading-none uppercase tracking-tight">
                {user?.name ?? "User"}
              </span>
              <span className="text-[10px] font-bold text-dit-teal uppercase mt-1">
                {user?.role ?? "Guest"}
              </span>
            </div>
            
            <div className="w-11 h-11 bg-gradient-to-tr from-dit-teal/10 to-slate-200 rounded-full flex items-center justify-center border-2 border-white shadow-inner">
              <span className="text-sm font-black text-dit-teal">
                {user?.name?.charAt(0) ?? "U"}
              </span>
            </div>
            
            <ChevronDown size={16} className={`text-slate-400 transition-transform duration-300 ${showUserMenu ? 'rotate-180' : ''}`} />
          </button>

          {/* Menu Déroulant */}
          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)}></div>
              <div className="absolute right-0 mt-3 w-64 bg-white border border-slate-100 rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] py-3 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-5 py-2 border-b border-slate-50 mb-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Espace Personnel</p>
                </div>
                
                <Link to={user?.role === "admin" ? "/admin-space" : "/dashboard"} className="flex items-center gap-4 px-5 py-3 text-[14px] text-slate-600 hover:bg-slate-50 transition-colors font-medium">
                  <LayoutDashboard size={18} className="text-dit-teal" /> Dashboard
                </Link>
                
                <button className="w-full flex items-center gap-4 px-5 py-3 text-[14px] text-slate-600 hover:bg-slate-50 transition-colors font-medium">
                  <Settings size={18} className="text-slate-400" /> Paramètres
                </button>

                <div className="h-[1px] bg-slate-100/60 my-2 mx-4"></div>

                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-4 px-5 py-3 text-[14px] text-red-500 hover:bg-red-50 transition-colors font-bold"
                >
                  <LogOut size={18} /> Déconnexion
                </button>
              </div>
            </>
          )}
        </div>

        {/* Menu Plus */}
        <button className="p-2.5 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all">
          <MoreVertical size={24} />
        </button>
      </div>
    </header>
  );
};

export default ChatHeader;