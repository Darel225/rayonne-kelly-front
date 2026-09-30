import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Phone, ChevronLeft, ChevronRight, AlertCircle, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';
import { amenityOptions, statusLabels } from '../../data/mockResidences';
import FilterBar from '../../components/public/FilterBar';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { getImageUrl, FALLBACK_IMAGE } from '../../utils/getImageUrl';
import ResidenceCard from '../../components/public/ResidenceCard';

const PAGE_SIZE = 6;
const DEFAULT_FILTERS = { area: "", minGuests: 0, minPrice: 0, amenities: [] };

function applyFilters(list, f) {
  return list.filter(r => {
    if (f.area && r.district !== f.area) return false;
    if (r.max_guests !== null && r.max_guests < f.minGuests) return false;
    if (r.price_per_night !== null && r.price_per_night < f.minPrice) return false;
    if (f.amenities && f.amenities.length > 0) {
      const residenceAmenityNames = (r.amenities || []).map(a => typeof a === 'string' ? a : a.name);
      const hasAllAmenities = f.amenities.every(amenity =>
        residenceAmenityNames.includes(amenity)
      );
      if (!hasAllAmenities) return false;
    }
    return true;
  });
}




function StandardCard({ r }) {
  const imageUrl = getImageUrl(r.cover_image_url);
  const premiumEase = [0.22, 1, 0.36, 1];
  return (
    <article aria-labelledby={`c-${r.id || r.slug}-title`} className="flex flex-col h-full">
      <motion.div
        className="group relative aspect-[16/10] overflow-hidden shadow-xl shadow-night/10 bg-gray-200"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1.2, ease: premiumEase }}
      >
        <img
          src={imageUrl}
          alt={r.name}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMAGE; }}
        />
        <div className="absolute left-4 top-4 bg-night/85 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-white/80">
          {r.status ? statusLabels[r.status] : 'Disponible'}
        </div>
      </motion.div>
      <motion.div
        className="mt-6 flex flex-col flex-grow"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1.2, ease: premiumEase, delay: 0.1 }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id={`c-${r.id || r.slug}-title`} className="font-serif text-xl text-ink mb-1 text-safe">{r.name}</h2>
            <div className="text-[10px] uppercase tracking-[0.25em] text-gold">
              {r.district} • RÉF. {r.reference}
            </div>
          </div>
          {/* Prix masqué - Positionnement Premium
          <div className="text-right whitespace-nowrap">
            <span className="font-serif text-lg text-ink">{new Intl.NumberFormat('fr-FR').format(r.price_per_night)}</span>
            <span className="ml-1 text-xs text-ink-muted">FCFA</span>
          </div>
          */}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-ink-muted line-clamp-3 text-safe">
          {r.description}
        </p>
        <div className="mt-auto flex items-center justify-between border-t border-gray-200 pt-4">
          <div className="text-[11px] text-ink-muted">
            {r.rooms_count} Pièces • {r.max_guests} Voyageurs
          </div>
          <Link to={`/collection/${r.slug || r.id}`} className="inline-flex items-center justify-center gap-3 bg-royal px-5 py-2.5 text-[11px] uppercase tracking-[0.2em] text-white transition-colors hover:bg-royal-dark">
            DÉCOUVRIR
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
      </motion.div>
    </article>
  );
}

