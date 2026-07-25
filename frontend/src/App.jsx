import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import api from "./components/api/axios";

// Vos composants
import Login from "./components/auth/Login";
import Signup from "./components/auth/Signup";
import Home from "./components/pages/Home";
import ProjectDetail from "./components/pages/ProjectDetail";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import StudentPortal from "./components/pages/StudentSpace";
import Explore from "./components/pages/Explore";
import Nora from "./components/pages/NoraChat";
import AdminSpace from "./components/pages/AdminSpace";
import DataPlace from "./components/pages/DataPlace";
import Feedback from "./components/pages/Feedback";
import ServiceDown from "./components/pages/ServiceDown";
import DashboardBI from "./components/pages/DashboardBI"
import AdminSubmissions from "./components/pages/AdminSubmissions";

function App() {
  const [checkingServer, setCheckingServer] = useState(true);
  
  useEffect(() => {
    // 1. TEST DE CONNEXION AU BACKEND AU DÉMARRAGE
    api.get("/")
      .catch((err) => {
        // Si le serveur ne répond pas, l'intercepteur axios gère déjà le window.location.href = "/service-down"
        if (!err.response) {
          console.error("Serveur éteint détecté au démarrage.");
        }
      })
      .finally(() => {
        setCheckingServer(false);
      });

    // 2. GESTION DE TOKEN
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;

      // Calcul du temps restant avant expiration (en millisecondes)
      const timeLeft = (decoded.exp - currentTime) * 1000;

      if (timeLeft <= 0) {
        handleLogout();
      } else {
        // On programme la déconnexion automatique
        const timer = setTimeout(() => {
          console.log("Token expiré ! Déconnexion automatique...");
          handleLogout();
        }, timeLeft);

        return () => clearTimeout(timer);
      }
    } catch (error) {
      handleLogout();
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login?expired=true";
  };

  // ÉCRAN DE CHARGEMENT : Bloque TOUT le reste tant qu'on n'a pas le verdict du serveur
  if (checkingServer) {
    // Si l'utilisateur est déjà sur la page d'erreur, on le laisse voir la page d'erreur
    if (window.location.pathname === "/service-down") {
      return <Router><Routes><Route path="/service-down" element={<ServiceDown />} /></Routes></Router>;
    }
    
    // Sinon, on affiche UNIQUEMENT le loader (aucun flash possible !)
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center text-white gap-3 font-sans">
        <div className="animate-spin text-[#004751] text-2xl">🔄</div>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
          Connexion à l'Archive...
        </p>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* 1. Public : Login & Signup */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* 2. Protégé : Home & Détails Projet */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <StudentPortal />
            </ProtectedRoute>
          }
        />

        <Route
          path="/explore"
          element={
            <ProtectedRoute>
              <Explore />
            </ProtectedRoute>
          }
        />

        <Route
          path="/nora"
          element={
            <ProtectedRoute>
              <Nora />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-space"
          element={
            <ProtectedRoute>
              <AdminSpace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/data-place"
          element={
            <ProtectedRoute>
              <DataPlace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/feedback"
          element={
            <ProtectedRoute>
              <Feedback />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard-bi"
          element={
            <ProtectedRoute>
              <DashboardBI />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin-submissions"
          element={
            <ProtectedRoute>
              <AdminSubmissions />
            </ProtectedRoute>
          }
        />

        {/* On protège aussi le détail pour que seuls les connectés voient les archives */}
        <Route
          path="/project/:id"
          element={
            <ProtectedRoute>
              <ProjectDetail />
            </ProtectedRoute>
          }
        />

        <Route path="/service-down" element={<ServiceDown />} />

        {/* Redirections automatiques */}
        <Route path="/" element={<Navigate to="/home" />} />
        <Route path="*" element={<Navigate to="/home" />} />
      </Routes>
    </Router>
  );
}

export default App;