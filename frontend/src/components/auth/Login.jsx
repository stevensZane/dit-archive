// import { useState } from 'react';
// import api from '../api/axios';
// import { useSearchParams } from 'react-router-dom';

// const Login = () => {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [searchParams] = useSearchParams();
//   const isExpired = searchParams.get('expired') === 'true';

  

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       // ✅ On utilise URLSearchParams pour le format application/x-www-form-urlencoded
//       const params = new URLSearchParams();
//       params.append('username', email.trim()); // .trim() pour éviter les espaces accidentels
//       params.append('password', password);

//       const response = await api.post('/login', params, {
//         headers: {
//           'Content-Type': 'application/x-www-form-urlencoded'
//         }
//       });

//       const user = response.data.user;
//       localStorage.setItem('token', response.data.access_token);
//       localStorage.setItem("user", JSON.stringify(response.data.user));

//       // Redirection
//       if (user.role === "admin") {
//         window.location.href = '/admin-space';
//       } else {
//         window.location.href = '/home';
//       } 
//     } catch (error) {
//       console.error(error.response?.data); // Regarde l'erreur précise dans la console
//       alert("Erreur de connexion. Vérifie tes identifiants.");
//     }
//   };

//   return (
//     <div className="min-h-screen bg-dit-blue flex flex-col justify-center p-4">
//       <div className="max-w-md w-full mx-auto bg-white rounded-2xl shadow-2xl p-8">
//         {/* Logo - On adapte la taille selon l'écran */}
//         <div className="flex flex-col items-center justify-center mb-10 text-center">
//           <img 
//             src="/logo-archive.png" 
//             alt="DIT Logo" 
//             className="md:h-35 object-contain"/>

//           <h2 className="text-xl text-gray-800 -mt-10">Connectez-vous pour accéder à votre espace.</h2>

//         </div>
//         {/* Affichage du message si la session est expirée */}
//         {isExpired && (
//           <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
//             <p className="font-bold">Session expirée</p>
//             <p>Pour votre sécurité, merci de vous reconnecter.</p>
//           </div>
//         )}

//         <h2 className="text-2xl font-bold text-dit-blue text-center mb-6">Connexion</h2>
        
//         <form onSubmit={handleSubmit} className="space-y-6">
//           <div>
//             <label className="block text-sm font-medium text-gray-700">Adresse mail</label>
//             <input 
//               type="email" 
//               className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-dit-teal focus:border-dit-teal"
//               placeholder="votre.nom@dit.sn"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               required
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700">Mot de passe</label>
//             <input 
//               type="password" 
//               className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-dit-teal focus:border-dit-teal"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               required
//             />
//           </div>

//           <button
//           type="submit"
//           className="w-full bg-[#004751] hover:bg-yellow-500 text-white font-bold py-3 rounded-lg transition duration-300 transform active:scale-95"
//         >
//           Se connecter
//         </button>

//         <p className="text-center text-sm text-gray-600">
//           Vous n'avez pas encore de compte ? <a href="/signup" className="text-dit-teal font-bold hover:underline">Créer un compte</a>
//         </p>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default Login;

import { useState } from 'react';
import api from '../api/axios';
import { useSearchParams } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react'; // Import des icônes

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // État pour la visibilité
  const [searchParams] = useSearchParams();
  const isExpired = searchParams.get('expired') === 'true';

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const params = new URLSearchParams();
      params.append('username', email.trim());
      params.append('password', password);

      const response = await api.post('/login', params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const user = response.data.user;
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      if (user.role === "admin") {
        window.location.href = '/admin-space';
      } else {
        window.location.href = '/home';
      } 
    } catch (error) {
      console.error(error.response?.data);
      alert("Erreur de connexion. Vérifie tes identifiants.");
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
            <label className="block text-sm font-medium text-gray-700">Adresse mail</label>
            <input 
              type="email" 
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-dit-teal focus:border-dit-teal outline-none"
              placeholder="votre.nom@dit.sn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
        </form>
      </div>
    </div>
  );
};

export default Login;