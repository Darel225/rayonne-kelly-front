import { ShieldCheck, Users, Briefcase, MapPin, Quote } from 'lucide-react';
import { motion } from 'framer-motion';

const pillars = [
  { id: "01", title: "Biens sélectionnés", text: "Des propriétés choisies selon des critères stricts de confort, de localisation et de qualité pour garantir un standing d'exception.", badge: "QUALITÉ CERTIFIÉE", icon: ShieldCheck },
  { id: "02", title: "Accompagnement personnalisé", text: "Une équipe dédiée et disponible avant, pendant et après votre transaction, votre séjour ou vos projets immobiliers.", badge: "DISPONIBILITÉ 24/7", icon: Users },
  { id: "03", title: "Service professionnel", text: "Un interlocuteur unique et hautement qualifié pour simplifier chaque étape de votre recherche ou de votre investissement.", badge: "EXPERTISE IMMOBILIÈRE", icon: Briefcase },
  { id: "04", title: "Connaissance d'Abidjan", text: "Une expertise pointue du marché local, adaptée aux besoins des particuliers, professionnels, entreprises et investisseurs.", badge: "VISION LOCALE", icon: MapPin }
];

const testimonial = {
  quote: "« Trouver un appartement qui allie l'intimité d'une vraie maison à un niveau d'exigence digne d'un grand hôtel semblait complexe. Rayonne Kelly a orchestré notre séjour à Abidjan avec une grâce et un professionnalisme remarquables. »",
  initials: "L.B",
  name: "M. & Mme Laurent B.",
  meta: "Voyageurs d'affaires • Séjour Zone 4, Mars 2026",
  stat: "99.4%",
  statLabel: "TAUX DE SATISFACTION EXCLUSIF",
  statText: "Nos clients réguliers nous confient systématiquement l'organisation de leurs séjours d'affaires et de loisirs en Côte d'Ivoire."
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.3 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
  }
};

export default function ExperienceSection() {
  return (
    <section aria-labelledby="experience-heading" className="bg-mist py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">

        {/* Header */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
        >
          <div className="flex items-center justify-center gap-4 text-[10px] uppercase tracking-[0.25em] text-royal mb-5">
            <span className="h-px w-8 bg-royal/40" aria-hidden="true" />
            UNE SIGNATURE SINGULIÈRE
            <span className="h-px w-8 bg-royal/40" aria-hidden="true" />
          </div>
          <h2 id="experience-heading" className="font-serif text-2xl md:text-3xl text-night mb-4">
            {"L'Expérience Rayonne Kelly"}
          </h2>
          <p className="mx-auto max-w-xl text-sm leading-relaxed text-ink-muted mb-16 md:mb-20">
            Plus qu'un simple séjour, nous façonnons des parenthèses de vie préservées de toute contrainte, où chaque détail obéit à l'excellence.
          </p>
        </motion.div>

        {/* Pillars grid */}
        <motion.div
          className="grid grid-cols-1 items-start gap-12 md:grid-cols-2 lg:grid-cols-4 lg:gap-10 mb-20 md:mb-28"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={containerVariants}
        >
          {pillars.map((pillar, index) => {
            const Icon = pillar.icon;
            // On adapte le décalage (mt) pour la grille à 4 colonnes (en escalier optionnel ou régulier)
            const mtClass = index % 2 !== 0 ? "md:mt-12 lg:mt-0" : "mt-0";
            return (
              <motion.article key={pillar.id} className={mtClass} variants={itemVariants}>
                <div className="flex items-center gap-4 mb-8">
                  <span className="text-[10px] uppercase tracking-[0.25em] text-ink-muted/70">
                    PROTOCOLE N° {pillar.id}
                  </span>
                  <span className="h-px flex-1 bg-gray-300/70" aria-hidden="true" />
                  <span aria-hidden="true" className="font-serif text-5xl leading-none text-gold-light">
                    {pillar.id}
                  </span>
                </div>
                <h3 className="font-serif text-2xl text-ink mb-4">{pillar.title}</h3>
                <p className="text-sm leading-relaxed text-ink-muted mb-6">{pillar.text}</p>
                <p className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.15em] text-royal">
                  {pillar.badge} <Icon size={14} aria-hidden="true" />
                </p>
              </motion.article>
            );
          })}
        </motion.div>

        {/* Testimonial */}
        <motion.figure
          className="flex flex-col lg:flex-row bg-night text-white overflow-hidden shadow-2xl mx-auto max-w-4xl"
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex-1 p-6 md:p-10 flex flex-col justify-between gap-8">
            <div>
              <Quote size={20} className="text-white/30 mb-6" aria-hidden="true" />
              <blockquote className="font-serif text-sm md:text-base leading-relaxed italic text-white/90">
                {testimonial.quote}
              </blockquote>
            </div>
            <figcaption className="flex items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-royal text-[11px] font-bold tracking-widest text-white rounded-sm">
                {testimonial.initials}
              </div>
              <div>
                <div className="text-sm font-bold text-white">{testimonial.name}</div>
                <div className="text-[11px] text-white/50">{testimonial.meta}</div>
              </div>
            </figcaption>
          </div>

          <div className="lg:w-2/5 bg-white/5 p-6 md:p-10 flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-white/10">
            <div className="font-serif text-4xl md:text-5xl text-white mb-4">
              {testimonial.stat}
            </div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-gold mb-4">
              {testimonial.statLabel}
            </div>
            <p className="text-xs leading-relaxed text-white/60 max-w-sm">
              {testimonial.statText}
            </p>
          </div>
        </motion.figure>

      </div>
    </section>
  );
}
