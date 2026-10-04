import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Hero from '../../components/public/Hero';
import SearchBar from '../../components/public/SearchBar';
import ResidenceCard from '../../components/public/ResidenceCard';
import ExperienceSection from '../../components/public/ExperienceSection';
import api from '../../services/api';
import { getImageUrl } from '../../utils/getImageUrl';
import CorporateRequestModal from '../../components/public/CorporateRequestModal';

const fadeUpVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 1, ease: [0.22, 1, 0.36, 1] }
  }
};

export default function Home() {
  const [residences, setResidences] = useState([]);
  const [isCorporateModalOpen, setIsCorporateModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchResidences = async () => {
      try {
        const response = await api.get('/residences');
        const data = Array.isArray(response) ? response : (response.data || []);

        if (isMounted) {
          setResidences(data.slice(0, 3));
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

  return (
    <>
      <Hero />

      <section aria-labelledby="residences-heading">
        <section className="bg-white">
          <motion.div
            className="mx-auto max-w-7xl px-6 pt-12 md:pt-16 pb-4 md:pb-6 flex flex-col md:flex-row md:items-end justify-between gap-10 md:gap-20"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Colonne Gauche : Titres */}
            <div className="flex-1">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-gold mb-6">
                <div className="h-1.5 w-1.5 rounded-full bg-gold" />
                PORTFOLIO DE HAUTE FACTURE
              </div>
              <h2 id="residences-heading" className="font-serif text-3xl md:text-4xl text-night leading-tight">
                Exhibition Résidentielle
              </h2>
            </div>

            {/* Colonne Droite : Description */}
            <div className="flex-1 md:max-w-md">
              <p className="text-sm md:text-base leading-relaxed text-night/70">
                Chaque demeure est présentée comme une pièce de collection singulière. Aucune duplication, une sélection stricte soumise au protocole de discrétion.
              </p>
            </div>
          </motion.div>

          {/* Intégration de la SearchBar (Simple) */}
          <div className="mx-auto max-w-7xl px-6 pb-12">
            <SearchBar />
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-6 pt-12 md:pt-20 pb-24">
          {/* Header de la Grille */}
          <div className="flex items-center justify-end mb-8">
            <Link 
              to="/collection" 
              className="text-xs font-medium text-gray-500 hover:text-black transition-colors tracking-wider uppercase flex items-center gap-1"
            >
              Voir toute la collection <ArrowRight size={14} />
            </Link>
          </div>
          
          {/* Grille */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {residences.map((r, index) => (
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
                cover_image_url: r.cover_image_url,
                images: r.images,
                status: r.status
              }}
              index={index}
            />
          ))}
          </div>
        </div>
      </section>

      <ExperienceSection />

      {/* SECTION B2B (Épurée & Aérienne) */}
      <section className="bg-white py-16 md:py-20">
        <motion.div 
          className="mx-auto max-w-3xl px-6 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.2 }
            }
          }}
        >
          <motion.div variants={fadeUpVariants} className="text-[10px] uppercase tracking-[0.25em] text-gray-400 mb-6">
            Espace Corporate
          </motion.div>
          <motion.h2 variants={fadeUpVariants} className="font-serif text-3xl md:text-4xl text-gray-900 mb-8">
            Vous êtes une entreprise ?
          </motion.h2>
          <motion.p variants={fadeUpVariants} className="text-gray-600 max-w-2xl mx-auto leading-relaxed mb-12 font-light text-[15px] md:text-base">
            Des solutions d’hébergement adaptées à vos collaborateurs et missions professionnelles. Séjours professionnels, missions temporaires, expatriation ou hébergement longue durée : Rayonne Kelly propose des solutions sur-mesure pour répondre aux exigences des sociétés, multinationales et institutions.
          </motion.p>
          <motion.button 
            variants={fadeUpVariants}
            onClick={() => setIsCorporateModalOpen(true)}
            className="inline-block bg-white border border-night text-night hover:border-royal hover:bg-royal hover:text-white px-8 py-3.5 rounded-full text-[11px] font-medium tracking-[0.15em] uppercase transition-colors duration-300"
          >
            Demander une offre entreprise
          </motion.button>
        </motion.div>
      </section>

      <CorporateRequestModal 
        isOpen={isCorporateModalOpen} 
        onClose={() => setIsCorporateModalOpen(false)} 
      />
    </>
  );
}
