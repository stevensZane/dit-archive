import { useState } from 'react';
import api from '../api/axios';
import { useSearchParams } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

const Login = () => {
  // Changement de nom de variable pour refléter le choix (email ou username)
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [searchParams] = useSearchParams();
  const isExpired = searchParams.get('expired') === 'true';

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const params = new URLSearchParams();
      params.append('username', identifier.trim()); // Envoyé dans la clé 'username' pour OAuth2
      params.append('password', password);

      const response = await api.post('/users/login', params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const user = response.data.user;
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      if (user.role === "admin" || user.role === "superadmin") {
        window.location.href = '/admin-space';
      } else {
        window.location.href = '/home';
      } 
    } catch (error) {
      console.error(error.response?.data);
      alert("Erreur de connexion. Vérifie tes identifiants.");
    }
  };

  const handleGuestLogin = async () => {
    try {
      const response = await api.post('/users/guest-login');
      
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      // Redirection directe vers le catalogue de l'application
      window.location.href = '/home';
    } catch (error) {
      alert("Impossible d'accéder au mode invité pour le moment.");
    }
  };

  return (
    <div className="min-h-screen bg-dit-blue flex flex-col justify-center p-4">
      <div className="max-w-md w-full mx-auto bg-white rounded-2xl shadow-2xl p-8">
        <div className="flex flex-col items-center justify-center mb-10 text-center">
          <img 
            src="/logo-archive.png" 
            alt="DIT Logo" 
            className="md:h-35 object-contain"/>
          <h2 className="text-xl text-gray-800 -mt-10">Connectez-vous pour accéder à votre espace.</h2>
        </div>

        {isExpired && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
            <p className="font-bold">Session expirée</p>
            <p>Pour votre sécurité, merci de vous reconnecter.</p>
          </div>
        )}

        <h2 className="text-2xl font-bold text-dit-blue text-center mb-6">Connexion</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            {/* Label et type mis à jour pour accepter email ou pseudo */}
            <label className="block text-sm font-medium text-gray-700">Identifiant ou Adresse mail</label>
            <input 
              type="text" 
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-dit-teal focus:border-dit-teal outline-none"
              placeholder="nom.prenom@dit.sn ou nom_utilisateur"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Mot de passe</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-dit-teal focus:border-dit-teal outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-[#004751] hover:bg-yellow-500 text-white font-bold py-3 rounded-lg transition duration-300 transform active:scale-95"
          >
            Se connecter
          </button>

          <p className="text-center text-sm text-gray-600">
            Vous n'avez pas encore de compte ? <a href="/signup" className="text-dit-teal font-bold hover:underline">Créer un compte</a>
          </p>

          {/* ... après ton bouton submit principal ... */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink mx-4 text-gray-400 text-xs uppercase tracking-wider">Ou</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          <button
            type="button"
            onClick={handleGuestLogin}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-lg transition duration-300 transform active:scale-95 border border-slate-200 text-sm"
          >
            Explorer en tant qu'invité
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;