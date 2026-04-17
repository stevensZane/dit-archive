import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, isAdminRequired = false }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));
  if (!token) {
    return <Navigate to="/login" />;
  }

  if (isAdminRequired && user?.role !== 'admin' && user?.role !== 'superadmin') {
    return <Navigate to="/" />; 
  }

  return children;
};

export default ProtectedRoute;