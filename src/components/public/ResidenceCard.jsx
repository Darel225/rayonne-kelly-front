import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import formatPrice from '../../utils/formatPrice';
import { motion } from 'framer-motion';
import { getImageUrl } from '../../utils/getImageUrl';

export default function ResidenceCard({ residence, index }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Normalisation des images
  let images = [];
  if (residence.images && Array.isArray(residence.images) && residence.images.length > 0) {
    images = residence.images.map(img => typeof img === 'string' ? getImageUrl(img) : getImageUrl(img.image_url));
  } else if (residence.image) {
    images = [residence.image];
  } else if (residence.cover_image_url) {
    images = [getImageUrl(residence.cover_image_url)];
  }

  const handleNextImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrevImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const currentImage = images.length > 0 ? images[currentImageIndex] : 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80';

  // Traitement Localisation
  const formatLocation = () => {
    const dist = (residence.location || residence.district || '').trim();
    const cty = (residence.city || 'Abidjan').trim();
    if (!dist) return cty;
    if (dist.toLowerCase() === cty.toLowerCase()) return cty;
    return `${dist}, ${cty}`;
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.8, delay: (index % 6) * 0.1, ease: "easeOut" }}
      className="group flex flex-col bg-transparent"
    >
      {/* Image Dominante */}
      <div className="relative w-full aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100">
        <Link to={`/collection/${residence.slug || residence.id}`} className="block w-full h-full">
          <img
            src={currentImage}
            alt={residence.title}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80'; }}
          />
        </Link>

        {/* Badge "Disponible" (Style Glassmorphism) */}
        <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md border border-white/20 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-white rounded-sm shadow-sm">
          {residence.status === 'unavailable' ? 'Indisponible' : 'Disponible'}
        </div>

        {/* Contrôles du carrousel (flèches) */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrevImage}
              className="absolute top-1/2 left-2 -translate-y-1/2 bg-white/80 hover:bg-white text-night p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
              aria-label="Image précédente"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={handleNextImage}
              className="absolute top-1/2 right-2 -translate-y-1/2 bg-white/80 hover:bg-white text-night p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
              aria-label="Image suivante"
            >
              <ChevronRight size={18} />
            </button>

            {/* Pagination intelligente */}
            {images.length > 6 ? (
              <div className="absolute bottom-3 right-3 bg-night/70 backdrop-blur-sm text-white text-[10px] font-medium px-2.5 py-1 rounded-full shadow-sm">
                {currentImageIndex + 1} / {images.length}
              </div>
            ) : (
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                {images.map((_, idx) => (
                  <span
                    key={idx}
                    className={`block h-1.5 rounded-full transition-all duration-300 ${idx === currentImageIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Typographie Groupée & Resserrée (Design Éditorial) */}
      <div className="mt-5 flex flex-col">

        <Link to={`/collection/${residence.slug || residence.id}`} className="group-hover:opacity-90 transition-opacity block">

          {/* Ligne 1 : Titre */}
          <h3 className="font-serif text-2xl font-light text-night line-clamp-1 mb-2">
            {residence.title}
          </h3>

          {/* Ligne 2 : Localisation Précise avec Adresse */}
          <div className="flex items-center gap-1.5 text-xs text-ink/70 mb-1">
            <MapPin size={12} className="text-gold" />
            <span className="line-clamp-1">{residence.address || formatLocation()}</span>
          </div>

          {/* Ligne 3 : Caractéristiques détaillées */}
          <div className="text-[13px] text-ink-muted mb-4">
            {[
              residence.rooms ? `${residence.rooms} pièces` : null,
              (residence.guests || residence.max_guests || residence.maxGuests) ? `${residence.guests || residence.max_guests || residence.maxGuests} voyageurs` : null,
              "Salon",
              "Cuisine équipée"
            ].filter(Boolean).join(" • ")}
          </div>

          {/* Ligne 4 : Prix */}
          <div className="flex items-baseline mb-5">
            {residence.pricePerNight ? (
              <>
                <span className="font-serif text-xl font-medium text-night">{formatPrice(residence.pricePerNight)}</span>
                <span className="text-xs text-ink-muted ml-1.5">/ nuit</span>
              </>
            ) : (
              <span className="font-serif text-xl font-medium text-night">Sur demande</span>
            )}
          </div>
        </Link>

        {/* Ligne 5 : Boutons d'action (Haute Couture) */}
        <div className="flex items-center justify-between border-t border-gray-100 pt-5">
          <Link
            to={`/collection/${residence.slug || residence.id}`}
            className="text-xs font-semibold uppercase tracking-widest text-ink-muted hover:text-royal transition-colors"
          >
            Voir le bien
          </Link>

          <Link
            to={`/collection/${residence.slug || residence.id}?action=booking`}
            className="bg-night text-white px-8 py-3 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-royal transition-colors duration-500 rounded-sm"
          >
            Réserver
          </Link>
        </div>

      </div>
    </motion.article>
  );
}
