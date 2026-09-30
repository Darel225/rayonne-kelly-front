import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, ZoomIn, Images, AlertCircle, Check, Shield, Wifi, Tv, Coffee, Droplets, Wind, Lock, Battery, Thermometer, Zap, Key, Star, ShieldCheck, X, ChevronLeft, ChevronRight } from 'lucide-react';
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

function getIconComponent(iconName) {
  const Icon = iconMap[iconName?.toLowerCase()];
  return Icon || Check;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
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
        <motion.div variants={itemVariants} className="mb-16">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
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
          </div>
          <h1 className="font-serif text-4xl md:text-5xl text-night leading-tight mb-4 text-safe">
            {residence.name}
          </h1>
          <p className="font-serif italic text-ink-muted text-xl md:text-2xl">
            Résidence d'exception à {residence.district}
            {residence.address?.trim() && ` • ${residence.address.trim()}`}
          </p>
        </motion.div>

        {/* Two-column layout */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-20 items-start">

          {/* Left Column: Sections */}
          <div className="lg:col-span-2">

            {/* Section 01 */}
            <section className="mb-16">
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold mb-4">01 / PRÉSENTATION DE LA PROPRIÉTÉ</div>
              <h2 className="font-serif text-2xl text-night mb-6">L'Esprit du Lieu</h2>
              <div className="font-serif text-[1.1rem] leading-[1.8] tracking-wide text-ink/80 space-y-6 whitespace-pre-line text-safe">
                {residence.description || "Aucune description détaillée n'est disponible pour cette résidence."}
              </div>
            </section>

            {/* Section 02 */}
            <section className="mb-16 border-t border-black/5 pt-16">
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold mb-4">02 / PRESTATIONS & COMMODITÉS DU DOMAINE</div>
              <h2 className="font-serif text-2xl text-night mb-6">L'Éloge du Détail & de l'Intendance</h2>
              <p className="font-serif text-[15px] leading-relaxed tracking-wide text-ink/80 mb-10">
                Une infrastructure technique et hôtelière invisible répondant aux exigences des délégations officielles, hauts dignitaires et familles esthètes.
              </p>

              {rawAmenities.length === 0 ? (
                <div className="text-ink-muted italic bg-white p-6 border border-gray-100 rounded-sm">
                  Aucune commodité n'est renseignée pour le moment.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {Object.entries(groupedAmenities).map(([category, amenities]) => (
                    <div key={category}>
                      <h3 className="font-serif text-xl text-ink mb-1">{category}</h3>
                      <div className="font-mono text-[10px] uppercase tracking-widest text-ink-muted mb-4 border-b border-black/5 pb-4">
                        ESPACES DÉDIÉS & SERVICES
                      </div>
                      <ul className="space-y-4 text-sm text-ink-muted">
                        {amenities.map(amenity => {
                          const IconComponent = getIconComponent(amenity.icon_name);
                          return (
                            <li key={amenity.id} className="flex gap-3 items-start">
                              <IconComponent size={16} className="text-gold mt-0.5 shrink-0" aria-hidden="true" />
                              <span>{amenity.name}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Section 03 */}
            <section className="border-t border-black/5 pt-16">
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold mb-4">03 / ENVIRONNEMENT CONFIDENTIEL</div>
              <h2 className="font-serif text-2xl text-night mb-6">{residence.district}</h2>
              <p className="font-serif text-[1.1rem] leading-[1.8] tracking-wide text-ink/80">
                L'adresse cadastrale exacte est exclusivement communiquée à l'hôte lors de la validation diplomatique de la réservation, afin de garantir l'anonymat et l'intimité inviolable du séjour.
              </p>
              <div className="relative w-full h-64 bg-blue-100 rounded-sm mt-8 flex items-center justify-center">
                {/* Map placeholder */}
                <div className="absolute inset-0 opacity-50 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=800&q=80')] bg-cover bg-center" aria-hidden="true"></div>
                <div className="relative z-10 flex flex-col items-center">
                  <div className="bg-ink text-white p-3 rounded-full mb-3 shadow-lg">
                    <MapPin size={24} />
                  </div>
                  <div className="bg-white text-ink text-xs font-semibold px-4 py-2 rounded-full shadow-md text-center max-w-[90%] truncate">
                    {residence.name} • {residence.district}
                  </div>
                </div>
              </div>
            </section>

          </div>

          {/* Right Column: Sticky Reservation Panel */}
          <div className="lg:col-span-1">
            <BookingWidget residence={residence} />
          </div>

        </motion.div>
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

    </main>
  );
}
