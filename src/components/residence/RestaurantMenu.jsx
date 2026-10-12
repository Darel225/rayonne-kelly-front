import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Coffee, Utensils, UtensilsCrossed, Wine, Sparkles, Clock, Info, Phone } from 'lucide-react';
import api from '../../services/api';

export default function RestaurantMenu({ residence, itemVariants }) {
  const [meals, setMeals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const residenceName = (residence?.name || residence?.title || '').toLowerCase();
  const residenceSlug = (residence?.slug || '').toLowerCase();

  // Éligibilité : Résidences ciblées par le cahier des charges (Rayonne Appart, Rehoboth) ou toute résidence disposant d'une carte configurée
  const isTargetByCahier = useMemo(() => {
    return (
      residenceName.includes('rayonne appart') ||
      residenceName.includes('rehoboth') ||
      residenceSlug.includes('rayonne-appart') ||
      residenceSlug.includes('rehoboth')
    );
  }, [residenceName, residenceSlug]);

  useEffect(() => {
    let cancelled = false;

    // Si les plats sont déjà attachés à l'objet résidence
    if (Array.isArray(residence?.meals)) {
      const activeMeals = residence.meals.filter(m => Number(m.is_available) === 1);
      if (activeMeals.length > 0 || isTargetByCahier) {
        setMeals(activeMeals);
        setIsLoading(false);
        return;
      }
    }

    const fetchMeals = async () => {
      setIsLoading(true);
      try {
        const res = await api.get(`/residences/${residence?.slug || residence?.id}/meals`);
        const data = Array.isArray(res) ? res : (res?.data || res?.meals || []);
        if (!cancelled) {
          setMeals(data.filter(m => Number(m.is_available) === 1));
        }
      } catch {
        if (!cancelled) {
          setMeals([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    if (residence) {
      fetchMeals();
    }

    return () => { cancelled = true; };
  }, [residence, isTargetByCahier]);

  // Si aucun plat et pas de ciblage officiel Rayonne/Rehoboth, ne rien afficher
  if (!isLoading && meals.length === 0 && !isTargetByCahier) {
    return null;
  }

  // Filtrer les vrais plats réels par prestation
  const petitDejeunerMeals = meals.filter(m => m.category === 'petit_dejeuner');
  const dejeunerMeals = meals.filter(m => m.category === 'dejeuner');
  const dinerMeals = meals.filter(m => m.category === 'diner');
  const boissonMeals = meals.filter(m => m.category === 'boisson');

  return (
    <section className="mb-10 border-t border-black/5 pt-10">
      
      {/* Kicker et Titre exact du Cahier des Charges */}
      <motion.div variants={itemVariants} className="font-mono text-[9px] uppercase tracking-[0.3em] text-gold mb-3 flex items-center gap-2">
        <Sparkles size={13} className="text-gold" />
        <span>03 / PRESTATIONS EN SUITE</span>
      </motion.div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <motion.h2 variants={itemVariants} className="font-serif text-2xl font-light tracking-wide text-night mb-2">
            Restauration et services
          </motion.h2>
          <motion.p variants={itemVariants} className="font-serif text-[15px] font-light leading-relaxed tracking-wide text-ink/80 max-w-2xl">
            Une offre de restauration soignée est proposée aux résidents de nos suites. Notre conciergerie assure la coordination de vos repas en suite ou sur terrasse privée.
          </motion.p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-night text-gold font-mono text-[10px] uppercase tracking-wider rounded-sm shrink-0 self-start md:self-auto shadow-xs border border-gold/30">
          <Clock size={12} className="text-gold" />
          <span>Service Résidents</span>
        </div>
      </div>

      {/* Les 4 Prestations Distinctes exigées par le Cahier des Charges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 1. PETIT-DÉJEUNER */}
        <div className="bg-white border border-black/5 rounded-sm p-6 sm:p-7 flex flex-col justify-between shadow-xs hover:border-gold/30 transition-colors">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="font-mono text-[9px] uppercase tracking-widest text-gold flex items-center gap-1.5">
                <Coffee size={13} className="text-gold" />
                Prestation 01
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-xs bg-gray-100 text-ink-muted">
                Service en suite
              </span>
            </div>

            <h3 className="font-serif text-xl text-night font-normal mb-2">
              Petit-déjeuner
            </h3>
            
            <p className="text-xs text-ink/80 leading-relaxed font-sans mb-4">
              Service proposé aux clients chaque matin. Servi en suite ou sur votre terrasse privée selon vos préférences.
            </p>

            <div className="p-3 bg-gray-50 border border-ink/5 rounded-xs text-[11px] text-ink-muted leading-relaxed font-sans space-y-1 mb-4">
              <div>
                <strong className="text-ink font-medium">Horaires & modalités :</strong> Coordonnés par la conciergerie dès votre arrivée.
              </div>
              <div>
                <strong className="text-ink font-medium">Formule tarifaire :</strong> Précisée après validation de votre réservation (facturé séparément ou selon accord spécifique).
              </div>
            </div>

            {/* Vrais plats de Petit-déjeuner si saisis en base */}
            {petitDejeunerMeals.length > 0 && (
              <div className="pt-3 border-t border-black/5 space-y-2">
                <div className="text-[10px] font-mono uppercase tracking-wider text-gold mb-1">
                  Sélections publiées :
                </div>
                {petitDejeunerMeals.map(meal => (
                  <div key={meal.id} className="flex items-baseline justify-between gap-2 text-xs">
                    <span className="font-serif text-ink">{meal.name}</span>
                    <span className="grow border-b border-dotted border-black/15 mx-1" />
                    <span className="font-mono font-semibold text-night shrink-0">
                      {Number(meal.price).toLocaleString('fr-FR')} <span className="text-[9px] text-gold font-normal">FCFA</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-black/5 flex items-center gap-1.5 text-[10px] font-mono text-ink-muted">
            <Info size={11} className="text-gold shrink-0" />
            <span>Non inclus d’office dans le tarif de base.</span>
          </div>
        </div>

        {/* 2. DÉJEUNER */}
        <div className="bg-white border border-black/5 rounded-sm p-6 sm:p-7 flex flex-col justify-between shadow-xs hover:border-gold/30 transition-colors">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="font-mono text-[9px] uppercase tracking-widest text-gold flex items-center gap-1.5">
                <Utensils size={13} className="text-gold" />
                Prestation 02
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-xs bg-gray-100 text-ink-muted">
                À la carte
              </span>
            </div>

            <h3 className="font-serif text-xl text-night font-normal mb-2">
              Déjeuner
            </h3>
            
            <p className="text-xs text-ink/80 leading-relaxed font-sans mb-4">
              Disponible à la carte pour un repas raffiné en toute tranquillité. Sélection du jour préparée avec des produits de saison.
            </p>

            <div className="p-3 bg-gray-50 border border-ink/5 rounded-xs text-[11px] text-ink-muted leading-relaxed font-sans space-y-1 mb-4">
              <div>
                <strong className="text-ink font-medium">Carte & tarifs :</strong> Publiés auprès de la réception ou consultables auprès du concierge.
              </div>
              <div>
                <strong className="text-ink font-medium">Prise de commande :</strong> Recommandée à l'avance pour une préparation minutieuse.
              </div>
            </div>

            {/* Vrais plats de Déjeuner si saisis en base */}
            {dejeunerMeals.length > 0 && (
              <div className="pt-3 border-t border-black/5 space-y-2">
                <div className="text-[10px] font-mono uppercase tracking-wider text-gold mb-1">
                  Sélections publiées :
                </div>
                {dejeunerMeals.map(meal => (
                  <div key={meal.id} className="flex items-baseline justify-between gap-2 text-xs">
                    <span className="font-serif text-ink">{meal.name}</span>
                    <span className="grow border-b border-dotted border-black/15 mx-1" />
                    <span className="font-mono font-semibold text-night shrink-0">
                      {Number(meal.price).toLocaleString('fr-FR')} <span className="text-[9px] text-gold font-normal">FCFA</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-black/5 flex items-center gap-1.5 text-[10px] font-mono text-ink-muted">
            <Clock size={11} className="text-gold shrink-0" />
            <span>Horaires de service confirmés auprès de votre réception.</span>
          </div>
        </div>

        {/* 3. DÎNER */}
        <div className="bg-white border border-black/5 rounded-sm p-6 sm:p-7 flex flex-col justify-between shadow-xs hover:border-gold/30 transition-colors">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="font-mono text-[9px] uppercase tracking-widest text-gold flex items-center gap-1.5">
                <UtensilsCrossed size={13} className="text-gold" />
                Prestation 03
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-xs bg-gray-100 text-ink-muted">
                À la carte
              </span>
            </div>

            <h3 className="font-serif text-xl text-night font-normal mb-2">
              Dîner
            </h3>
            
            <p className="text-xs text-ink/80 leading-relaxed font-sans mb-4">
              Disponible à la carte pour un moment d'exception en soirée. Service soigné assuré directement dans votre hébergement.
            </p>

            <div className="p-3 bg-gray-50 border border-ink/5 rounded-xs text-[11px] text-ink-muted leading-relaxed font-sans space-y-1 mb-4">
              <div>
                <strong className="text-ink font-medium">Carte du soir :</strong> Menu, suggestions et tarifs communiqués par votre conciergerie.
              </div>
              <div>
                <strong className="text-ink font-medium">Conditions :</strong> Réservation anticipée recommandée dans l'après-midi.
              </div>
            </div>

            {/* Vrais plats de Dîner si saisis en base */}
            {dinerMeals.length > 0 && (
              <div className="pt-3 border-t border-black/5 space-y-2">
                <div className="text-[10px] font-mono uppercase tracking-wider text-gold mb-1">
                  Sélections publiées :
                </div>
                {dinerMeals.map(meal => (
                  <div key={meal.id} className="flex items-baseline justify-between gap-2 text-xs">
                    <span className="font-serif text-ink">{meal.name}</span>
                    <span className="grow border-b border-dotted border-black/15 mx-1" />
                    <span className="font-mono font-semibold text-night shrink-0">
                      {Number(meal.price).toLocaleString('fr-FR')} <span className="text-[9px] text-gold font-normal">FCFA</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-black/5 flex items-center gap-1.5 text-[10px] font-mono text-ink-muted">
            <Clock size={11} className="text-gold shrink-0" />
            <span>Service en suite coordonné sur mesure pour vos convives.</span>
          </div>
        </div>

        {/* 4. BOISSONS */}
        <div className="bg-white border border-black/5 rounded-sm p-6 sm:p-7 flex flex-col justify-between shadow-xs hover:border-gold/30 transition-colors">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="font-mono text-[9px] uppercase tracking-widest text-gold flex items-center gap-1.5">
                <Wine size={13} className="text-gold" />
                Prestation 04
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-xs bg-gray-100 text-ink-muted">
                À la carte
              </span>
            </div>

            <h3 className="font-serif text-xl text-night font-normal mb-2">
              Boissons & Rafraîchissements
            </h3>
            
            <p className="text-xs text-ink/80 leading-relaxed font-sans mb-4">
              Disponibles à la carte à toute heure. Sélection de cafés, thés fins, eaux minérales, jus frais et sélections de cave.
            </p>

            <div className="p-3 bg-gray-50 border border-ink/5 rounded-xs text-[11px] text-ink-muted leading-relaxed font-sans space-y-1 mb-4">
              <div>
                <strong className="text-ink font-medium">Tarifs pratiqués :</strong> Carte officielle des boissons tenue à disposition des résidents.
              </div>
              <div>
                <strong className="text-ink font-medium">Disponibilité :</strong> Service continu 7j/7 assuré par la réception.
              </div>
            </div>

            {/* Vraies boissons si saisies en base */}
            {boissonMeals.length > 0 && (
              <div className="pt-3 border-t border-black/5 space-y-2">
                <div className="text-[10px] font-mono uppercase tracking-wider text-gold mb-1">
                  Sélections publiées :
                </div>
                {boissonMeals.map(meal => (
                  <div key={meal.id} className="flex items-baseline justify-between gap-2 text-xs">
                    <span className="font-serif text-ink">{meal.name}</span>
                    <span className="grow border-b border-dotted border-black/15 mx-1" />
                    <span className="font-mono font-semibold text-night shrink-0">
                      {Number(meal.price).toLocaleString('fr-FR')} <span className="text-[9px] text-gold font-normal">FCFA</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-black/5 flex items-center gap-1.5 text-[10px] font-mono text-ink-muted">
            <Info size={11} className="text-gold shrink-0" />
            <span>Sélection servie fraîche en suite à la demande.</span>
          </div>
        </div>

      </div>

      {/* Bandeau officiel de conciergerie */}
      <div className="mt-8 p-5 bg-[#FAFAF8] border border-black/5 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-ink font-sans shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0 text-gold">
            <Phone size={14} />
          </div>
          <div className="text-xs text-ink/80 leading-relaxed font-sans">
            Pour toute commande en suite, précision d'horaires ou régime alimentaire spécifique, contactez directement votre conciergerie privée.
          </div>
        </div>

        <a 
          href="tel:+2250710101052"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-night text-gold border border-gold/30 hover:border-gold hover:bg-black transition-all rounded-xs font-mono text-xs font-bold whitespace-nowrap self-start sm:self-auto shrink-0 shadow-xs group cursor-pointer"
        >
          <Phone size={13} className="text-gold group-hover:scale-110 transition-transform" />
          <span>+225 07 10 10 10 52</span>
        </a>
      </div>

    </section>
  );
}
