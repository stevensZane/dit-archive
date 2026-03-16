import { useState } from 'react';
import api from '../api/axios';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Rappel : OAuth2 attend un format form-data, pas du JSON pur
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', password);

      const response = await api.post('/login', formData);
      const user = response.data.user;
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      if (user.role === "admin") {
        window.location.href = '/admin-space';
      } else {
        window.location.href = '/home';
      } 
    } catch (error) {
      alert("Erreur de connexion. Vérifie tes identifiants.");
    }
  };

  return (
    <div className="min-h-screen bg-dit-blue flex flex-col justify-center p-4">
      <div className="max-w-md w-full mx-auto bg-white rounded-2xl shadow-2xl p-8">
        {/* Logo - On adapte la taille selon l'écran */}
        <div className="flex flex-col items-center justify-center mb-10 text-center">
          <img 
            src="/logo-archive.png" 
            alt="DIT Logo" 
            className="md:h-35 object-contain"/>

          <h2 className="text-xl text-gray-800 -mt-10">Connectez-vous pour accéder à votre espace.</h2>

        </div>

        <h2 className="text-2xl font-bold text-dit-blue text-center mb-6">Connexion</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Adresse mail</label>
            <input 
              type="email" 
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-dit-teal focus:border-dit-teal"
              placeholder="votre.nom@dit.sn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Mot de passe</label>
            <input 
              type="password" 
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-dit-teal focus:border-dit-teal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
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