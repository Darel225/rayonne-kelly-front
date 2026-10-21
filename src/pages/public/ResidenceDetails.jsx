import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, ZoomIn, Images, AlertCircle, Check, Shield, Wifi, Tv, Coffee, Droplets, Wind, Lock, Battery, Thermometer, Zap, Key, Star, ShieldCheck, X, ChevronLeft, ChevronRight, MessageCircle, Phone, ExternalLink } from 'lucide-react';
import Button from '../../components/common/Button';
import api from '../../services/api';
import { getImageUrl, FALLBACK_IMAGE } from '../../utils/getImageUrl';
import BookingWidget from '../../components/residence/BookingWidget';
import RestaurantMenu from '../../components/residence/RestaurantMenu';
import NeighborhoodItineraryMap from '../../components/residence/NeighborhoodItineraryMap';

import { getAmenityIcon } from '../../utils/iconMap';
import useAuthStore from '../../store/authStore';

function getIconComponent(amenity) {
  // Nouveau système : L'icône est renseignée depuis le back-office
  if (amenity?.icon_name) {
    return getAmenityIcon(amenity.icon_name);
  }
  
  // Fallback (Ancien système) : Pour les équipements actuels où icon_name est NULL
  const name = amenity?.name?.toLowerCase() || '';
  if (name.includes('wifi') || name.includes('internet')) return getAmenityIcon('Wifi');
  if (name.includes('tv') || name.includes('télé')) return getAmenityIcon('Tv');
  if (name.includes('piscine') || name.includes('eau') || name.includes('jacuzzi')) return getAmenityIcon('Droplets');
  if (name.includes('clim') || name.includes('air')) return getAmenityIcon('Wind');
  if (name.includes('sécurité') || name.includes('gardien') || name.includes('alarme')) return getAmenityIcon('Shield');
  if (name.includes('café') || name.includes('thé') || name.includes('nespresso')) return getAmenityIcon('Coffee');
  if (name.includes('serrure') || name.includes('coffre')) return getAmenityIcon('Lock');
  if (name.includes('énergie') || name.includes('groupe') || name.includes('générateur')) return getAmenityIcon('Zap');
  
  return getAmenityIcon('Check');
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};

