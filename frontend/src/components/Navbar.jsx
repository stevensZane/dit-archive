import { useNavigate, Link } from 'react-router-dom';
import { LogOut, Bot } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const storedUser = localStorage.getItem("user");

  let user = null;

    try {
    user = storedUser ? JSON.parse(storedUser) : null;
    } catch {
    user = null;
    }

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto flex justify-between items-center h-16">
        {/* Logo Seul */}

        <Link to="/home">
          <div className="flex items-center cursor-pointer">
            <img src="/logo-archive.png" alt="DIT Archive Logo" className="h-30 w-auto object-contain" />
          </div>
        </Link>
        

        {/* Actions - Texte Noir sur fond blanc = Visibilité 100% */}
        <div className="flex items-center space-x-8">
          <Link to="/home" className="text-gray-900 font-semibold hover:text-dit-teal transition">Accueil</Link>
          <Link to="/explore" className="text-gray-900 font-semibold hover:text-dit-teal transition">Explore</Link>
          <Link to="/nora" className="flex items-center gap-1 text-gray-900 font-semibold hover:text-dit-teal transition"><Bot /> Nora</Link>
          <Link to={user?.role === "admin" ? "/admin-space" : "/dashboard"}>
            <div className="flex items-center space-x-4 border-l pl-6 border-gray-200">
              <div className="bg-gray-100 min-h-10 min-w-10 px-4 py-2 rounded-full flex items-center justify-center border border-gray-200">
                <span className="text-dit-yellow font-bold whitespace-nowrap">
                  {user?.name ?? "User"}
                </span>
              </div>
            </div>
          </Link>
        

           <button 
          onClick={() => { localStorage.clear(); navigate('/login'); }}
          className="text-sm font-medium text-slate-400 hover:text-red-500 transition-colors"
        >
          <LogOut/>
        </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;