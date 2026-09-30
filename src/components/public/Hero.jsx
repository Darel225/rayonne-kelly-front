import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const premiumEase = [0.22, 1, 0.36, 1];

const fadeUpVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 1.2, ease: premiumEase } 
  }
};

const FEATURED_DEFAULT = {
  name: "La Résidence Ébrié",
  location: "Cocody Ambassades",
  price: "150 000 FCFA",
  unit: "/nuit",
  perk: "INTENDANCE 24/7 DÉDIÉE"
};

export default function Hero({ featured = FEATURED_DEFAULT }) {
  return (
    <section className="relative w-full min-h-[85vh] overflow-hidden bg-night flex flex-col">
      <motion.img 
        src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=2000" 
        alt="" 
        aria-hidden="true" 
        fetchPriority="high" 
        decoding="async" 
        className="absolute inset-0 w-full h-full object-cover"
        initial={{ scale: 1.05, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        transition={{ duration: 1.8, ease: premiumEase }}
      />
      <div aria-hidden="true" className="absolute inset-0 bg-linear-to-r from-night/90 via-night/65 to-night/40" />
      <div aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-night/70 via-transparent to-night/30" />
      
      <motion.div 
        className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col justify-between gap-12 px-6 pb-8 pt-32 md:pb-10 md:pt-40"
        initial="hidden" 
        animate="visible" 
        variants={{ visible: { transition: { staggerChildren: 0.2, delayChildren: 0.4 } } }}
      >
        
        {/* Zone A: Top meta strip */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-gold">
            <div className="h-1.5 w-1.5 rounded-full bg-gold" />
            SÉLECTION IMMOBILIÈRE DE PRESTIGE
          </div>
          <div className="hidden md:flex items-center gap-6 text-[10px] uppercase tracking-[0.25em] text-white/50">
            <span>ABIDJAN · ASSINIE</span>
            <span className="text-gold">•</span>
            <span>{"5°20'44.2\"N 4°00'18.8\"W"}</span>
            <span className="text-gold">•</span>
            <span>ÉDITION 2026</span>
          </div>
        </div>

        {/* Zone B: Main content */}
        <div className="flex flex-col">
          <motion.div variants={fadeUpVariants} className="inline-flex items-center gap-2 border border-white/25 px-3 py-1.5 mb-8 text-[10px] uppercase tracking-[0.2em] text-white/80 self-start">
            <div className="h-1.5 w-1.5 rounded-full bg-gold" />
            {"SÉJOURS DE PRESTIGE • CÔTE D'IVOIRE"}
          </motion.div>
          
          <motion.h1 variants={fadeUpVariants} className="font-serif font-normal text-white text-5xl md:text-7xl leading-[1.1] mb-6">
            {"L'Art de Vivre"}
            <span className="block italic">{"d'Exception."}</span>
          </motion.h1>
          
          <motion.p variants={fadeUpVariants} className="max-w-md text-sm md:text-base leading-relaxed text-white/70 mb-10">
            {"Découvrez notre sélection de résidences confidentielles, alliant pureté sculpturale, discrétion diplomatique et conciergerie d'élite pour un séjour sans égal."}
          </motion.p>
          
          <motion.div variants={fadeUpVariants} className="flex flex-col sm:flex-row gap-4">
            <Link to="/collection" className="inline-flex items-center justify-center gap-3 bg-royal hover:bg-royal-dark text-white text-xs uppercase tracking-[0.2em] px-7 py-4 rounded-sm transition-colors">
              CONSULTER LA COLLECTION
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
            
          </motion.div>
        </div>

        {/* Zone C: Featured residence */}
        <div className="flex items-center gap-6 md:gap-8 md:self-end">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.2em] text-gold">
              <div className="h-1.5 w-1.5 rounded-full bg-gold" />
              DISPONIBLE IMMÉDIATEMENT
            </div>
            <div className="font-serif text-xl md:text-2xl text-white">
              {featured.name}
            </div>
            <div className="text-[11px] text-white/50">
              {featured.location}
            </div>
          </div>
          
          <div className="w-px self-stretch bg-white/20" />
          
          <div className="flex flex-col gap-1">
            <div>
              <span className="font-serif text-2xl text-white">{featured.price}</span>
              <span className="text-xs text-white/50 ml-1">{featured.unit}</span>
            </div>
            <div className="text-[9px] uppercase tracking-[0.2em] text-gold">
              {featured.perk}
            </div>
          </div>
        </div>
        
      </motion.div>
    </section>
  );
}
