import { create } from 'zustand';

/**
 * Store global pour gérer l'état d'authentification.
 * Respecte la consigne stricte : l'Access Token ne touche JAMAIS au localStorage
 * ou au sessionStorage. Il est stocké uniquement en mémoire.
 */
const useAuthStore = create((set, get) => ({
  accessToken: null,
  user: null,

  // L'état isAuthenticated est dérivé dynamiquement dans les composants
  // (ne jamais utiliser de get() { ... } dans Zustand car Object.assign écrase les getters en valeurs statiques lors des mises à jour)

  /**
   * Enregistre la session active.
   * Seule cette action (avec clearSession) peut modifier le token pour
   * s'assurer qu'un utilisateur est toujours lié à un token.
   * 
   * @param {string} accessToken Le JWT court reçu de l'API
   * @param {object} user Les détails de l'utilisateur
   */
  setSession: (accessToken, user) => set({ accessToken, user }),

  /**
   * Met à jour les informations de l'utilisateur sans écraser le token.
   */
  setUser: (user) => set({ user }),

  /**
   * Réinitialise totalement la session en mémoire.
   */
  clearSession: () => set({ accessToken: null, user: null }),
}));

export default useAuthStore;
