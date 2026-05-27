import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
});

// INTERCEPTEUR REQUÊTE : On injecte le token automatiquement (Ton code d'origine)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
  }, (error) => {
    return Promise.reject(error);
  });

// INTERCEPTEUR RÉPONSE : Gestion du serveur Down + ta gestion de la 401
api.interceptors.response.use(
  (response) => response, 
  (error) => {
    
    // 🚨 CAS 1 : LE SERVEUR NE RÉPOND PAS (Coupure technique / Down)
    if (!error.response) {
      console.error("🚨 Connexion au backend perdue ou impossible !");
      
      // On évite la redirection infinie si on est déjà sur la page de maintenance
      if (!window.location.pathname.includes('/service-down')) {
        window.location.href = '/service-down';
      }
      return Promise.reject(error);
    }

    // 🔐 CAS 2 : SESSION EXPIRÉE (Ton code d'origine intact)
    if (error.response && error.response.status === 401) {
      console.warn("Session expirée ou invalide, redirection vers Login...");
      
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('token'); 
        localStorage.removeItem('user'); 
        window.location.href = '/login?expired=true';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;