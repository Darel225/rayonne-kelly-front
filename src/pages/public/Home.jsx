import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Hero from '../../components/public/Hero';
import ResidenceCard from '../../components/public/ResidenceCard';
import ExperienceSection from '../../components/public/ExperienceSection';
import api from '../../services/api';
import { getImageUrl } from '../../utils/getImageUrl';

export default function Home() {
  const [residences, setResidences] = useState([]);

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
        </section>

        <div className="mx-auto max-w-7xl px-6 pt-20 md:pt-28 flex flex-col gap-24 md:gap-32 pb-24">
          {residences.map((r, index) => (
            <div 
              key={r.slug || r.id || index} 
              className={index === 2 ? "max-w-5xl mx-auto w-full" : "w-full"}
            >
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
                  layout: index < 2 ? "split" : undefined
                }}
                index={index}
                showDescription={index === 2}
              />
            </div>
          ))}
        </div>
      </section>

      <ExperienceSection />
    </>
  );
}
