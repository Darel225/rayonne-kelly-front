import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import formatPrice from '../../utils/formatPrice';
import { motion } from 'framer-motion';
import { getImageUrl } from '../../utils/getImageUrl';

export default function ResidenceCard({ residence, index }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchStartY, setTouchStartY] = useState(null);

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
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrevImage = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // Gestion du Swipe tactile sur smartphone / tablette (onefinestay & Airbnb style)
  const handleTouchStart = (e) => {
    if (!images || images.length <= 1) return;
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e) => {
    if (touchStartX === null || touchStartY === null || !images || images.length <= 1) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchStartX - touchEndX;
    const diffY = touchStartY - touchEndY;

    // Détection d'un swipe horizontal franc (> 35px et plus horizontal que vertical)
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 35) {
      if (diffX > 0) {
        handleNextImage();
      } else {
        handlePrevImage();
      }
    }
    setTouchStartX(null);
    setTouchStartY(null);
  };

  const currentImage = images.length > 0 ? images[currentImageIndex] : 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80';

  const txType = residence.transaction_type || localStorage.getItem(`rk_tx_type_${residence.id}`) || 'meuble';
  const status = residence.status || localStorage.getItem(`rk_status_${residence.id}`) || (residence.is_active === 0 || residence.status === 'unavailable' ? 'reserve' : 'disponible');
  const isAvailable = status === 'disponible';

  // Traitement Localisation
  const formatLocation = () => {
    const dist = (residence.location || residence.district || '').trim();
    const cty = (residence.city || 'Abidjan').trim();
    if (!dist) return cty;
    if (dist.toLowerCase() === cty.toLowerCase()) return cty;
    return `${dist}, ${cty}`;
  };

  const rawPrice = residence.pricePerNight || residence.price_per_night || residence.price || residence.price_sale;

  // Détection de la politique tarifaire : autorisée ('public') ou masquée ('on_demand')
  const priceDisplay = residence.price_display || localStorage.getItem(`rk_price_display_${residence.id}`) || (residence.is_price_displayed !== undefined ? (residence.is_price_displayed ? 'public' : 'on_demand') : (rawPrice ? 'public' : 'on_demand'));
  const isPriceMasked = priceDisplay === 'on_demand' || !rawPrice;

  // Détection automatique des atouts majeurs de prestige (Piscine, Vue Lagune, Penthouse...)
  const getPrestigeHighlight = () => {
    // 1. Highlight direct si spécifié
    if (residence.highlight) {
      const hl = residence.highlight.toLowerCase();
      if (hl.includes('piscine') || hl.includes('pool')) return { icon: '🏊‍♂️', text: residence.highlight };
      if (hl.includes('lagune') || hl.includes('vue')) return { icon: '🌅', text: residence.highlight };
      return { icon: '✨', text: residence.highlight };
    }

    // 2. Commodités (Array d'amenities)
    if (Array.isArray(residence.amenities)) {
      const hasPool = residence.amenities.some(a => {
        const str = (typeof a === 'string' ? a : a.name || a.label || a.id || '').toLowerCase();
        return str.includes('pool') || str.includes('piscine');
      });
      if (hasPool) return { icon: '🏊‍♂️', text: 'Piscine privée' };

      const hasLagoon = residence.amenities.some(a => {
        const str = (typeof a === 'string' ? a : a.name || a.label || a.id || '').toLowerCase();
        return str.includes('lagoon') || str.includes('lagune') || str.includes('vue');
      });
      if (hasLagoon) return { icon: '🌅', text: 'Vue Lagune' };
    }

    // 3. Texte du nom, de la description ou du type de bien
    const textToCheck = `${residence.title || residence.name || ''} ${residence.description || ''} ${residence.property_type || residence.type || ''}`.toLowerCase();
    if (textToCheck.includes('piscine') || textToCheck.includes('pool')) {
      return { icon: '🏊‍♂️', text: 'Piscine privée' };
    }
    if (textToCheck.includes('lagune')) {
      return { icon: '🌅', text: 'Vue Lagune' };
    }
    if (textToCheck.includes('penthouse')) {
      return { icon: '🏙️', text: 'Penthouse de prestige' };
    }
    if (textToCheck.includes('jardin')) {
      return { icon: '🌿', text: 'Jardin tropical' };
    }

    return null;
  };

  const prestigeBadge = getPrestigeHighlight();

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.8, delay: (index % 6) * 0.1, ease: "easeOut" }}
      className="group flex flex-col bg-transparent"
    >
      {/* Image Dominante & Défilement Tactile */}
      <div 
        className="relative w-full aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100 select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <Link to={`/collection/${residence.slug || residence.id}`} className="block w-full h-full">
          <img
            src={currentImage}
            alt={residence.title || residence.name}
            loading="lazy"
            decoding="async"
            className={`w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 ${!isAvailable ? 'grayscale-[25%]' : ''}`}
            onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80'; }}
          />
        </Link>

        {/* Macaron de Statut Commercial (Haute Couture) */}
        {status === 'vendu' ? (
          <div className="absolute top-4 left-4 bg-night/95 backdrop-blur-md border border-gold/70 px-3.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.25em] text-gold rounded-full shadow-xl flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
            DÉJÀ VENDU
          </div>
        ) : status === 'loue' ? (
          <div className="absolute top-4 left-4 bg-night/90 backdrop-blur-md border border-white/20 px-3.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-white/90 rounded-full shadow-md">
            DÉJÀ LOUÉ
          </div>
        ) : status === 'reserve' ? (
          <div className="absolute top-4 left-4 bg-amber-950/85 backdrop-blur-md border border-amber-400/50 px-3.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-amber-200 rounded-full shadow-md">
            RÉSERVÉ
          </div>
        ) : (
          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md border border-white/20 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-white rounded-full shadow-sm">
            {txType === 'vente' ? 'À VENDRE' : txType === 'location' ? 'À LOUER' : 'DISPONIBLE'}
          </div>
        )}

        {/* Badge Type de Transaction (si vente ou bail longue durée) */}
        {txType === 'vente' && (
          <div className="absolute top-4 right-4 bg-gold text-night px-2.5 py-1 text-[8px] font-mono font-bold uppercase tracking-widest rounded-full shadow-sm">
            Vente
          </div>
        )}
        {txType === 'location' && (
          <div className="absolute top-4 right-4 bg-white/95 text-night px-2.5 py-1 text-[8px] font-mono font-bold uppercase tracking-widest rounded-full shadow-sm">
            Bail Longue Durée
          </div>
        )}

        {/* Badge Atout Prestige (Piscine, Vue Lagune, Penthouse) */}
        {prestigeBadge && (
          <div className="absolute bottom-3 left-3 bg-night/85 backdrop-blur-md border border-white/20 px-3 py-1 text-[10px] font-medium tracking-wide text-white rounded-full shadow-md flex items-center gap-1.5 z-10 pointer-events-none">
            <span>{prestigeBadge.icon}</span>
            <span className="font-sans font-medium">{prestigeBadge.text}</span>
          </div>
        )}

        {/* Contrôles du carrousel Desktop (flèches au survol) */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrevImage}
              className="absolute top-1/2 left-2 -translate-y-1/2 bg-white/85 hover:bg-white text-night p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10 cursor-pointer"
              aria-label="Image précédente"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={handleNextImage}
              className="absolute top-1/2 right-2 -translate-y-1/2 bg-white/85 hover:bg-white text-night p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10 cursor-pointer"
              aria-label="Image suivante"
            >
              <ChevronRight size={18} />
            </button>

            {/* Pagination intelligente */}
            {images.length > 6 ? (
              <div className="absolute bottom-3 right-3 bg-night/70 backdrop-blur-sm text-white text-[10px] font-medium px-2.5 py-1 rounded-full shadow-sm z-10">
                {currentImageIndex + 1} / {images.length}
              </div>
            ) : (
              <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/40 backdrop-blur-xs px-2 py-1 rounded-full z-10">
                {images.map((_, idx) => (
                  <span
                    key={idx}
                    className={`block h-1.5 rounded-full transition-all duration-300 ${idx === currentImageIndex ? 'w-3.5 bg-white' : 'w-1.5 bg-white/50'}`}
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
            {residence.title || residence.name}
          </h3>

          {/* Ligne 2 : Localisation Précise avec Adresse */}
          <div className="flex items-center gap-1.5 text-xs text-ink/70 mb-1">
            <MapPin size={12} className="text-gold shrink-0" />
            <span className="line-clamp-1">{residence.address || formatLocation()}</span>
          </div>

          {/* Ligne 3 : Caractéristiques détaillées */}
          <div className="text-[13px] text-ink-muted mb-4">
            {[
              (residence.rooms || residence.rooms_count) ? `${residence.rooms || residence.rooms_count} pièces` : null,
              (residence.guests || residence.max_guests || residence.maxGuests) ? `${residence.guests || residence.max_guests || residence.maxGuests} voyageurs` : null,
              "Salon",
              "Cuisine équipée"
            ].filter(Boolean).join(" • ")}
          </div>

          {/* Ligne 4 : Prix adapté au type de transaction et politique tarifaire */}
          <div className="flex items-baseline mb-5">
            {!isPriceMasked && rawPrice ? (
              <>
                <span className="text-[10px] font-sans font-medium text-ink-muted uppercase tracking-wider mr-1.5">
                  À partir de
                </span>
                <span className="font-serif text-xl font-semibold text-night">{formatPrice(rawPrice)}</span>
                <span className="text-xs text-ink-muted ml-1.5">
                  {txType === 'vente' ? '' : txType === 'location' ? '/ mois' : '/ nuit'}
                </span>
              </>
            ) : (
              <span className="inline-flex items-center text-xs font-serif font-medium text-gold-dark bg-amber-50/80 border border-gold/30 px-3 py-1 rounded-full tracking-wide">
                Tarif sur demande
              </span>
            )}
          </div>
        </Link>

        {/* Ligne 5 : Boutons d'action (Haute Couture) */}
        <div className="flex items-center justify-between gap-2 border-t border-gray-100 pt-5">
          <Link
            to={`/collection/${residence.slug || residence.id}`}
            className="text-xs font-semibold uppercase tracking-widest text-ink-muted hover:text-royal transition-colors"
          >
            Voir le bien
          </Link>

          {status === 'vendu' ? (
            <span className="bg-gray-100 text-gray-400 px-6 py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] rounded-full cursor-not-allowed">
              Bien vendu
            </span>
          ) : status === 'loue' ? (
            <span className="bg-gray-100 text-gray-400 px-6 py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] rounded-full cursor-not-allowed">
              Déjà loué
            </span>
          ) : txType === 'vente' ? (
            <Link
              to={`/collection/${residence.slug || residence.id}`}
              className="bg-night text-white px-7 py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-royal transition-colors duration-300 rounded-full shadow-sm"
            >
              Visiter le bien
            </Link>
          ) : status === 'reserve' ? (
            <Link
              to={`/collection/${residence.slug || residence.id}`}
              className="border border-night/20 text-night px-6 py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-night hover:text-white transition-colors rounded-full"
            >
              Consulter
            </Link>
          ) : isPriceMasked ? (
            <Link
              to={`/collection/${residence.slug || residence.id}?action=booking`}
              className="bg-night text-white px-6 py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-royal transition-colors duration-300 rounded-full whitespace-nowrap shadow-sm"
            >
              Demander un devis
            </Link>
          ) : (
            <Link
              to={`/collection/${residence.slug || residence.id}?action=booking`}
              className="bg-night text-white px-7 py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-royal transition-colors duration-300 rounded-full shadow-sm"
            >
              Réserver
            </Link>
          )}
        </div>

      </div>
    </motion.article>
  );
}