function DarkCard({ r }) {
  const imageUrl = getImageUrl(r.cover_image_url);
  const premiumEase = [0.22, 1, 0.36, 1];
  return (
    <article aria-labelledby={`c-${r.id || r.slug}-title`} className="md:col-span-2 grid grid-cols-1 overflow-hidden rounded-sm bg-night text-white md:grid-cols-[11fr_9fr]">
      <motion.div
        className="group h-full min-h-[260px] bg-gray-800 overflow-hidden"
        initial={{ opacity: 0, x: -30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1.2, ease: premiumEase }}
      >
        <img
          src={imageUrl}
          alt={r.name}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMAGE; }}
        />
      </motion.div>
      <motion.div
        className="flex flex-col justify-center gap-6 p-8 md:p-12"
        initial={{ opacity: 0, x: 30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1.2, ease: premiumEase }}
      >
        <div className="text-[10px] uppercase tracking-[0.25em] text-gold">
          <span className="mr-3 inline-block h-px w-6 bg-white/40 align-middle" />
          {r.district} • RÉF. {r.reference}
        </div>
        <h2 id={`c-${r.id || r.slug}-title`} className="font-serif text-3xl md:text-4xl text-white text-safe">
          {r.name}
        </h2>
        <p className="text-xs leading-relaxed text-white/60 line-clamp-3 text-safe">
          {r.description}
        </p>
        <div className="border-y border-white/10 py-4">
          <div className="text-[10px] uppercase tracking-[0.15em] text-white/40 mb-1">CONFIGURATION</div>
          <div className="text-sm font-medium">{r.rooms_count} Pièces & {r.max_guests} Voyageurs</div>
        </div>
        <div className="mt-2 flex items-end justify-end gap-4">
          {/* Prix masqué - Positionnement Premium
          <div>
            <div className="text-[10px] uppercase tracking-[0.15em] text-white/40 mb-1">Tarif de location</div>
            <div>
              <span className="font-serif text-3xl text-white">{new Intl.NumberFormat('fr-FR').format(r.price_per_night)}</span>
              <span className="ml-1 font-sans text-xs text-white/60">FCFA / nuit</span>
            </div>
          </div>
          */}
          <Link to={`/collection/${r.slug || r.id}`} className="border border-white/30 px-7 py-3.5 text-[11px] uppercase tracking-[0.2em] text-white hover:bg-white hover:text-night transition-colors">
            DÉCOUVRIR
          </Link>
        </div>
      </motion.div>
    </article>
  );
}

function SkeletonCard() {
  return (
    <div className="flex flex-col animate-pulse" aria-hidden="true">
      <div className="relative aspect-[16/10] overflow-hidden bg-gray-200 shadow-xl shadow-night/10 rounded-sm"></div>
      <div className="mt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="w-1/2">
            <div className="h-6 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
          <div className="w-1/4 text-right">
            <div className="h-5 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className="mt-4 h-3 bg-gray-200 rounded w-full"></div>
        <div className="mt-2 h-3 bg-gray-200 rounded w-5/6"></div>
        <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    </div>
  );
}

