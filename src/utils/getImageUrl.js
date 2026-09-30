const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80';

export function getImageUrl(path, fallback = FALLBACK_IMAGE) {
  if (!path) return fallback;
  // Ne pas re-préfixer si le chemin est déjà une URL absolue
  if (/^https?:\/\//i.test(path)) return path;

  // Extraction de l'URL de base depuis l'environnement
  let baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  
  // On nettoie le suffixe /api ou /v1 s'il est présent dans VITE_API_URL
  baseUrl = baseUrl.replace(/\/api(\/v\d+)?\/?$/, '');
  
  // Nettoyage des slashs de concaténation
  baseUrl = baseUrl.replace(/\/$/, '');
  const cleanPath = path.replace(/^\//, '');

  return `${baseUrl}/${cleanPath}`;
}

export { FALLBACK_IMAGE };
