import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Home, Car, ExternalLink, X } from 'lucide-react';

// Destinations de référence pour le matching intelligent de recherche
const PRESET_DESTINATIONS = [
  {
    id: 'palais-culture',
    name: 'Palais de la Culture Amadou Hampâté Bâ',
    category: 'Arts & Spectacles',
    query: 'Palais de la Culture, Treichville, Abidjan',
    duration: '10 min',
    distance: '5.2 km',
    image: 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=600&q=80',
    description: 'Le haut lieu de la culture et des grands spectacles ivoiriens, situé en bordure de lagune à Treichville.'
  },
  {
    id: 'aeroport-fhb',
    name: 'Aéroport International Félix-Houphouët-Boigny',
    category: 'Aéroport & Départs',
    query: 'Aéroport International Félix-Houphouët-Boigny, Port-Bouët, Abidjan',
    duration: '12 min',
    distance: '8.7 km',
    image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=600&q=80',
    description: 'Liaison express directe depuis Marcory Zone 4 via le Boulevard Valéry Giscard d’Estaing (VGE).'
  },
  {
    id: 'le-plateau',
    name: 'Le Plateau (Cœur des Affaires & Sièges)',
    category: 'Centre d’Affaires & Ambassades',
    query: 'Le Plateau, Abidjan',
    duration: '8 min',
    distance: '6.4 km',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80',
    description: 'Accès ultra-rapide au quartier des tours ministérielles et institutions financières via le Pont HKB.'
  },
  {
    id: 'prima-center',
    name: 'Prima Center & Boutiques Zone 4',
    category: 'Shopping & Gastronomie',
    query: 'Prima Center, Marcory Zone 4, Abidjan',
    duration: '3 min',
    distance: '1.2 km',
    image: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=600&q=80',
    description: 'Le centre commercial et d’art de vivre le plus raffiné d’Abidjan Sud, avec supermarché gourmet et enseignes.'
  },
  {
    id: 'bassam-plages',
    name: 'Plages Historiques de Grand-Bassam',
    category: 'Escapade Océane',
    query: 'Grand-Bassam, Côte d’Ivoire',
    duration: '25 min',
    distance: '28 km',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
    description: 'Ville historique classée UNESCO et stations balnéaires facilement accessibles par l’autoroute de Bassam.'
  }
];

