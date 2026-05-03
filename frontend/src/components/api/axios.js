import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
});

// INTERCEPTEUR REQUÊTE : On injecte le token automatiquement
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
  }, (error) => {
    return Promise.reject(error);
  });

// INTERCEPTEUR RÉPONSE : On attrape la 401
api.interceptors.response.use(
  (response) => response, 
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("Session expirée ou invalide, redirection vers Login...");
      
      // On évite de rediriger en boucle si on est déjà sur la page login
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('token'); 
        localStorage.removeItem('user'); // Nettoie aussi les infos user si tu en as
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export default api;