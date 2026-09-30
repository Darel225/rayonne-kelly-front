import axios from 'axios';
import useAuthStore from '../store/authStore';

// URL de base de l'API (avec fallback local)
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

/**
 * Instance globale Axios avec withCredentials: true.
 * Obligatoire pour envoyer/recevoir le cookie HttpOnly du Refresh Token.
 */
const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Intercepteur de requête : injecter l'Access Token s'il est présent dans le store Zustand.
api.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Variables pour le mutex du refresh token
let isRefreshing = false;
let failedQueue = [];

/**
 * Exécute la file d'attente des promesses en attente (soit avec succès, soit en rejetant).
 */
const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Intercepteur de réponse
api.interceptors.response.use(
  (response) => {
    // Extraction de l'enveloppe selon le blueprint { success: bool, data: ..., message: ... }
    // Si response.data.data n'existe pas, on renvoie response.data entier pour éviter de perdre les données.
    if (response.data && response.data.data !== undefined) {
      return response.data.data;
    }
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // S'il n'y a pas de config (erreur réseau) ou si la requête a déjà été retry, on rejette.
    if (!originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    const isUnauthorized = error.response && error.response.status === 401;
    const isAuthRoute = originalRequest.url && (originalRequest.url.includes('/auth/login') || originalRequest.url.includes('/auth/refresh'));

    // Cas d'un 403 : Rôle insuffisant.
    // L'API spécifie qu'on NE DOIT PAS refresh, juste propager l'erreur.
    if (error.response && error.response.status === 403) {
      return Promise.reject(error);
    }

    // Cas d'un 401 sur une route non-auth : tentative de Refresh Token
    if (isUnauthorized && !isAuthRoute) {
      originalRequest._retry = true;

      // Si un refresh est déjà en cours, on met la requête en file d'attente
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      // Début du refresh mutex
      isRefreshing = true;

      try {
        // IMPORTANT : Utiliser axios brut ou une instance sans l'intercepteur pour éviter 
        // une boucle infinie si le refresh échoue en 401.
        const refreshResponse = await axios.post(`${baseURL}/auth/refresh`, {}, {
          withCredentials: true
        });

        // Supposant que la route renvoie l'enveloppe avec l'access_token dans la data.
        const responseData = refreshResponse.data.data || refreshResponse.data;
        const newAccessToken = responseData.access_token || responseData.token || responseData.accessToken;
        const user = responseData.user;

        // Mise à jour de la session Zustand
        useAuthStore.getState().setSession(newAccessToken, user);

        // Vider la queue avec succès
        processQueue(null, newAccessToken);

        // Rejouer la requête d'origine avec le nouveau token
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        return api(originalRequest);
        
      } catch (refreshError) {
        // En cas d'échec du refresh (token expiré, invalide, etc.)
        useAuthStore.getState().clearSession();
        processQueue(refreshError, null);
        
        // Point d'extension clair pour la navigation : dispatch d'un événement global
        // Le Router ou un Layout global pourra écouter cet événement pour rediriger.
        window.dispatchEvent(new CustomEvent('auth:session_expired'));
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