export default function ResidenceDetails() {
  const { id: slug } = useParams(); // La route utilise :id, mais c'est bien un slug (ou un ID) qui est passé
  const navigate = useNavigate();

  // États pour le fetch
  const [residence, setResidence] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const isAuthenticated = useAuthStore(state => !!state.accessToken);

  // États pour la Lightbox
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const fetchResidence = async (isMounted) => {
    setIsLoading(true);
    setError(null);
    setNotFound(false);

    try {
      const response = await api.get(`/residences/${slug}`);
      const data = response.data?.data || response.data || response;
      if (isMounted) {
        setResidence(data);
      }
    } catch (err) {
      console.error(err);
      if (isMounted) {
        if (err.response?.status === 404) {
          setNotFound(true);
        } else {
          setError("Impossible de charger les détails de cette résidence pour le moment.");
        }
      }
    } finally {
      if (isMounted) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    let isMounted = true;
    fetchResidence(isMounted);
    return () => {
      isMounted = false;
    };
  }, [slug]);


  // --- LOGIQUE LIGHTBOX ---
  const rawImages = Array.isArray(residence?.images) ? residence.images : [];

  const openGallery = (index) => {
    if (!rawImages || rawImages.length === 0) return;
    setCurrentIndex(index);
    setIsGalleryOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeGallery = () => {
    setIsGalleryOpen(false);
    document.body.style.overflow = '';
  };

  const nextImage = (e) => {
    if (e) e.stopPropagation();
    if (rawImages.length > 0) {
      setCurrentIndex(prev => (prev === rawImages.length - 1 ? 0 : prev + 1));
    }
  };

  const prevImage = (e) => {
    if (e) e.stopPropagation();
    if (rawImages.length > 0) {
      setCurrentIndex(prev => (prev === 0 ? rawImages.length - 1 : prev - 1));
    }
  };

  useEffect(() => {
    if (!isGalleryOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeGallery();
      else if (e.key === 'ArrowRight') nextImage();
      else if (e.key === 'ArrowLeft') prevImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGalleryOpen, rawImages.length]);

  // Support swipe basique (tactile)
  const [touchStart, setTouchStart] = useState(null);
  const handleTouchStart = (e) => setTouchStart(e.targetTouches[0].clientX);
  const handleTouchEnd = (e) => {
    if (!touchStart) return;
    const touchEnd = e.changedTouches[0].clientX;
    if (touchStart - touchEnd > 50) nextImage();
    if (touchStart - touchEnd < -50) prevImage();
    setTouchStart(null);
  };
  // -------------------------

  // RENDU DE BLOCAGE - CHARGEMENT
  if (isLoading) {
    return (
      <main className="pt-24 pb-24 min-h-screen bg-mist">
        <div className="max-w-7xl mx-auto px-6 animate-pulse">
          <div className="h-[480px] md:h-[540px] bg-gray-200 rounded-xl mb-12"></div>
          <div className="mb-16">
            <div className="h-4 bg-gray-200 w-1/4 rounded mb-8"></div>
            <div className="h-16 bg-gray-200 w-2/3 rounded mb-6"></div>
            <div className="h-6 bg-gray-200 w-1/2 rounded"></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-20 items-start">
            <div className="lg:col-span-2 space-y-16">
              <div className="h-40 bg-gray-200 rounded"></div>
              <div className="h-60 bg-gray-200 rounded"></div>
            </div>
            <div className="lg:col-span-1 h-96 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </main>
    );
  }

  // RENDU DE BLOCAGE - NON TROUVÉ (404)
  if (notFound) {
    return (
      <main className="pt-32 pb-24 min-h-screen bg-mist flex flex-col items-center justify-center">
        <AlertCircle size={64} className="text-gray-400 mb-6" />
        <h1 className="font-serif text-4xl text-ink mb-4">Résidence introuvable</h1>
        <p className="text-ink-muted mb-8 text-center max-w-md">La résidence que vous recherchez n'existe pas ou n'est plus disponible dans notre catalogue.</p>
        <Button onClick={() => navigate('/collection')} variant="royal" className="px-8 py-3">
          Retour au catalogue
        </Button>
      </main>
    );
  }

  // RENDU DE BLOCAGE - ERREUR
  if (error || !residence) {
    return (
      <main className="pt-32 pb-24 min-h-screen bg-mist flex flex-col items-center justify-center">
        <AlertCircle size={64} className="text-red-400 mb-6" />
        <h1 className="font-serif text-3xl text-ink mb-4">Une erreur est survenue</h1>
        <p className="text-ink-muted mb-8 text-center max-w-md">{error}</p>
        <Button onClick={() => fetchResidence(true)} variant="royal" className="px-8 py-3">
          Réessayer
        </Button>
      </main>
    );
  }

  // PRÉPARATION DES DONNÉES SÉCURISÉES

  // Images
  const coverImage = rawImages.find(img => img.is_cover) || rawImages[0];
  const otherImages = rawImages.filter(img => img !== coverImage).slice(0, 4); // Max 4 autres images pour la grille

  // Amenities
  const rawAmenities = Array.isArray(residence.amenities) ? residence.amenities : [];
  const groupedAmenities = rawAmenities.reduce((acc, amenity) => {
    const category = amenity.category || 'Autres';
    if (!acc[category]) acc[category] = [];
    acc[category].push(amenity);
    return acc;
  }, {});

  const txType = residence?.transaction_type || localStorage.getItem(`rk_tx_type_${residence?.id}`) || 'meuble';
  const status = residence?.status || localStorage.getItem(`rk_status_${residence?.id}`) || (residence?.is_active === 0 ? 'reserve' : 'disponible');
  const isAvailable = status === 'disponible';

  const rawPrice = residence?.price_sale || residence?.price_per_night || residence?.price;
  const priceDisplay = residence?.price_display || localStorage.getItem(`rk_price_display_${residence?.id}`) || (residence?.is_price_displayed !== undefined ? (residence?.is_price_displayed ? 'public' : 'on_demand') : (rawPrice ? 'public' : 'on_demand'));
  const isPriceMasked = priceDisplay === 'on_demand' || !rawPrice;

  // Formatage chirurgical de la localisation & Google Maps
  const rawDist = (residence?.district || residence?.location || '').trim().replace(/Macory/gi, 'Marcory');
  const rawAddr = (residence?.address || '').trim().replace(/Macory/gi, 'Marcory');
  const city = (residence?.city || 'Abidjan').trim();

  const district = (!rawDist || rawDist.toLowerCase() === 'abidjan') ? 'Marcory Zone 4' : rawDist;
  const fullAddress = rawAddr 
    ? (rawAddr.toLowerCase().includes(city.toLowerCase()) ? rawAddr : `${rawAddr}, ${city}`)
    : `${district}, ${city}`;
  const mapSearchQuery = encodeURIComponent(`${fullAddress}, Côte d'Ivoire`);
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapSearchQuery}`;
  const embedMapsUrl = `https://maps.google.com/maps?q=${mapSearchQuery}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  // Détection automatique de l'atout prestige majeur
  const getPrestigeHighlight = () => {
    if (residence?.highlight) {
      const hl = residence.highlight.toLowerCase();
      if (hl.includes('piscine') || hl.includes('pool')) return { icon: '🏊‍♂️', text: residence.highlight };
      if (hl.includes('lagune') || hl.includes('vue')) return { icon: '🌅', text: residence.highlight };
      return { icon: '✨', text: residence.highlight };
    }
    if (Array.isArray(residence?.amenities)) {
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
    const textToCheck = `${residence?.name || ''} ${residence?.description || ''} ${residence?.property_type || ''}`.toLowerCase();
    if (textToCheck.includes('piscine') || textToCheck.includes('pool')) return { icon: '🏊‍♂️', text: 'Piscine privée' };
    if (textToCheck.includes('lagune')) return { icon: '🌅', text: 'Vue Lagune' };
    if (textToCheck.includes('penthouse')) return { icon: '🏙️', text: 'Penthouse de prestige' };
    if (textToCheck.includes('jardin')) return { icon: '🌿', text: 'Jardin tropical' };
    return null;
  };

  const prestigeBadge = getPrestigeHighlight();

  return (
    <main className="pt-32 pb-24 min-h-screen bg-mist">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-7xl mx-auto px-6">

        {/* Gallery */}
        <motion.div variants={itemVariants}>
          {rawImages.length === 0 ? (
            <div className="w-full h-[320px] md:h-[450px] bg-gray-200 rounded-xl mb-12 flex items-center justify-center shadow-sm">
              <Images size={48} className="text-gray-400" />
            </div>
          ) : (
            <div className="relative w-full h-[320px] md:h-[450px] mb-12 rounded-xl overflow-hidden shadow-sm">
              <div className="flex h-full gap-2">
                {/* Main Image */}
                <div
                  className="w-full md:w-1/2 h-full relative cursor-pointer group overflow-hidden"
                  onClick={() => openGallery(rawImages.findIndex(img => img === coverImage) || 0)}
                >
                  <img
                    src={getImageUrl(coverImage?.image_url)}
                    alt={`${residence.name} - Vue Principale`}
                    fetchPriority="high"
                    decoding="async"
                    className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${!isAvailable ? 'grayscale-[20%]' : ''}`}
                    onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMAGE; }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />

                  {/* Macaron de Statut Commercial & Type de Transaction */}
                  {status === 'vendu' ? (
                    <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10 bg-night/95 backdrop-blur-md border border-gold/70 px-3.5 sm:px-4 py-1.5 sm:py-2 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.25em] text-gold rounded-full shadow-xl flex items-center gap-2">
                      <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-gold animate-pulse" />
                      DÉJÀ VENDU
                    </div>
                  ) : status === 'loue' ? (
                    <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10 bg-night/90 backdrop-blur-md border border-white/20 px-3.5 sm:px-4 py-1.5 sm:py-2 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-white/90 rounded-full shadow-md">
                      DÉJÀ LOUÉ
                    </div>
                  ) : status === 'reserve' ? (
                    <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10 bg-amber-950/90 backdrop-blur-md border border-amber-400/50 px-3.5 sm:px-4 py-1.5 sm:py-2 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200 rounded-full shadow-md">
                      RÉSERVÉ
                    </div>
                  ) : txType === 'vente' ? (
                    <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10 bg-gold text-night px-3.5 sm:px-4 py-1.5 sm:py-2 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] rounded-full shadow-md font-mono">
                      Acquisition &bull; Vente
                    </div>
                  ) : txType === 'location' ? (
                    <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10 bg-white/95 text-night px-3.5 sm:px-4 py-1.5 sm:py-2 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] rounded-full shadow-md font-mono">
                      Location Longue Durée
                    </div>
                  ) : null}

                  {/* Badge Atout Prestige (Piscine, Vue Lagune, Penthouse) */}
                  {prestigeBadge && (
                    <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 z-10 bg-night/85 backdrop-blur-md border border-white/20 px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-medium tracking-wide text-white rounded-full shadow-lg flex items-center gap-1.5 sm:gap-2 pointer-events-none">
                      <span>{prestigeBadge.icon}</span>
                      <span className="font-sans font-medium">{prestigeBadge.text}</span>
                    </div>
                  )}
                </div>

                {/* Small images wrapper */}
                {otherImages.length > 0 && (
                  <div className="hidden md:grid w-1/2 grid-cols-2 grid-rows-2 gap-2 h-full">
                    {otherImages.slice(0, 4).map((img, index) => {
                      const realIndex = rawImages.findIndex(i => i === img);
                      return (
                        <div
                          key={img.image_url || index}
                          className="relative h-full cursor-pointer group overflow-hidden"
                          onClick={() => openGallery(realIndex)}
                        >
                          <img
                            src={getImageUrl(img.image_url)}
                            alt={`${residence.name} - Vue ${index + 2}`}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMAGE; }}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Bouton afficher tout */}
              <button
                onClick={() => openGallery(0)}
                className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 bg-white/95 hover:bg-white text-ink px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-full shadow-md flex items-center gap-1.5 sm:gap-2 transition-colors z-10 cursor-pointer"
              >
                <Images size={15} />
                Afficher toutes les photos
              </button>
            </div>
          )}
        </motion.div>

        {/* Header block */}
        <div className="mb-10">
          <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div className="font-mono text-[10px] uppercase tracking-widest text-gold font-medium">
              ● {district} • RÉF. {residence.reference}
            </div>
            <nav aria-label="Fil d'Ariane">
              <ol className="flex items-center gap-2 text-[10px] uppercase text-ink-muted">
                <li><Link to="/" className="hover:text-ink transition-colors">ACCUEIL</Link></li>
                <li>/</li>
                <li><Link to="/collection" className="hover:text-ink transition-colors">NOS RÉSIDENCES</Link></li>
                <li>/</li>
                <li><Link to="/collection" className="hover:text-ink transition-colors">{district}</Link></li>
                <li>/</li>
                <li className="text-ink font-bold" aria-current="page">{residence.name}</li>
              </ol>
            </nav>
          </motion.div>
          <motion.div variants={itemVariants}>
            <motion.h1 variants={itemVariants} className="font-serif text-3xl md:text-4xl font-light tracking-wide text-night leading-tight mb-4 text-safe">
              {residence.name}
            </motion.h1>
            <motion.p variants={itemVariants} className="font-serif italic font-light text-ink-muted text-lg flex items-center gap-2 mb-4">
              <MapPin size={18} className="text-gold" />
              {fullAddress}
            </motion.p>
            {!isPriceMasked && rawPrice ? (
              <motion.div variants={itemVariants} className="font-serif text-xl md:text-2xl font-light tracking-wider text-night mt-4 flex items-baseline gap-2">
                <span className="text-[11px] font-sans font-medium text-ink-muted uppercase tracking-[0.2em]">
                  À partir de
                </span>
                <span className="font-medium">
                  {new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(rawPrice)}
                </span>
                <span className="text-[10px] font-sans font-medium text-ink-muted uppercase tracking-[0.2em]">
                  FCFA {txType === 'vente' ? '(Prix de vente)' : txType === 'location' ? '/ mois' : '/ nuit'}
                </span>
              </motion.div>
            ) : (
              <motion.div variants={itemVariants} className="mt-4 flex flex-col gap-1">
                <div className="font-serif text-xl md:text-2xl font-medium text-gold tracking-wide">
                  Tarif sur demande
                </div>
                <p className="text-xs text-ink-muted">
                  Devis personnalisé établi selon vos dates et la durée du séjour
                </p>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-20 items-start">

          {/* Left Column: Sections */}
          <div className="lg:col-span-2">

            {/* Section 01 */}
            <section className="mb-10">
              <motion.div variants={itemVariants} className="font-mono text-[9px] uppercase tracking-[0.3em] text-gold mb-3">01 / PRÉSENTATION</motion.div>
              <motion.h2 variants={itemVariants} className="font-serif text-xl font-light tracking-wide text-night mb-5">Description</motion.h2>
              <motion.div variants={itemVariants} className="font-serif text-lg font-light leading-[2.2] tracking-wide text-ink/80 space-y-6 whitespace-pre-line text-safe">
                {residence.description || "Aucune description détaillée n'est disponible pour cette résidence."}
              </motion.div>
            </section>

            {/* Section 02 */}
            <section className="mb-10 border-t border-black/5 pt-10">
              <motion.div variants={itemVariants} className="font-mono text-[9px] uppercase tracking-[0.3em] text-gold mb-3">02 / LE DOMAINE</motion.div>
              <motion.h2 variants={itemVariants} className="font-serif text-xl font-light tracking-wide text-night mb-5">Équipements & Prestations</motion.h2>
              <motion.p variants={itemVariants} className="font-serif text-[15px] font-light leading-relaxed tracking-wide text-ink/80 mb-8">
                Une sélection exigeante d'équipements et de prestations haut de gamme, pensée pour vous garantir un séjour serein, intime et d'un confort absolu.
              </motion.p>

              {rawAmenities.length === 0 ? (
                <motion.div variants={itemVariants} className="text-ink-muted italic bg-white p-6 border border-gray-100 rounded-sm">
                  Aucune commodité n'est renseignée pour le moment.
                </motion.div>
              ) : (
                <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {Object.entries(groupedAmenities).map(([category, amenities]) => (
                    <motion.div variants={itemVariants} key={category}>
                      <h3 className="font-serif text-lg font-light tracking-wide text-ink mb-2">{category}</h3>
                      <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-muted/50 mb-6 border-b border-black/5 pb-4">
                        SERVICES & DÉTAILS
                      </div>
                      <ul className="space-y-4 text-sm text-ink-muted">
                        {amenities.map(amenity => {
                          const IconComponent = getIconComponent(amenity);
                          return (
                            <li key={amenity.id} className="flex gap-4 items-center group">
                              <div className="p-2 rounded-full bg-mist group-hover:bg-gold/10 transition-colors duration-300">
                                <IconComponent size={14} className="text-gold" aria-hidden="true" />
                              </div>
                              <span className="font-light tracking-wide text-ink/90">{amenity.name}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </section>

            {/* Section Gastronomie & Restauration (Affichée intelligemment si la résidence propose ce service) */}
            <RestaurantMenu residence={residence} itemVariants={itemVariants} />

            {/* Section Emplacement */}
            <section className="border-t border-black/5 pt-10">
              <motion.div variants={itemVariants} className="font-mono text-[9px] uppercase tracking-[0.3em] text-gold mb-3">04 / EMPLACEMENT</motion.div>
              
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4">
                <div>
                  <motion.h2 variants={itemVariants} className="font-serif text-2xl font-light tracking-wide text-night">
                    {district}, {city}
                  </motion.h2>
                  <motion.p variants={itemVariants} className="text-xs font-mono uppercase tracking-widest text-gold mt-1 flex items-center gap-1.5">
                    <MapPin size={13} className="text-gold shrink-0" />
                    <span>{fullAddress}</span>
                  </motion.p>
                </div>

                {/* Bouton direct d'ouverture Google Maps */}
                <motion.a 
                  variants={itemVariants}
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-night text-gold border border-gold/40 hover:border-gold hover:bg-black text-[11px] uppercase tracking-wider font-mono rounded-full transition-all shadow-sm cursor-pointer shrink-0 group self-start sm:self-auto"
                >
                  <span>Ouvrir dans Google Maps</span>
                  <ExternalLink size={13} className="text-gold transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </motion.a>
              </div>

              <motion.p variants={itemVariants} className="font-serif text-[15px] font-light leading-relaxed tracking-wide text-ink/80 mb-6 max-w-2xl">
                Idéalement située à Marcory Zone 4 à Abidjan, la résidence vous accueille dans un cadre exclusif et sécurisé, à proximité immédiate des commodités, des enseignes renommées et des tables gastronomiques de la capitale.
              </motion.p>

              {/* Module Interactif de Carte & Calcul d'Itinéraires (Inspiré Airbnb) */}
              <motion.div variants={itemVariants}>
                <NeighborhoodItineraryMap
                  residence={residence}
                  fullAddress={fullAddress}
                  district={district}
                  city={city}
                />
              </motion.div>
            </section>

          </div>

          {/* Right Column: Sticky Reservation Panel */}
          <motion.div variants={itemVariants} className="lg:col-span-1 hidden lg:block">
            <BookingWidget 
              residence={residence} 
              isModalOpen={isBookingModalOpen} 
              setIsModalOpen={setIsBookingModalOpen} 
            />
          </motion.div>

        </div>
      </motion.div>

      {/* LIGHTBOX MODAL */}
      {isGalleryOpen && rawImages.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md"
          onClick={closeGallery}
        >
          <button
            className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors"
            onClick={closeGallery}
            aria-label="Fermer la galerie"
          >
            <X size={32} />
          </button>

          {rawImages.length > 1 && (
            <button
              className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors p-4"
              onClick={prevImage}
              aria-label="Image précédente"
            >
              <ChevronLeft size={48} strokeWidth={1} />
            </button>
          )}

          <div
            className="relative max-w-7xl mx-auto px-4 w-full flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <img
              key={currentIndex} // Force re-render for basic CSS transition if desired
              src={getImageUrl(rawImages[currentIndex]?.image_url)}
              alt={`${residence.name} - Photo ${currentIndex + 1}`}
              className="max-h-[85vh] w-auto object-contain transition-opacity duration-300"
              onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMAGE; }}
            />
            <div className="absolute bottom-[-2rem] left-1/2 -translate-x-1/2 text-white/60 text-xs tracking-widest">
              {currentIndex + 1} / {rawImages.length}
            </div>
          </div>

          {rawImages.length > 1 && (
            <button
              className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors p-4"
              onClick={nextImage}
              aria-label="Image suivante"
            >
              <ChevronRight size={48} strokeWidth={1} />
            </button>
          )}
        </div>
      )}

      {/* Barre Fixe de Conversion (Mobile — Style onefinestay / Plum Guide) */}
      <div className="block lg:hidden fixed bottom-0 left-0 w-full z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 px-5 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-between gap-3 max-w-lg mx-auto">
          {/* Prix à gauche */}
          <div className="flex flex-col">
            {!isPriceMasked && rawPrice ? (
              <>
                <span className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">À partir de</span>
                <div className="flex items-baseline gap-1">
                  <span className="font-serif text-lg font-bold text-night">
                    {new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(rawPrice)}
                  </span>
                  <span className="text-[10px] text-gray-500 font-medium">FCFA {txType === 'vente' ? '' : txType === 'location' ? '/m' : '/nuit'}</span>
                </div>
              </>
            ) : (
              <span className="font-serif text-sm font-semibold text-gold-dark">
                Tarif sur demande
              </span>
            )}
          </div>

          {/* Boutons d'action à droite */}
          <div className="flex items-center gap-2 shrink-0">
            {/* WhatsApp direct */}
            <a
              href={`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER || '2250710101052'}?text=${encodeURIComponent(
                isPriceMasked
                  ? `Bonjour Rayonne Kelly, je souhaite obtenir un devis personnalisé pour la résidence ${residence?.name} (Réf: ${residence?.reference}). Pouvez-vous me communiquer vos disponibilités et proposition tarifaire ?`
                  : `Bonjour Rayonne Kelly, je souhaite me renseigner sur la résidence ${residence?.name} (Réf: ${residence?.reference})`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-full shadow-sm transition-colors flex items-center justify-center shrink-0"
              aria-label="Contacter sur WhatsApp"
            >
              <MessageCircle size={18} />
            </a>

            {/* Bouton de réservation principale */}
            {status === 'vendu' ? (
              <span className="bg-gray-100 text-gray-400 px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider rounded-full">
                Vendu
              </span>
            ) : status === 'loue' ? (
              <span className="bg-gray-100 text-gray-400 px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider rounded-full">
                Loué
              </span>
            ) : status === 'reserve' ? (
              <button
                type="button"
                onClick={() => {
                  if (!isAuthenticated) {
                    navigate(`/connexion?redirect=${encodeURIComponent(window.location.pathname + '?action=booking')}`);
                  } else {
                    setIsBookingModalOpen(true);
                  }
                }}
                className="bg-amber-400 text-night px-5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-full shadow-sm transition-colors"
              >
                Consulter
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (!isAvailable) return;
                  if (!isAuthenticated) {
                    navigate(`/connexion?redirect=${encodeURIComponent(window.location.pathname + '?action=booking')}`);
                  } else {
                    setIsBookingModalOpen(true);
                  }
                }}
                className="bg-royal hover:bg-royal-dark text-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-full shadow-md transition-colors"
              >
                {txType === 'vente' ? 'Visiter' : isPriceMasked ? 'Devis' : 'Réserver'}
              </button>
            )}
          </div>
        </div>
      </div>

    </main>
  );
}
