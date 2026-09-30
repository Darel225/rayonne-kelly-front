import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

export default function RequireAdmin({ children }) {
  const { user, accessToken } = useAuthStore();

  if (!accessToken) {
    return <Navigate to="/connexion" replace />;
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/client" replace />;
  }

  return children;
}
