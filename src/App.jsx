import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Toaster, toast } from "sonner";
import AppRoutes from './routes/AppRoutes';
import useAuthStore from './store/authStore';

function GlobalSessionListener() {
  const navigate = useNavigate();
  const location = useLocation();
  const clearSession = useAuthStore((state) => state.clearSession);

  useEffect(() => {
    const handleSessionExpired = () => {
      clearSession();
      // Garde-fou anti-boucle et anti-spam
      if (location.pathname !== '/connexion') {
        toast.error('Votre session a expiré, veuillez vous reconnecter');
        navigate('/connexion');
      }
    };

    window.addEventListener('auth:session_expired', handleSessionExpired);
    return () => {
      window.removeEventListener('auth:session_expired', handleSessionExpired);
    };
  }, [clearSession, navigate, location.pathname]);

  return null;
}

function App() {
  return (
    <>
      <GlobalSessionListener />
      <Toaster richColors position="top-right" />
      <AppRoutes />
    </>
  );
}

export default App;
