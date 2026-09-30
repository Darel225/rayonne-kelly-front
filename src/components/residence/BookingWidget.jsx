import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DayPicker } from 'react-day-picker';
import { fr } from 'date-fns/locale';
import { format } from 'date-fns';
import 'react-day-picker/dist/style.css';
import Button from '../common/Button';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import { toast } from 'sonner';
import { SLA_HOURS_MAX } from '../../constants/sla';

export default function BookingWidget({ residence }) {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore(state => !!state.accessToken);
  const [dateRange, setDateRange] = useState({ from: undefined, to: undefined });
  const [guests, setGuests] = useState(4); 
  
  const [blockedDates, setBlockedDates] = useState([]);
  const [isLoadingDates, setIsLoadingDates] = useState(true);
  const [datesError, setDatesError] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const fetchBlockedDates = async (signal) => {
    if (!residence?.slug) return;
    setIsLoadingDates(true);
    setDatesError(null);
    
    try {
      const response = await api.get(`/residences/${residence.slug}/blocked-dates`, {
        signal
      });
      
      const data = Array.isArray(response) ? response : (response || []);
      
      if (Array.isArray(data)) {
        const formattedDates = data.map(range => ({
          from: new Date(range.from || range.check_in || range.startDate),
          to: new Date(range.to || range.check_out || range.endDate)
        }));
        setBlockedDates(formattedDates);
      } else {
        setBlockedDates([]);
      }
    } catch (err) {
      if (err.name !== 'CanceledError') {
        console.error("Erreur lors du chargement des dates bloquées:", err);
        setDatesError("Impossible de vérifier les disponibilités pour le moment, veuillez réessayer.");
      }
    } finally {
      setIsLoadingDates(false);
    }
  };

  // Fetch blocked dates
  useEffect(() => {
    const controller = new AbortController();
    fetchBlockedDates(controller.signal);
    return () => {
      controller.abort();
    };
  }, [residence?.slug]);

  const handleAdjustGuests = () => {
    const max = residence.max_guests || 10;
    setGuests(prev => (prev < max ? prev + 1 : 1));
  };

  // Calculations
  const arrive = dateRange?.from;
  const depart = dateRange?.to;
  let nights = 0;
  
  if (arrive && depart) {
    const diffTime = Math.abs(depart - arrive);
    nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  
  const pricePerNight = Number(residence.price_per_night) || 0;
  const subtotal = nights * pricePerNight;
  const total = subtotal;

  const minStay = residence.min_stay || 1;
  const isValidStay = nights >= minStay;

  // Disabled dates: past dates + blocked ranges
  const disabledDays = [
    { before: new Date() },
    ...blockedDates.map(range => ({ from: range.from, to: range.to }))
  ];

  const handleBookingSubmit = async () => {
    if (!isAuthenticated) {
      navigate(`/connexion?redirect=/residences/${residence.slug}`);
      return;
    }

    if (!arrive || !depart || !isValidStay || isSubmitting) return;

    if (guests > (residence.max_guests || 10)) {
      setSubmitError(`Le nombre maximum de voyageurs pour cette résidence est de ${residence.max_guests || 10}.`);
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    const payload = {
      residence_id: residence.id,
      check_in_date: format(arrive, 'yyyy-MM-dd'),
      check_out_date: format(depart, 'yyyy-MM-dd'),
      guests_count: guests
    };

    try {
      await api.post('/bookings', payload);
      toast.success(`Réservation envoyée avec succès. Réponse sous ${SLA_HOURS_MAX}h.`);
      
      setTimeout(() => {
        navigate('/client');
      }, 1500);

    } catch (err) {
      console.error(err);
      const status = err.response?.status;
      
      if (status === 409) {
        setSubmitError("Désolé, ces dates viennent d'être réservées. Veuillez choisir une autre période.");
        fetchBlockedDates(); // Refresh calendar to show the newly blocked dates
      } else if (status === 401) {
        navigate(`/connexion?redirect=/residences/${residence.slug}`);
      } else if (status === 400) {
        const msg = err.response?.data?.message || "Données invalides. Veuillez vérifier votre saisie.";
        setSubmitError(msg);
      } else {
        setSubmitError("Une erreur inattendue est survenue. Veuillez réessayer plus tard.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <aside className="lg:sticky lg:top-32 bg-white border border-gray-200/60 rounded-[1px] p-6 md:p-8 shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <span className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">TARIF DE RÉSIDENCE</span>
        <span className="inline-block border border-royal text-royal text-[10px] font-semibold uppercase px-2 py-1 tracking-wider rounded-sm">MANDAT EXCLUSIF</span>
      </div>

      <div className="mb-8 border-b border-gray-100 pb-8">
        <div className="flex items-baseline gap-2">
          <span className="font-serif text-2xl text-night">{new Intl.NumberFormat('fr-FR').format(pricePerNight)}</span>
          <span className="text-xs uppercase text-ink-muted">FCFA / NUITÉE</span>
        </div>
        <div className="text-xs text-ink-muted mt-2">
          Séjour minimum : {minStay} nuit{minStay > 1 ? 's' : ''}
        </div>
      </div>

      <div className="mb-6">
        <label className="block font-mono text-[10px] uppercase tracking-widest text-ink-muted mb-4">SÉLECTIONNEZ VOS DATES</label>
        
        {datesError ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-sm text-sm border border-red-100 mb-4">
            {datesError}
          </div>
        ) : (
          <div className="w-full flex justify-center bg-gray-50/50 rounded-lg p-2 border border-gray-100 mb-4 overflow-hidden">
            <DayPicker
              mode="range"
              selected={dateRange}
              onSelect={setDateRange}
              locale={fr}
              disabled={isLoadingDates ? true : disabledDays}
              className="text-sm scale-90 sm:scale-100 origin-center"
              showOutsideDays={false}
              classNames={{
                day_selected: "bg-royal text-white hover:bg-royal-dark focus:bg-royal-dark",
                day_range_middle: "bg-royal/10 text-ink",
                day_range_start: "bg-royal text-white",
                day_range_end: "bg-royal text-white",
              }}
            />
          </div>
        )}

        {/* Displaying check-in and check-out times */}
        <div className="flex justify-between items-center text-xs text-ink-muted mt-4">
          <div>
            <span className="block font-semibold">Check-in</span>
            <span>{residence.check_in_time || '15:00'}</span>
          </div>
          <div className="text-right">
            <span className="block font-semibold">Check-out</span>
            <span>{residence.check_out_time || '11:00'}</span>
          </div>
        </div>
      </div>

      <div className="mb-8 border-y border-gray-100 py-6">
        <label className="block font-mono text-[10px] uppercase tracking-widest text-ink-muted mb-2">COMPOSITION DES VOYAGEURS</label>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-ink">{guests} Voyageur{guests > 1 ? 's' : ''}</span>
          <button
            type="button"
            onClick={handleAdjustGuests}
            className="text-[10px] uppercase font-semibold text-gold tracking-widest hover:text-gold-dark transition-colors"
          >
            AJUSTER
          </button>
        </div>
        <div className="text-[10px] text-ink-muted mt-2">Maximum : {residence.max_guests || 10} personnes</div>
      </div>

      {nights > 0 ? (
        <div className="space-y-4 mb-8 text-sm">
          <div className="flex justify-between items-center text-ink-muted">
            <span>{nights} Nuits &times; {new Intl.NumberFormat('fr-FR').format(pricePerNight)} FCFA</span>
            <span className="font-mono">{new Intl.NumberFormat('fr-FR').format(subtotal)} FCFA</span>
          </div>
          <div className="flex justify-between items-center text-ink-muted">
            <span>Service de Conciergerie Privée Dédiée</span>
            <span className="text-[10px] font-semibold text-royal uppercase tracking-wider">INCLUS GRACIÉ</span>
          </div>
          
          <div className="border-t border-gray-200 pt-6 mt-6 flex justify-between items-end">
            <span className="font-serif text-ink font-medium">Total Estimé du Séjour</span>
            <span className="font-serif text-2xl font-bold text-ink">{new Intl.NumberFormat('fr-FR').format(total)} FCFA</span>
          </div>
        </div>
      ) : (
        <div className="mb-8 text-center text-ink-muted text-sm italic">
          Sélectionnez vos dates pour afficher le devis.
        </div>
      )}

      {submitError && (
        <div role="alert" className="bg-red-50 text-red-600 p-3 rounded-sm text-sm border border-red-100 mb-4 text-center">
          {submitError}
        </div>
      )}

      <button
        type="button"
        className="bg-night text-white w-full py-4 text-[11px] uppercase tracking-[0.2em] transition-colors hover:bg-night/90 rounded-none disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={datesError || !arrive || !depart || !isValidStay || isSubmitting}
        onClick={handleBookingSubmit}
      >
        {isSubmitting ? 'Réservation en cours...' : !isAuthenticated ? 'Se connecter pour réserver' : 'Confirmer la réservation'}
      </button>
      
      {arrive && depart && !isValidStay && (
        <p className="text-xs text-red-500 mt-3 text-center">
          La durée minimum du séjour est de {minStay} nuits.
        </p>
      )}

      <p className="text-[10px] leading-relaxed text-ink-muted mt-6">
        <strong className="text-ink font-semibold">Engagement de Discrétion :</strong> Aucun débit bancaire immédiat. Notre bureau d'intendance prend contact sous 2 heures ouvrées pour valider l'habilitation et vos desiderata avant confirmation définitive.
      </p>
    </aside>
  );
}
