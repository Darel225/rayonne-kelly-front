import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import useAuthStore from '../store/authStore';

/**
 * Composant de réhydratation de la session globale.
 * Intervient avant le montage de l'application pour restaurer un accessToken
 * depuis le cookie HttpOnly du refreshToken, sans déclencher le mutex des 401 en cours de session.
 */
export default function AuthProvider({ children }) {
  const [isInitializing, setIsInitializing] = useState(true);
  const hasRun = useRef(false);
  
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);

  useEffect(() => {
    // Garde anti-double-appel lié au StrictMode de React 18 en développement
    if (hasRun.current) return;
    hasRun.current = true;

    const verifySession = async () => {
      try {
        // Extraction précise : on n'utilise pas .data.data car l'intercepteur 
        // Axios global (api.js) déballe déjà l'enveloppe { success, data, message }.
        const { access_token } = await api.post('/auth/refresh');

        // Récupération du profil utilisateur en forçant le Header car le store Zustand
        // n'est pas encore au courant de ce nouveau token au moment de cet appel.
        const meResponse = await api.get('/auth/me', { 
          headers: { Authorization: `Bearer ${access_token}` } 
        });

        const user = meResponse.user || meResponse;

        // Hydratation silencieuse de la mémoire Zustand
        setSession(access_token, user);
      } catch (error) {
        // En cas d'échec (ex: cookie absent, token expiré, ou erreur réseau), on s'assure
        // que la mémoire est purgée. AUCUNE REDIRECTION ici, les routes publiques doivent
        // rester accessibles normalement aux visiteurs non connectés.
        clearSession();
      } finally {
        // Débloque toujours l'affichage de l'application (children) pour ne jamais geler l'UI
        setIsInitializing(false);
      }
    };

    verifySession();
  }, [setSession, clearSession]);

  if (isInitializing) {
    return (
      <div className="bg-ivory min-h-screen w-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-royal border-t-transparent rounded-full animate-spin"></div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-royal">
            Initialisation sécurisée...
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
