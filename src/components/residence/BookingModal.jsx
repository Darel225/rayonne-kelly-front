import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, Calendar, Users, Clock, Info } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import api from '../../services/api';
import { SLA_HOURS_MAX } from '../../constants/sla';
import AvailabilityCalendar from './AvailabilityCalendar';

export default function BookingModal({ isOpen, onClose, residence }) {
  const txType = residence?.transaction_type || localStorage.getItem(`rk_tx_type_${residence?.id}`) || 'meuble';
  const minStay = Math.max(Number(residence?.min_stay) || 1, 1);
  const maxGuests = Math.max(Number(residence?.max_guests) || 1, 1);

  const rawPrice = residence?.price_sale || residence?.price_per_night || residence?.price;
  const priceDisplay = residence?.price_display || localStorage.getItem(`rk_price_display_${residence?.id}`) || (residence?.is_price_displayed !== undefined ? (residence?.is_price_displayed ? 'public' : 'on_demand') : (rawPrice ? 'public' : 'on_demand'));
  const isPriceMasked = priceDisplay === 'on_demand' || !rawPrice;

  const [bookingData, setBookingData] = useState({
    check_in_date: '',
    check_out_date: '',
    guests_count: 1,
    time_slot: 'Après-midi (14h - 16h)',
    special_requests: ''
  });
  const [calendarRange, setCalendarRange] = useState({ from: undefined, to: undefined });
  const [singleDate, setSingleDate] = useState(undefined);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [rgpdConsent, setRgpdConsent] = useState(false);

  // Helper pour calculer une date décalée de N jours
  const addDays = (dateStr, days) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  // Réinitialisation de l'état quand la modale s'ouvre
  useEffect(() => {
    if (isOpen) {
      setIsSuccess(false);
      setSubmitError(null);
      setRgpdConsent(false);
      setBookingData({
        check_in_date: '',
        check_out_date: '',
        guests_count: 1,
        time_slot: 'Après-midi (14h - 16h)',
        special_requests: ''
      });
      setCalendarRange({ from: undefined, to: undefined });
      setSingleDate(undefined);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Gestion de la sélection sur le calendrier en mode Plage (Meublé / Location)
  const handleCalendarRangeSelect = (range) => {
    setCalendarRange(range || { from: undefined, to: undefined });
    if (range?.from) {
      const fromStr = format(range.from, 'yyyy-MM-dd');
      const toStr = range.to ? format(range.to, 'yyyy-MM-dd') : '';
      setBookingData(prev => ({
        ...prev,
        check_in_date: fromStr,
        check_out_date: toStr
      }));
    } else {
      setBookingData(prev => ({
        ...prev,
        check_in_date: '',
        check_out_date: ''
      }));
    }
  };

  // Gestion de la sélection sur le calendrier en mode Date Unique (Visite Vente)
  const handleCalendarSingleSelect = (date) => {
    setSingleDate(date);
    if (date) {
      const dateStr = format(date, 'yyyy-MM-dd');
      setBookingData(prev => ({
        ...prev,
        check_in_date: dateStr,
        check_out_date: addDays(dateStr, minStay)
      }));
    } else {
      setBookingData(prev => ({
        ...prev,
        check_in_date: '',
        check_out_date: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rgpdConsent) {
      setSubmitError("Veuillez accepter le traitement de vos données personnelles conformément à la politique de confidentialité.");
      return;
    }

    if (!bookingData.check_in_date) {
      setSubmitError(txType === 'vente' ? "Veuillez choisir une date de visite sur le calendrier." : "Veuillez choisir une date d'arrivée sur le calendrier.");
      return;
    }

    if (txType !== 'vente' && !bookingData.check_out_date) {
      setSubmitError("Veuillez choisir votre date de départ sur le calendrier.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      let finalCheckIn = bookingData.check_in_date;
      let finalCheckOut = bookingData.check_out_date;
      let finalRequests = bookingData.special_requests || '';

      if (txType === 'vente') {
        // Pour une visite privée de bien en vente
        if (!finalCheckOut || finalCheckOut <= finalCheckIn) {
          finalCheckOut = addDays(finalCheckIn, minStay);
        }
        finalRequests = `[DEMANDE DE VISITE PRIVÉE / ACQUISITION - Date: ${finalCheckIn} - Créneau: ${bookingData.time_slot}] ${finalRequests}`.trim();
      } else if (txType === 'location') {
        finalRequests = `[DEMANDE DE LOCATION RÉSIDENTIELLE] ${finalRequests}`.trim();
      } else if (isPriceMasked) {
        finalRequests = `[DEMANDE DE DEVIS PERSONNALISÉ / TARIF SUR DEMANDE] ${finalRequests}`.trim();
      }

      await api.post('/bookings', {
        residence_id: residence.id,
        check_in_date: finalCheckIn,
        check_out_date: finalCheckOut,
        guests_count: Number(bookingData.guests_count) || 1,
        special_requests: finalRequests
      });

      setIsSuccess(true);
    } catch (err) {
      console.error(err);
      const rawMsg = err.response?.data?.error || err.response?.data?.message;
      let friendlyMsg = rawMsg;
      if (rawMsg === 'Stay is shorter than the minimum required') {
        friendlyMsg = `Le séjour sélectionné est inférieur au minimum requis (${minStay} nuits pour cette résidence).`;
      } else if (rawMsg === 'Guest count exceeds residence capacity') {
        friendlyMsg = `Le nombre de personnes dépasse la capacité maximale autorisée (${maxGuests} personne${maxGuests > 1 ? 's' : ''}).`;
      } else if (rawMsg === 'Residence is not available for these dates') {
        friendlyMsg = "Cette résidence fait déjà l'objet d'une option ou réservation sur ces dates.";
      }
      setSubmitError(friendlyMsg || 'Une erreur est survenue lors de votre demande.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Fond flouté sombre */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={!isSuccess ? onClose : undefined}
      />

      {/* Conteneur de la Modale */}
      <div className="bg-white shadow-2xl p-6 sm:p-8 max-w-xl w-full relative animate-in fade-in zoom-in duration-500 overflow-hidden rounded-sm flex flex-col max-h-[92vh]">
        
        {/* Décoration d'arrière-plan très subtile */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        {!isSuccess && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-ink-muted hover:text-ink transition-colors z-20"
            aria-label="Fermer"
          >
            <X size={24} strokeWidth={1.5} />
          </button>
        )}
        
        {isSuccess ? (
          /* ÉTAT DE SUCCÈS - L'EFFET WAHOO */
          <div className="relative z-10 flex flex-col items-center text-center py-8 animate-in slide-in-from-bottom-4 fade-in duration-700">
            <div className="w-16 h-16 rounded-full border border-gold/30 flex items-center justify-center mb-8 relative">
              <div className="absolute inset-0 bg-gold/10 rounded-full animate-pulse" />
              <Check size={32} className="text-gold" strokeWidth={1} />
            </div>
            
            <h3 className="font-serif text-3xl text-night mb-4 font-light">
              {txType === 'vente' 
                ? 'Demande de visite enregistrée.' 
                : txType === 'location' 
                ? 'Dossier de location transmis.' 
                : isPriceMasked
                ? 'Demande de devis enregistrée.'
                : 'Demande bien reçue.'}
            </h3>
            
            <div className="w-12 h-[1px] bg-gold/50 mx-auto mb-6" />
            
            <p className="font-serif text-[15px] text-ink/80 leading-relaxed mb-10 max-w-sm mx-auto">
              {txType === 'vente'
                ? `Votre demande de visite privée pour la résidence ${residence?.name} a bien été confiée à notre équipe. Un responsable des acquisitions vous contactera sous ${SLA_HOURS_MAX || 2} heures pour convenir de l'accueil et vous transmettre le dossier d'acquisition.`
                : txType === 'location'
                ? `Votre demande de location pour la résidence ${residence?.name} a bien été transmise. Notre conciergerie privée examinera vos critères et prendra contact avec vous sous ${SLA_HOURS_MAX || 2} heures.`
                : isPriceMasked
                ? `Votre demande de devis pour la résidence ${residence?.name} a bien été transmise à notre direction. Un membre de notre conciergerie privée vous contactera sous ${SLA_HOURS_MAX || 2} heures avec une proposition tarifaire détaillée.`
                : `Vos dates ont été confiées à notre équipe. Un membre de notre conciergerie privée vous contactera sous ${SLA_HOURS_MAX || 2} heures pour finaliser votre séjour sur-mesure.`}
            </p>

            <button
              onClick={onClose}
              className="px-8 py-4 bg-night text-white text-[10px] uppercase tracking-[0.2em] font-semibold hover:bg-black transition-all duration-500 w-full sm:w-auto"
            >
              Retourner à la collection
            </button>
          </div>
        ) : (
          /* ÉTAT FORMULAIRE - HAUTE COUTURE AVEC CALENDRIER */
          <div className="relative z-10 overflow-y-auto pr-1 flex-1 custom-scrollbar">
            <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest text-royal mb-1">
              <span className="w-1.5 h-1.5 bg-royal rounded-full" />
              {txType === 'vente' ? 'Protocole d\'Acquisition' : txType === 'location' ? 'Location Résidentielle' : isPriceMasked ? 'Protocole de Cotation & Devis' : 'Séjour d\'Exception'}
            </div>

            <h3 className="font-serif text-2xl sm:text-3xl text-night mb-1 font-light">
              {txType === 'vente' ? 'Visite Privée' : txType === 'location' ? 'Demande de Bail' : isPriceMasked ? 'Demande de Devis' : 'L\'Invitation'}
            </h3>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
              <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-ink-muted">
                Résidence <span className="text-gold font-semibold">{residence?.name}</span>
              </p>
              {isPriceMasked ? (
                <span className="font-serif text-xs text-gold font-medium bg-gold/10 px-2 py-0.5 rounded-xs">
                  Tarif sur demande &bull; Devis sous {SLA_HOURS_MAX || 2}h
                </span>
              ) : rawPrice ? (
                <span className="font-mono text-[10px] text-ink-muted">
                  À partir de <strong className="text-night">{new Intl.NumberFormat('fr-FR').format(rawPrice)} FCFA</strong> {txType === 'vente' ? '' : txType === 'location' ? '/ mois' : '/ nuit'}
                </span>
              ) : null}
            </div>

            {submitError && (
              <div className="p-3 bg-red-50 text-red-800 border border-red-200 text-xs mb-5 font-sans flex items-start gap-2 rounded-sm">
                <Info size={16} className="text-red-600 shrink-0 mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 pb-2">
              
              {/* CALENDRIER INTERACTIF DES DISPONIBILITÉS */}
              <div>
                <label className="block text-[9px] font-bold text-ink-muted uppercase tracking-[0.2em] mb-2 flex items-center gap-1.5">
                  <Calendar size={11} className="text-gold" />
                  {txType === 'vente' ? '1. Choisissez votre date de visite *' : '1. Choisissez vos dates sur le calendrier *'}
                </label>
                
                <AvailabilityCalendar
                  residence={residence}
                  mode={txType === 'vente' ? 'single' : 'range'}
                  selected={txType === 'vente' ? singleDate : calendarRange}
                  onSelect={txType === 'vente' ? handleCalendarSingleSelect : handleCalendarRangeSelect}
                  minStay={minStay}
                />
              </div>

              {/* CHAMPS COMPLÉMENTAIRES SELON LA TRANSACTION */}
              {txType === 'vente' ? (
                /* Compléments Vente */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative group">
                    <label className="block text-[9px] font-bold text-ink-muted uppercase tracking-[0.2em] mb-2 transition-colors group-hover:text-gold flex items-center gap-1.5">
                      <Clock size={11} className="text-gold" />
                      Créneau privilégié
                    </label>
                    <select
                      value={bookingData.time_slot}
                      onChange={(e) => setBookingData({ ...bookingData, time_slot: e.target.value })}
                      className="w-full border-0 border-b border-gray-200 bg-transparent px-0 py-2 font-serif text-base text-night focus:ring-0 focus:border-gold outline-none transition-colors cursor-pointer"
                    >
                      <option value="Matinée (10h - 12h)">Matinée (10h - 12h)</option>
                      <option value="Après-midi (14h - 16h)">Après-midi (14h - 16h)</option>
                      <option value="Fin de journée (17h - 19h)">Fin de journée (17h - 19h)</option>
                    </select>
                  </div>

                  <div className="relative group">
                    <div className="flex justify-between items-baseline mb-2">
                      <label className="text-[9px] font-bold text-ink-muted uppercase tracking-[0.2em] transition-colors group-hover:text-gold flex items-center gap-1.5">
                        <Users size={11} className="text-gold" />
                        Accompagnants
                      </label>
                      <span className="text-[10px] text-ink-muted font-mono">Max: {maxGuests}</span>
                    </div>
                    <input
                      type="number"
                      required
                      min="1"
                      max={maxGuests}
                      value={bookingData.guests_count}
                      onChange={(e) => setBookingData({ ...bookingData, guests_count: parseInt(e.target.value) || 1 })}
                      className="w-full border-0 border-b border-gray-200 bg-transparent px-0 py-2 font-serif text-lg text-night focus:ring-0 focus:border-gold outline-none transition-colors"
                    />
                  </div>
                </div>
              ) : (
                /* Compléments Meublé / Location */
                <div className="relative group">
                  <div className="flex justify-between items-baseline mb-2">
                    <label className="text-[9px] font-bold text-ink-muted uppercase tracking-[0.2em] transition-colors group-hover:text-gold flex items-center gap-1.5">
                      <Users size={11} className="text-gold" />
                      {txType === 'location' ? 'Nombre d\'occupants *' : 'Nombre de convives *'}
                    </label>
                    <span className="text-[10px] text-ink-muted font-mono">Capacité max : {maxGuests} personne{maxGuests > 1 ? 's' : ''}</span>
                  </div>
                  <input
                    type="number"
                    required
                    min="1"
                    max={maxGuests}
                    value={bookingData.guests_count}
                    onChange={(e) => setBookingData({ ...bookingData, guests_count: parseInt(e.target.value) || 1 })}
                    className="w-full border-0 border-b border-gray-200 bg-transparent px-0 py-2 font-serif text-lg text-night focus:ring-0 focus:border-gold outline-none transition-colors"
                  />
                </div>
              )}

              {/* DEMANDES PARTICULIÈRES */}
              <div className="relative group">
                <label className="block text-[9px] font-bold text-ink-muted uppercase tracking-[0.2em] mb-2 transition-colors group-hover:text-gold">
                  {txType === 'vente' 
                    ? 'Projet d\'acquisition / Message (Optionnel)' 
                    : txType === 'location' 
                    ? 'Précisions sur votre bail / Garanties (Optionnel)' 
                    : 'Préférences & Attentions particulières (Optionnel)'}
                </label>
                <textarea
                  rows="2"
                  value={bookingData.special_requests}
                  onChange={(e) => setBookingData({ ...bookingData, special_requests: e.target.value })}
                  className="w-full border-0 border-b border-gray-200 bg-transparent px-0 py-2 font-serif text-[15px] text-night focus:ring-0 focus:border-gold outline-none resize-none transition-colors placeholder:text-gray-300 placeholder:font-sans placeholder:text-sm"
                  placeholder={txType === 'vente' ? 'Résidence principale, investissement patrimonial...' : txType === 'location' ? 'Bail d\'un an renouvelable, profession...' : 'Transfert aéroport, chef privé...'}
                />
              </div>

              {/* CASE À COCHER RGPD */}
              <div className="pt-1">
                <label className="flex items-start gap-3 cursor-pointer group select-none">
                  <input
                    type="checkbox"
                    id="booking-rgpd-consent"
                    checked={rgpdConsent}
                    onChange={(e) => setRgpdConsent(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded-none border border-gray-300 text-night focus:ring-gold accent-[#1A1A1A] cursor-pointer shrink-0"
                    required
                  />
                  <span className="text-[11px] leading-relaxed text-ink-muted font-sans group-hover:text-ink transition-colors">
                    J'accepte que mes données personnelles soient traitées par Rayonne Kelly pour la gestion de ma demande, conformément à la{' '}
                    <a
                      href="/confidentialite"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gold underline underline-offset-2 hover:text-night transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      politique de confidentialité
                    </a>
                    . <span className="text-gold">*</span>
                  </span>
                </label>
              </div>

              {/* BOUTON D'ACTION */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isSubmitting || !rgpdConsent || !bookingData.check_in_date || (txType !== 'vente' && !bookingData.check_out_date)}
                  className="relative w-full bg-night text-white py-4 sm:py-5 text-[10px] font-bold uppercase tracking-[0.3em] overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-sm"
                >
                  <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
                  
                  <span className="relative flex items-center justify-center gap-3">
                    {isSubmitting ? (
                      <>
                        <span className="w-1.5 h-1.5 bg-gold rounded-full animate-ping" />
                        Transmission en cours...
                      </>
                    ) : txType === 'vente' ? (
                      'Demander une visite privée'
                    ) : txType === 'location' ? (
                      'Transmettre ma demande'
                    ) : isPriceMasked ? (
                      'Transmettre ma demande de devis'
                    ) : (
                      'Confier ma demande'
                    )}
                  </span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}


