import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, isAdminRequired = false }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user')); // On suppose que tu stockes les infos user au login

  if (!token) {
    return <Navigate to="/login" />;
  }

  if (isAdminRequired && user?.role !== 'admin' && user?.role !== 'superadmin') {
    return <Navigate to="/" />; // Redirige vers l'accueil si pas admin
  }

  return children;
};

export default ProtectedRoute;