export default function Collection() {
  const [residences, setResidences] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);

  const [isCustomRequestModalOpen, setIsCustomRequestModalOpen] = useState(false);
  const [customRequestForm, setCustomRequestForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    budget: '',
    preferred_location: '',
    criteria: ''
  });
  const [isSubmittingCustomRequest, setIsSubmittingCustomRequest] = useState(false);

  const handleCustomRequestSubmit = async (e) => {
    e.preventDefault();
    if (!customRequestForm.full_name || !customRequestForm.phone) {
      toast.error("Veuillez renseigner votre nom et votre numéro de téléphone.");
      return;
    }

    setIsSubmittingCustomRequest(true);
    try {
      await api.post('/custom-requests', customRequestForm);
      setIsCustomRequestModalOpen(false);
      toast.success("Votre demande a été transmise à notre conciergerie, nous vous recontacterons sous 24h.");
      setCustomRequestForm({ full_name: '', phone: '', email: '', budget: '', preferred_location: '', criteria: '' });
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || err.response?.data?.message || "Une erreur est survenue lors de l'envoi de votre demande.");
    } finally {
      setIsSubmittingCustomRequest(false);
    }
  };

  const fetchResidences = async (isMounted) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/residences');
      const data = Array.isArray(response) ? response : (response.data || []);
      if (isMounted) setResidences(data);
    } catch (err) {
      console.error(err);
      if (isMounted) setError("Impossible de charger le catalogue des résidences pour le moment.");
    } finally {
      if (isMounted) setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    fetchResidences(isMounted);
    return () => {
      isMounted = false;
    };
  }, []);

  const handleFilterChange = (next) => {
    setFilters(next);
    setPage(1);
  };

  const areaOptions = useMemo(() => {
    return [...new Set(residences.map(r => r.district).filter(Boolean))];
  }, [residences]);

  const results = useMemo(() => applyFilters(residences, filters), [residences, filters]);
  const totalPages = Math.ceil(results.length / PAGE_SIZE);
  const currentSlice = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const startIdx = (page - 1) * PAGE_SIZE + 1;
  const endIdx = Math.min(page * PAGE_SIZE, results.length);

  const PATTERN = ["hero", "standard", "standard", "dark", "standard", "standard"];

  return (
    <div className="pb-24 pt-24 md:pt-28">
      {/* Header & Filter */}
      <motion.div
        className="mx-auto max-w-7xl px-6 pt-8 md:pt-12"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="text-[10px] uppercase tracking-[0.25em] text-gold mb-4 flex items-center gap-2">
          <span className="h-px w-8 bg-gold/60" aria-hidden="true" />
          PORTFOLIO 2026
        </div>
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between mb-10">
          <div>
            <h1 className="font-serif text-3xl md:text-4xl text-night leading-tight mb-4">
              Notre Collection
              <span className="block italic">de Résidences</span>
            </h1>
            <p className="text-sm text-night/70 max-w-lg">
              Explorez nos appartements et villas d'exception disponibles à la location pour vos séjours à Abidjan.
            </p>
          </div>
          <div className="md:text-right">
            {!isLoading && !error && (
              <>
                <div className="text-sm font-semibold text-night">
                  {results.length} Résidence{results.length !== 1 ? 's' : ''}
                </div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-night/50 mt-1">
                  SÉLECTION EXCLUSIVE
                </div>
              </>
            )}
          </div>
        </div>

        <FilterBar
          filters={filters}
          onChange={handleFilterChange}
          areaOptions={areaOptions}
          amenityOptions={amenityOptions}
        />

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 gap-x-8 gap-y-20 md:grid-cols-2 mt-12" aria-busy="true" aria-live="polite">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="py-20 text-center flex flex-col items-center border border-red-100 bg-red-50/50 rounded-sm" role="alert">
            <AlertCircle size={40} className="text-red-400 mb-4" />
            <p className="text-ink mb-6">{error}</p>
            <Button onClick={() => fetchResidences(true)} variant="royal" className="px-8 py-3 text-xs uppercase tracking-widest">
              Réessayer
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && results.length === 0 && (
          <div className="py-20 text-center border border-gray-100 bg-white shadow-sm rounded-sm">
            <p className="text-ink-muted mb-6">Aucune résidence disponible pour le moment.</p>
            <button
              onClick={() => handleFilterChange(DEFAULT_FILTERS)}
              className="inline-flex border border-gray-300 px-6 py-2.5 text-xs text-ink hover:border-royal hover:text-royal transition-colors rounded-sm focus:outline-none focus:ring-2 focus:ring-royal focus:ring-offset-2"
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}

        {/* Results Grid */}
        {!isLoading && !error && results.length > 0 && (
          <div className="grid grid-cols-1 gap-x-8 gap-y-16 md:gap-y-20 md:grid-cols-2 pt-16 md:pt-24 pb-24">
            {currentSlice.map((r, index) => {
              const variant = PATTERN[index % 6];
              const key = r.id || r.slug || index;
              if (variant === "hero") {
                return (
                  <div key={key} className="md:col-span-2 w-full">
                    <ResidenceCard
                      residence={{
                        id: r.id,
                        slug: r.slug,
                        title: r.name,
                        type: r.property_type || "Résidence",
                        city: "ABIDJAN",
                        ref: r.reference || "",
                        description: r.description,
                        location: r.district,
                        guests: r.max_guests,
                        rooms: r.rooms_count,
                        highlight: r.amenities?.[0]?.name || "Prestations haut de gamme",
                        pricePerNight: r.price_per_night ? Number(r.price_per_night) : null,
                        image: getImageUrl(r.cover_image_url),
                        layout: "split"
                      }}
                      index={index}
                      showDescription={false}
                    />
                  </div>
                );
              }
              if (variant === "dark") return <DarkCard key={key} r={r} />;
              return <StandardCard key={key} r={r} />;
            })}
          </div>
        )}

        {/* Pagination Line */}
        {!isLoading && !error && results.length > 0 && (
          <div className="mt-16 mb-24 flex flex-col md:flex-row justify-between items-center text-sm border-t border-gray-100 pt-8">
            <div className="text-ink-muted">
              Affichage de <span className="font-semibold text-ink">{startIdx}</span> à <span className="font-semibold text-ink">{endIdx}</span> sur <span className="font-semibold text-ink">{results.length}</span> résidences d'exception
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-2 mt-4 md:mt-0">
                <button
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  disabled={page === 1}
                  className="w-8 h-8 flex items-center justify-center border border-gray-200 text-ink text-xs rounded-sm hover:border-gold transition-colors disabled:opacity-50 disabled:hover:border-gray-200"
                  aria-label="Page précédente"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="text-ink-muted font-medium mx-2">{page} / {totalPages}</span>
                <button
                  onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={page === totalPages}
                  className="w-8 h-8 flex items-center justify-center border border-gray-200 text-ink text-xs rounded-sm hover:border-gold transition-colors disabled:opacity-50 disabled:hover:border-gray-200"
                  aria-label="Page suivante"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* CTA banner */}
      <motion.div 
        className="mx-auto max-w-5xl px-6 mt-20 mb-12"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="bg-gradient-to-br from-night via-night to-[#4B6382] rounded-xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-10 shadow-2xl transition-transform duration-700 ease-out hover:scale-[1.02]">
          <div className="w-full md:w-3/5">
            <span className="inline-block bg-white/10 border border-white/20 text-white text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-full mb-5">
              • SERVICE SUR-MESURE
            </span>
            <h2 className="font-serif text-2xl md:text-4xl text-white leading-tight mb-4">
              Vous recherchez une résidence confidentielle hors catalogue ?
            </h2>
            <p className="text-white/70 text-xs max-w-md leading-relaxed">
              Certaines de nos propriétés les plus exclusives à Abidjan sont réservées à notre clientèle privée. Confiez vos critères stricts à notre service de conciergerie.
            </p>
          </div>
          <div className="w-full md:w-2/5 flex flex-col gap-3">
            <button 
              onClick={() => setIsCustomRequestModalOpen(true)}
              className="w-full flex items-center justify-center bg-royal px-6 py-3.5 text-[11px] font-medium uppercase tracking-widest text-white transition-colors hover:bg-royal-dark rounded-md"
            >
              RECHERCHE SUR-MESURE
            </button>
            <a 
              href="tel:+2250710101052 "
              className="w-full flex items-center justify-center border border-white/30 px-6 py-3.5 text-[11px] font-medium uppercase tracking-widest text-white transition-colors hover:bg-white/10 hover:border-white rounded-md"
            >
              <Phone size={14} className="mr-2" aria-hidden="true" />
              LIGNE DIRECTE CONCIERGERIE
            </a>
          </div>
        </div>
      </motion.div>

      {isCustomRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => !isSubmittingCustomRequest && setIsCustomRequestModalOpen(false)}></div>
          <div className="relative bg-white p-8 max-w-md w-full shadow-2xl">
            <button
              onClick={() => setIsCustomRequestModalOpen(false)}
              disabled={isSubmittingCustomRequest}
              className="absolute top-4 right-4 text-ink-muted hover:text-ink disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="font-mono text-[10px] uppercase tracking-widest text-gold mb-2">
              Service Exclusif
            </div>
            <h3 className="font-serif text-2xl text-ink mb-6">Recherche sur-mesure</h3>

            <form onSubmit={handleCustomRequestSubmit} className="space-y-4">
              <Input
                id="cr_fullname"
                label="Nom complet *"
                value={customRequestForm.full_name}
                onChange={(e) => setCustomRequestForm({ ...customRequestForm, full_name: e.target.value })}
                required
              />
              <Input
                id="cr_phone"
                label="Téléphone *"
                type="tel"
                value={customRequestForm.phone}
                onChange={(e) => setCustomRequestForm({ ...customRequestForm, phone: e.target.value })}
                required
              />
              <Input
                id="cr_email"
                label="Email (optionnel)"
                type="email"
                value={customRequestForm.email}
                onChange={(e) => setCustomRequestForm({ ...customRequestForm, email: e.target.value })}
              />
              <Input
                id="cr_budget"
                label="Budget (optionnel, ex: 500k-800k FCFA/nuit)"
                value={customRequestForm.budget}
                onChange={(e) => setCustomRequestForm({ ...customRequestForm, budget: e.target.value })}
              />
              <Input
                id="cr_location"
                label="Quartier souhaité (optionnel)"
                value={customRequestForm.preferred_location}
                onChange={(e) => setCustomRequestForm({ ...customRequestForm, preferred_location: e.target.value })}
              />

              <div>
                <label htmlFor="cr_criteria" className="block font-mono text-[10px] uppercase tracking-[0.2em] text-ink-muted mb-2">
                  Critères spécifiques (optionnel)
                </label>
                <textarea
                  id="cr_criteria"
                  rows="3"
                  className="w-full bg-white border-0 border-b border-ink/30 px-4 py-3 text-ink focus:outline-none focus:border-royal focus-visible:ring-1 ring-royal/30 transition-colors resize-none"
                  value={customRequestForm.criteria}
                  onChange={(e) => setCustomRequestForm({ ...customRequestForm, criteria: e.target.value })}
                ></textarea>
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full flex justify-center items-center gap-2"
                  disabled={isSubmittingCustomRequest}
                >
                  {isSubmittingCustomRequest ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Transmission...</>
                  ) : "Transmettre à la conciergerie"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

