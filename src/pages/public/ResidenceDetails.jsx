import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, ZoomIn, Images, AlertCircle, Check, Shield, Wifi, Tv, Coffee, Droplets, Wind, Lock, Battery, Thermometer, Zap, Key, Star, ShieldCheck, X, ChevronLeft, ChevronRight, MessageCircle, Phone } from 'lucide-react';
import Button from '../../components/common/Button';
import api from '../../services/api';
import { getImageUrl, FALLBACK_IMAGE } from '../../utils/getImageUrl';
import BookingWidget from '../../components/residence/BookingWidget';

// Mapping des icônes pour les commodités
const iconMap = {
  'shield': Shield,
  'wifi': Wifi,
  'tv': Tv,
  'coffee': Coffee,
  'droplets': Droplets,
  'wind': Wind,
  'lock': Lock,
  'battery': Battery,
  'thermometer': Thermometer,
  'zap': Zap,
  'key': Key,
  'star': Star,
  'shield-check': ShieldCheck,
};

function getIconComponent(amenity) {
  if (amenity?.icon_name) {
    return iconMap[amenity.icon_name.toLowerCase()] || Check;
  }
  const name = amenity?.name?.toLowerCase() || '';
  if (name.includes('wifi') || name.includes('internet')) return Wifi;
  if (name.includes('tv') || name.includes('télé')) return Tv;
  if (name.includes('piscine') || name.includes('eau') || name.includes('jacuzzi')) return Droplets;
  if (name.includes('clim') || name.includes('air')) return Wind;
  if (name.includes('sécurité') || name.includes('gardien') || name.includes('alarme')) return Shield;
  if (name.includes('café') || name.includes('thé') || name.includes('nespresso')) return Coffee;
  if (name.includes('serrure') || name.includes('coffre')) return Lock;
  if (name.includes('énergie') || name.includes('groupe') || name.includes('générateur')) return Zap;
  return Check;
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
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMAGE; }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
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
                className="absolute bottom-6 right-6 bg-white hover:bg-gray-50 text-ink px-4 py-2 text-sm font-semibold rounded-lg shadow-md flex items-center gap-2 transition-colors z-10"
              >
                <Images size={16} />
                Afficher toutes les photos
              </button>
            </div>
          )}
        </motion.div>

        {/* Header block */}
        <div className="mb-10">
          <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div className="font-mono text-[10px] uppercase tracking-widest text-gold font-medium">
              ● {residence.district} • RÉF. {residence.reference}
            </div>
            <nav aria-label="Fil d'Ariane">
              <ol className="flex items-center gap-2 text-[10px] uppercase text-ink-muted">
                <li><Link to="/" className="hover:text-ink transition-colors">ACCUEIL</Link></li>
                <li>/</li>
                <li><Link to="/collection" className="hover:text-ink transition-colors">NOS RÉSIDENCES</Link></li>
                <li>/</li>
                <li><Link to="/collection" className="hover:text-ink transition-colors">{residence.district}</Link></li>
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
              {residence.address ? `${residence.address}, ` : ''}{residence.district}
            </motion.p>
            {residence.price_per_night && (
              <motion.div variants={itemVariants} className="font-serif text-xl md:text-2xl font-light tracking-wider text-night mt-4 flex items-baseline gap-2">
                {new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(residence.price_per_night)}
                <span className="text-[10px] font-sans font-medium text-ink-muted uppercase tracking-[0.2em]">FCFA / nuit</span>
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
                Une infrastructure technique et hôtelière invisible répondant aux exigences des délégations officielles, hauts dignitaires et familles esthètes.
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

            {/* Section 03 */}
            <section className="border-t border-black/5 pt-10">
              <motion.div variants={itemVariants} className="font-mono text-[9px] uppercase tracking-[0.3em] text-gold mb-3">03 / EMPLACEMENT</motion.div>
              <motion.h2 variants={itemVariants} className="font-serif text-xl font-light tracking-wide text-night mb-5">{residence.district}</motion.h2>
              <motion.p variants={itemVariants} className="font-serif text-[15px] font-light leading-relaxed tracking-wide text-ink/80 mb-8">
                L'adresse cadastrale exacte est exclusivement communiquée à l'hôte lors de la validation diplomatique de la réservation, afin de garantir l'anonymat et l'intimité inviolable du séjour.
              </motion.p>
              <motion.div variants={itemVariants} className="relative w-full h-80 bg-[#FAFAF8] rounded-sm flex items-center justify-center overflow-hidden border border-black/5 group cursor-default">
                {/* Image de fond topographique abstraite (très douce/luxe) */}
                <div
                  className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center transition-transform duration-1000 group-hover:scale-105"
                  style={{ filter: 'grayscale(100%) opacity(20%) sepia(30%) hue-rotate(5deg)' }}
                  aria-hidden="true"
                ></div>

                {/* Overlay pour lisser et donner cet aspect papier/ivoire luxueux */}
                <div className="absolute inset-0 bg-white/40"></div>

                <div className="relative z-10 flex flex-col items-center">
                  {/* Marqueur doré de prestige */}
                  <div className="relative flex h-12 w-12 items-center justify-center mb-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C9A96E] opacity-30"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-[#C9A96E] border-2 border-white shadow-lg"></span>
                  </div>

                  {/* Badge de localisation */}
                  <div className="bg-white/90 backdrop-blur-md text-ink text-[10px] font-semibold tracking-[0.2em] uppercase px-6 py-3 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.05)] border border-black/5 text-center flex items-center gap-2">
                    <MapPin size={12} className="text-gold" />
                    {residence.district}
                  </div>
                </div>
              </motion.div>
            </section>

          </div>

          {/* Right Column: Sticky Reservation Panel */}
          <motion.div variants={itemVariants} className="lg:col-span-1 hidden lg:block">
            <BookingWidget residence={residence} />
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

      {/* Barre Fixe de Conversion (Mobile) */}
      <div className="block lg:hidden fixed bottom-0 left-0 w-full z-50 bg-white border-t border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <a
          href={`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER || '2250710101052'}?text=Bonjour, je souhaite me renseigner sur la résidence ${residence.name} (Réf: ${residence.reference})`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center bg-[#25D366] px-6 py-4 text-xs font-semibold uppercase tracking-widest text-white transition-colors hover:bg-[#128C7E] rounded-sm gap-2"
        >
          <MessageCircle size={16} />
          Réserver sur WhatsApp
        </a>
      </div>

    </main>
  );
}