export default function NeighborhoodItineraryMap({ residence, fullAddress, district, city }) {
  const originAddress = useMemo(() => {
    return fullAddress || `${district || 'Marcory Zone 4'}, ${city || 'Abidjan'}, Côte d'Ivoire`;
  }, [fullAddress, district, city]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDestination, setSelectedDestination] = useState(null);

  // URL de l'iframe Google Maps selon le mode : Route tracée ou Vue centrée sur la résidence
  const mapIframeUrl = useMemo(() => {
    const originEncoded = encodeURIComponent(originAddress);
    if (selectedDestination) {
      const destEncoded = encodeURIComponent(selectedDestination.query || selectedDestination.name);
      return `https://maps.google.com/maps?saddr=${originEncoded}&daddr=${destEncoded}&output=embed`;
    }
    return `https://maps.google.com/maps?q=${originEncoded}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  }, [originAddress, selectedDestination]);

  // URL Google Maps externe pour GPS / itinéraire réel sur smartphone
  const externalMapsUrl = useMemo(() => {
    const originEncoded = encodeURIComponent(originAddress);
    if (selectedDestination) {
      const destEncoded = encodeURIComponent(selectedDestination.query || selectedDestination.name);
      return `https://www.google.com/maps/dir/?api=1&origin=${originEncoded}&destination=${destEncoded}&travelmode=driving`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${originEncoded}`;
  }, [originAddress, selectedDestination]);

  const handleCustomSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Vérifier si la recherche correspond à une destination connue
    const match = PRESET_DESTINATIONS.find(d => 
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      d.query.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (match) {
      setSelectedDestination(match);
    } else {
      setSelectedDestination({
        id: 'custom-' + Date.now(),
        name: searchQuery.trim(),
        category: 'Destination personnalisée',
        query: `${searchQuery.trim()}, Abidjan, Côte d'Ivoire`,
        duration: 'Itinéraire calculé',
        distance: 'Direct',
        image: null,
        description: `Trajet calculé depuis la résidence (${district || 'Marcory Zone 4'}) vers ${searchQuery.trim()}.`
      });
    }
  };

  const handleClearDestination = () => {
    setSelectedDestination(null);
    setSearchQuery('');
  };

  return (
    <div className="relative">
      {/* Conteneur principal de la Carte (hauteur compacte et bords doux) */}
      <div 
        className="relative w-full h-[340px] sm:h-[380px] md:h-[410px] rounded-2xl sm:rounded-3xl overflow-hidden border border-black/10 shadow-[0_12px_36px_rgba(0,0,0,0.06)] bg-[#FAFAF8] isolate transform-gpu"
        style={{ borderRadius: '1.5rem', WebkitMaskImage: '-webkit-radial-gradient(white, black)' }}
      >
        {/* Iframe Google Maps */}
        <iframe
          key={mapIframeUrl}
          title={`Itinéraire depuis ${originAddress}`}
          width="100%"
          height="100%"
          style={{ border: 0, borderRadius: '1.5rem' }}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          src={mapIframeUrl}
          className="w-full h-full filter saturate-[0.95] contrast-[1.02]"
        />

        {/* Pin Signature Maison au centre de la carte (Style Airbnb - Vue Résidence) */}
        {!selectedDestination && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="flex flex-col items-center -translate-y-4">
              <div className="relative flex items-center justify-center">
                <span className="animate-ping absolute inline-flex h-12 w-12 rounded-full bg-gold opacity-30"></span>
                <div className="relative w-10 h-10 rounded-full bg-night border-2 border-gold text-gold shadow-[0_10px_25px_rgba(0,0,0,0.3)] flex items-center justify-center">
                  <Home size={17} className="text-gold" />
                </div>
              </div>
              <div className="mt-1.5 bg-night/90 backdrop-blur-md text-white text-[9px] font-mono uppercase tracking-[0.2em] px-3 py-1 rounded-full border border-gold/40 shadow-lg">
                {district || 'Marcory Zone 4'}
              </div>
            </div>
          </div>
        )}

        {/* Barre de Recherche Flottante (Style Airbnb dans la carte) */}
        <div className="absolute top-4 left-4 right-4 sm:right-auto sm:w-80 md:w-88 z-20">
          <form 
            onSubmit={handleCustomSearchSubmit}
            className="bg-white/95 backdrop-blur-md rounded-full shadow-[0_8px_25px_rgba(0,0,0,0.12)] border border-black/10 flex items-center px-4 py-2 gap-2 transition-all focus-within:ring-2 focus-within:ring-gold/50"
          >
            <Search size={14} className="text-gold shrink-0" />
            <input
              type="text"
              placeholder="Où voulez-vous aller ?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs text-ink placeholder:text-ink-muted/70 focus:outline-none font-sans"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearDestination}
                className="text-ink-muted hover:text-ink p-1 rounded-full transition-colors"
                title="Effacer"
              >
                <X size={13} />
              </button>
            )}
            <button
              type="submit"
              className="bg-night text-gold px-3 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-wider hover:bg-black transition-colors shrink-0 shadow-sm"
            >
              Tracer
            </button>
          </form>
        </div>

        {/* Badge Lieu de Départ avec Icône Maison (Haut Droite) */}
        <div className="absolute top-4 right-4 z-10 pointer-events-none hidden sm:block">
          <div className="bg-night/95 backdrop-blur-md text-gold text-[10px] font-semibold tracking-[0.18em] uppercase px-3.5 py-1.5 rounded-full shadow-lg border border-gold/40 flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gold/20 flex items-center justify-center text-gold shrink-0">
              <Home size={10} className="text-gold" />
            </div>
            <span className="font-mono text-white/95 text-[10px]">
              Départ : {district || 'Marcory Zone 4'}
            </span>
          </div>
        </div>

        {/* Fiche Flottante Interactive Destination (Style Airbnb au tracé) */}
        <AnimatePresence>
          {selectedDestination && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.97 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="absolute bottom-3 left-3 right-3 sm:right-auto sm:w-80 md:w-88 z-20"
            >
              <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3.5 shadow-[0_12px_36px_rgba(0,0,0,0.16)] border border-black/10 space-y-2.5">
                
                {/* Image & Catégorie */}
                {selectedDestination.image && (
                  <div className="relative w-full h-24 rounded-xl overflow-hidden bg-black/5">
                    <img
                      src={selectedDestination.image}
                      alt={selectedDestination.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-night/90 backdrop-blur-sm text-gold px-2 py-0.5 rounded-full text-[8px] font-mono uppercase tracking-widest border border-gold/30">
                      {selectedDestination.category}
                    </div>
                    <button
                      type="button"
                      onClick={handleClearDestination}
                      className="absolute top-2 right-2 bg-black/60 hover:bg-black text-white p-1 rounded-full transition-colors"
                      aria-label="Fermer"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}

                {/* Titre & Reset */}
                {!selectedDestination.image && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="bg-night/90 text-gold px-2 py-0.5 rounded-full text-[8px] font-mono uppercase tracking-widest border border-gold/30">
                      {selectedDestination.category}
                    </span>
                    <button
                      type="button"
                      onClick={handleClearDestination}
                      className="text-ink-muted hover:text-ink p-1 rounded-full transition-colors"
                    >
                      <X size={13} />
                    </button>
                  </div>
                )}

                <div>
                  <h3 className="font-serif text-sm font-light text-night leading-snug">
                    {selectedDestination.name}
                  </h3>
                </div>

                {/* Trajet & GPS */}
                <div className="pt-2 border-t border-black/5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gold/15 text-night font-mono text-[10px] font-semibold">
                      <Car size={11} className="text-gold" />
                      <span>{selectedDestination.duration}</span>
                    </span>
                    {selectedDestination.distance && (
                      <span className="text-[9px] font-mono text-ink-muted">
                        ({selectedDestination.distance})
                      </span>
                    )}
                  </div>

                  <a
                    href={externalMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-night text-gold hover:bg-black rounded-full text-[9px] font-mono uppercase tracking-wider transition-colors shrink-0 shadow-sm"
                  >
                    <span>Itinéraire GPS</span>
                    <ExternalLink size={10} className="text-gold" />
                  </a>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
