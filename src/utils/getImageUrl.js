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

/**
 * Extrait intelligemment la véritable photo de couverture d'une résidence.
 * Priorise :
 * 1. cover_image_url
 * 2. L'image marquée `is_cover` dans le tableau `images`
 * 3. La première image du tableau `images`
 * 4. La propriété `image`
 * 5. Fallback sécurisé
 */
export function getResidenceCoverImage(row, fallback = FALLBACK_IMAGE) {
  if (!row) return fallback;

  // 1. Cover explicite si présente
  if (row.cover_image_url && typeof row.cover_image_url === 'string' && row.cover_image_url.trim()) {
    return getImageUrl(row.cover_image_url.trim(), fallback);
  }

  // 2. Recherche dans le tableau images
  if (Array.isArray(row.images) && row.images.length > 0) {
    const coverObj = row.images.find(img => img && (img.is_cover === 1 || img.is_cover === true || img.is_cover === '1'));
    const target = coverObj || row.images[0];

    if (typeof target === 'string' && target.trim()) {
      return getImageUrl(target.trim(), fallback);
    }
    if (target && typeof target === 'object') {
      const url = target.image_url || target.url || target.path || target.src;
      if (typeof url === 'string' && url.trim()) {
        return getImageUrl(url.trim(), fallback);
      }
    }
  }

  // 3. Fallback sur row.image si existant
  if (row.image) {
    if (typeof row.image === 'string' && row.image.trim()) {
      return getImageUrl(row.image.trim(), fallback);
    }
    if (typeof row.image === 'object') {
      const url = row.image.image_url || row.image.url || row.image.path;
      if (typeof url === 'string' && url.trim()) {
        return getImageUrl(url.trim(), fallback);
      }
    }
  }

  return fallback;
}
