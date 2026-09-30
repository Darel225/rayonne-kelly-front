import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import formatPrice from '../../utils/formatPrice';
import { motion } from 'framer-motion';

const premiumEase = [0.22, 1, 0.36, 1];

export default function ResidenceCard({ residence, index, showDescription = true }) {
  if (residence.layout === "split") {
    return (
      <motion.article
        aria-labelledby={`residence-${residence.id}-title`}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className={`flex flex-col md:flex-row items-stretch gap-10 lg:gap-16 ${index % 2 !== 0 ? "md:flex-row-reverse" : ""}`}>

          {/* Image Side */}
          <motion.div
            className="group relative overflow-hidden rounded-[1px] shadow-xl shadow-night/10 w-full md:w-1/2"
            variants={{ hidden: { opacity: 0, x: -80 }, visible: { opacity: 1, x: 0, transition: { duration: 1.2, ease: premiumEase } } }}
          >
            <img
              src={residence.image}
              alt={residence.title || residence.imageAlt} onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80'; e.target.onerror = null; }}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 min-h-[300px]"
            />
            <div className={`absolute bg-night/85 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-white/80 ${index % 2 !== 0 ? "bottom-4 right-4" : "top-4 left-4"}`}>
              {residence.type}
            </div>
          </motion.div>

          {/* Text Side */}
          <motion.div
            className="w-full md:w-1/2 flex flex-col justify-center py-4"
            variants={{ hidden: { opacity: 0, x: 80 }, visible: { opacity: 1, x: 0, transition: { duration: 1.2, ease: premiumEase } } }}
          >
            <div className="mb-3 text-[10px] uppercase tracking-[0.25em] text-gold">
              {residence.city} • RÉF. {residence.ref}
            </div>
            <h3 id={`residence-${residence.id}-title`} className={`font-serif text-2xl md:text-3xl text-night leading-tight text-safe ${showDescription ? 'mb-5' : 'mb-8'}`}>
              {residence.title}
            </h3>
            {showDescription && (
              <p className="mb-6 text-sm leading-relaxed text-ink-muted text-safe">
                {residence.description}
              </p>
            )}

            <dl className="mb-6 border-y border-gray-200 divide-y divide-gray-200">
              {residence.location && (
                <div className="flex justify-between py-2.5">
                  <dt className="text-[10px] uppercase tracking-[0.2em] text-ink-muted">Localisation</dt>
                  <dd className="text-xs text-ink text-right">{residence.location}</dd>
                </div>
              )}
              {residence.guests !== null && (
                <div className="flex justify-between py-2.5">
                  <dt className="text-[10px] uppercase tracking-[0.2em] text-ink-muted">Capacité d'accueil</dt>
                  <dd className="text-xs text-ink text-right">{residence.guests} Voyageurs</dd>
                </div>
              )}
              {residence.rooms !== null && (
                <div className="flex justify-between py-2.5">
                  <dt className="text-[10px] uppercase tracking-[0.2em] text-ink-muted">Pièces</dt>
                  <dd className="text-xs text-ink text-right">{residence.rooms} Pièces</dd>
                </div>
              )}
              {residence.highlight && (
                <div className="flex justify-between py-2.5">
                  <dt className="text-[10px] uppercase tracking-[0.2em] text-ink-muted">Atout / Service</dt>
                  <dd className="text-xs text-ink text-right">{residence.highlight}</dd>
                </div>
              )}
            </dl>

            <div className="mt-auto pt-8 flex items-start justify-start gap-4">
              {/* Prix masqué - Positionnement Premium
              {residence.pricePerNight !== null && (
                <div>
                  <div className="text-[10px] uppercase tracking-[0.15em] text-ink-muted mb-1">TARIFICATIF</div>
                  <div>
                    <span className="font-serif text-3xl text-ink">{formatPrice(residence.pricePerNight)}</span>
                    <span className="ml-1 font-sans text-xs text-ink-muted">/ nuit</span>
                  </div>
                </div>
              )}
              */}
              <Link to={`/collection/${residence.slug}`} className="inline-flex items-center justify-center gap-3 bg-royal px-7 py-3.5 text-[11px] uppercase tracking-[0.2em] text-white transition-colors hover:bg-royal-dark">
                DÉCOUVRIR
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
          </motion.div>
        </div>
      </motion.article>
    );
  }

  // Wide layout (residence 3)
  return (
    <motion.article
      aria-labelledby={`residence-${residence.id}-title`}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={{ hidden: { opacity: 0, y: 50 }, visible: { opacity: 1, y: 0, transition: { duration: 1.2, ease: premiumEase } } }}
    >
      <div className="flex flex-col">
        <div className="text-[10px] uppercase tracking-[0.25em] text-gold text-center mb-3">
          {residence.city} • RÉF. {residence.ref}
        </div>
        <h3 id={`residence-${residence.id}-title`} className="font-serif text-2xl md:text-3xl text-night leading-tight text-center mb-10 text-safe">
          {residence.title}
        </h3>

        <div className="group relative overflow-hidden rounded-[1px] shadow-xl shadow-night/10 w-full aspect-[4/3] md:aspect-[21/9]">
          <img src={residence.image} alt={residence.title || residence.imageAlt} onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80'; e.target.onerror = null; }} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute top-4 left-4 bg-night/85 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-white/80">
            {residence.type}
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-8 md:flex-row md:items-end md:justify-between md:px-12">
          <div className="max-w-xl">
            <p className={`font-serif text-lg text-ink text-safe ${showDescription ? 'mb-2' : ''}`}>{residence.title}</p>
            {showDescription && (
              <p className="text-sm leading-relaxed text-ink-muted text-safe line-clamp-2">
                {residence.description}
              </p>
            )}
          </div>

          <div className="md:border-l md:border-gray-200 md:pl-8 flex flex-col justify-end">
            {/* Prix masqué - Positionnement Premium
            <div>
              <div className="text-[10px] uppercase tracking-[0.15em] text-ink-muted mb-1">TARIFICATIF</div>
              <div>
                <span className="font-serif text-3xl text-ink">{formatPrice(residence.pricePerNight)}</span>
                <span className="ml-1 text-[11px] text-ink-muted">/ nuit</span>
              </div>
            </div>
            */}
            <div className="text-[10px] uppercase tracking-[0.2em] text-ink-muted mb-4 md:mb-5">
              {residence.highlight}
            </div>
            <Link to={`/collection/${residence.slug}`} className="inline-flex items-center justify-center gap-3 bg-royal px-7 py-3.5 text-[11px] uppercase tracking-[0.2em] text-white transition-colors hover:bg-royal-dark">
              DÉCOUVRIR
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
