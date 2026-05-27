import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./components/auth/Login";
import Signup from "./components/auth/Signup";
import Home from "./components/pages/Home";
import ProjectDetail from "./components/pages/ProjectDetail";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import StudentPortal from "./components/pages/StudentSpace";
import Explore from "./components/pages/Explore";
import Nora from "./components/pages/NoraChat";
import AdminSpace from "./components/pages/AdminSpace";
import { jwtDecode } from "jwt-decode";
import { useEffect } from "react";
import Leaderboard from "./components/pages/LeaderBoard";
import DataPlace from "./components/pages/DataPlace";
import Feedback from "./components/pages/Feedback";
import ServiceDown from "./components/pages/ServiceDown"

function App() {
  useEffect(() => {
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
    window.location.href = "/users/login?expired=true";
  };

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
          path="/leaderboard"
          element={
            <ProtectedRoute>
              <Leaderboard />
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
