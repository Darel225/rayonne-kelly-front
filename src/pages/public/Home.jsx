import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Waves, Building2, Sofa, ShieldCheck, Key, Star } from 'lucide-react';
import Hero from '../../components/public/Hero';
import SearchBar from '../../components/public/SearchBar';
import ResidenceCard from '../../components/public/ResidenceCard';
import api from '../../services/api';
import CorporateRequestModal from '../../components/public/CorporateRequestModal';

const fadeUpVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
  }
};

const CATEGORIES = [
  { id: 'tous', label: 'Toutes nos résidences', icon: Sparkles },
  { id: 'villas', label: 'Villas avec Piscine', icon: Waves },
  { id: 'penthouses', label: 'Penthouses & Vues', icon: Building2 },
  { id: 'meubles', label: 'Appartements Meublés', icon: Sofa },
];

export default function Home() {
  const [allResidences, setAllResidences] = useState([]);
  const [activeCategory, setActiveCategory] = useState('tous');
  const [isCorporateModalOpen, setIsCorporateModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchResidences = async () => {
      try {
        const response = await api.get('/residences');
        const data = Array.isArray(response) ? response : (response.data || []);

        if (isMounted) {
          setAllResidences(data);
        }
      } catch (err) {
        console.error("Erreur lors du chargement des résidences", err);
      }
    };

    fetchResidences();

    return () => {
      isMounted = false;
    };
  }, []);

  // Filtrage réactif direct sur la page d'accueil (façon Blueground / Plum Guide)
  const displayedResidences = useMemo(() => {
    let list = [...allResidences];

    if (activeCategory === 'villas') {
      list = list.filter(r => {
        const type = (r.property_type || '').toLowerCase();
        const desc = (r.description || '').toLowerCase();
        const name = (r.name || '').toLowerCase();
        return type.includes('villa') || desc.includes('piscine') || name.includes('villa');
      });
    } else if (activeCategory === 'penthouses') {
      list = list.filter(r => {
        const type = (r.property_type || '').toLowerCase();
        const name = (r.name || '').toLowerCase();
        return type.includes('penthouse') || name.includes('penthouse') || name.includes('vue');
      });
    } else if (activeCategory === 'meubles') {
      list = list.filter(r => {
        const tx = (r.transaction_type || '').toLowerCase();
        const type = (r.property_type || '').toLowerCase();
        return tx.includes('meuble') || type.includes('appartement');
      });
    }

    // Priorité visuelle : Mettre en avant les villas avec piscine
    list.sort((a, b) => {
      const aIsVilla = (a.property_type || '').toLowerCase().includes('villa');
      const bIsVilla = (b.property_type || '').toLowerCase().includes('villa');
      if (aIsVilla && !bIsVilla) return -1;
      if (!aIsVilla && bIsVilla) return 1;
      return 0;
    });

    // Afficher jusqu'à 6 résidences phares
    return list.slice(0, 6);
  }, [allResidences, activeCategory]);

  return (
    <>
      {/* Hero section (Strictement intacte et inchangée) */}
      <Hero />

      {/* Barre de Recherche & Filtres Immédiats */}
      <section className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-6 pt-10 pb-6">
          <SearchBar />

          {/* Onglets thématiques interactifs animés en harmonie avec les sections */}
          <motion.div 
            className="mt-8 flex flex-wrap items-center justify-center gap-2.5"
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          >
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <motion.button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  whileHover={{ y: -2, scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-medium tracking-wide transition-all duration-300 cursor-pointer ${
                    isActive
                      ? 'bg-royal text-white shadow-md shadow-royal/30 ring-2 ring-royal/20 font-semibold'
                      : 'bg-gray-100/80 text-gray-700 hover:bg-gray-200/80 hover:text-black'
                  }`}
                >
                  <Icon size={14} className={isActive ? 'text-white' : 'text-gray-500'} />
                  {cat.label}
                </motion.button>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Grille des Résidences Phares (Priorité absolue aux photographies) */}
      <section aria-labelledby="residences-heading" className="bg-white py-14 md:py-20">
        <div className="mx-auto max-w-7xl px-6">
          {/* En-tête sobre et direct */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 pb-4 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-gold mb-2">
                <div className="h-1.5 w-1.5 rounded-full bg-gold" />
                SÉLECTIONS PRESTIGE À ABIDJAN
              </div>
              <h2 id="residences-heading" className="font-serif text-2xl md:text-3xl text-night">
                {activeCategory === 'villas'
                  ? 'Villas d\'exception avec piscine'
                  : activeCategory === 'penthouses'
                  ? 'Penthouses & résidences de prestige'
                  : activeCategory === 'meubles'
                  ? 'Appartements meublés de haut standing'
                  : 'Nos résidences d\'exception'}
              </h2>
            </div>

            <Link 
              to="/collection" 
              className="text-xs font-semibold uppercase tracking-[0.15em] text-ink-muted hover:text-royal transition-colors flex items-center gap-1.5 self-start sm:self-auto"
            >
              Explorer toute la collection <ArrowRight size={14} />
            </Link>
          </div>
          
          {/* Grille Photo des 6 Résidences avec transition fluide par catégorie */}
          {displayedResidences.length > 0 ? (
            <motion.div 
              key={activeCategory}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {displayedResidences.map((r, index) => (
                <ResidenceCard
                  key={r.slug || r.id || index}
                  residence={{
                    id: r.id,
                    slug: r.slug,
                    title: r.name,
                    type: r.property_type || "Résidence",
                    city: "ABIDJAN",
                    ref: r.reference || "",
                    description: r.description,
                    location: r.district,
                    address: r.address,
                    guests: r.max_guests,
                    rooms: r.rooms_count,
                    pricePerNight: r.price_per_night ? Number(r.price_per_night) : null,
                    price_sale: r.price_sale ? Number(r.price_sale) : null,
                    transaction_type: r.transaction_type,
                    cover_image_url: r.cover_image_url,
                    images: r.images,
                    status: r.status,
                    price_display: r.price_display,
                    is_price_displayed: r.is_price_displayed
                  }}
                  index={index}
                />
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-100">
              <p className="text-gray-500 font-light mb-4">Aucun bien ne correspond actuellement à cette sélection.</p>
              <button 
                onClick={() => setActiveCategory('tous')}
                className="text-xs font-semibold uppercase tracking-wider text-royal hover:underline"
              >
                Voir toutes les résidences
              </button>
            </div>
          )}

        </div>
      </section>

      {/* Bannière de Réassurance sur fond blanc pur (Luxe épuré avec animations douces) */}
      <section className="bg-white py-16 border-t border-gray-100 overflow-hidden">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.18, delayChildren: 0.1 }
              }
            }}
          >
            {/* Pilier 1 */}
            <motion.div 
              variants={fadeUpVariants}
              whileHover={{ y: -3, transition: { duration: 0.25, ease: "easeOut" } }}
              className="group flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50/80 transition-colors cursor-default"
            >
              <div className="w-12 h-12 rounded-full bg-amber-50/80 border border-gold/30 flex items-center justify-center text-gold shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:border-gold">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-night group-hover:text-gold transition-colors">Biens Réels Certifiés</h4>
                <p className="text-xs text-gray-500 mt-0.5 font-light">Visités, photographiés et vérifiés par nos soins</p>
              </div>
            </motion.div>

            {/* Pilier 2 */}
            <motion.div 
              variants={fadeUpVariants}
              whileHover={{ y: -3, transition: { duration: 0.25, ease: "easeOut" } }}
              className="group flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50/80 transition-colors cursor-default"
            >
              <div className="w-12 h-12 rounded-full bg-amber-50/80 border border-gold/30 flex items-center justify-center text-gold shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:border-gold">
                <Key size={22} />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-night group-hover:text-gold transition-colors">Intendance & Conciergerie</h4>
                <p className="text-xs text-gray-500 mt-0.5 font-light">Accueil personnalisé et service disponible 24/7</p>
              </div>
            </motion.div>

            {/* Pilier 3 */}
            <motion.div 
              variants={fadeUpVariants}
              whileHover={{ y: -3, transition: { duration: 0.25, ease: "easeOut" } }}
              className="group flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50/80 transition-colors cursor-default"
            >
              <div className="w-12 h-12 rounded-full bg-amber-50/80 border border-gold/30 flex items-center justify-center text-gold shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:border-gold">
                <Star size={22} />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-night group-hover:text-gold transition-colors">Standard Hôtelier 5★</h4>
                <p className="text-xs text-gray-500 mt-0.5 font-light">Literie premium, climatisation et discrétion totale</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* BANDEAU CORPORATE DISCRET (Animé avec soin) */}
      <section className="bg-white pb-16 overflow-hidden">
        <motion.div 
          className="mx-auto max-w-5xl px-6"
          initial={{ opacity: 0, y: 35, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="bg-gradient-to-r from-night via-night/95 to-night text-white rounded-3xl p-6 sm:p-8 md:p-10 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-white/10 hover:border-gold/30 transition-colors duration-500">
            <div className="text-center md:text-left">
              <div className="text-[10px] uppercase tracking-[0.25em] text-gold mb-1 font-medium">
                Espace Entreprises & Missions
              </div>
              <h3 className="font-serif text-2xl text-white">
                Besoin d'héberger vos collaborateurs ?
              </h3>
              <p className="text-gray-300 text-xs mt-1 font-light">
                Solutions flexibles pour séjours professionnels, expatriations et missions d'affaires à Abidjan.
              </p>
            </div>

            <motion.button 
              onClick={() => setIsCorporateModalOpen(true)}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center justify-center bg-white hover:bg-royal hover:text-white text-night px-7 py-3 rounded-full text-[11px] font-bold tracking-[0.15em] uppercase transition-colors duration-300 shrink-0 shadow-md cursor-pointer"
            >
              Offre Entreprise
            </motion.button>
          </div>
        </motion.div>
      </section>

      <CorporateRequestModal 
        isOpen={isCorporateModalOpen} 
        onClose={() => setIsCorporateModalOpen(false)} 
      />
    </>
  );
}
