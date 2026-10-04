import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Check } from 'lucide-react';
import api from '../../services/api';
import { SLA_HOURS_MAX } from '../../constants/sla';

export default function BookingModal({ isOpen, onClose, residence }) {
  const [bookingData, setBookingData] = useState({
    check_in_date: '',
    check_out_date: '',
    guests_count: 1,
    special_requests: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Réinitialisation de l'état quand la modale s'ouvre
  useEffect(() => {
    if (isOpen) {
      setIsSuccess(false);
      setSubmitError(null);
      setBookingData({ check_in_date: '', check_out_date: '', guests_count: 1, special_requests: '' });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await api.post('/bookings', {
        residence_id: residence.id,
        ...bookingData
      });
      setIsSuccess(true);
    } catch (err) {
      console.error(err);
      setSubmitError(err.response?.data?.message || 'Une erreur est survenue lors de votre demande.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Fond flouté sombre */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={!isSuccess ? onClose : undefined}
      />

      {/* Conteneur de la Modale */}
      <div className="bg-white shadow-2xl p-10 max-w-lg w-full relative animate-in fade-in zoom-in duration-500 overflow-hidden">
        
        {/* Décoration d'arrière-plan très subtile */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        {!isSuccess && (
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-ink-muted hover:text-ink transition-colors z-10"
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
            
            <h3 className="font-serif text-3xl text-night mb-4 font-light">Demande bien reçue.</h3>
            
            <div className="w-12 h-[1px] bg-gold/50 mx-auto mb-6" />
            
            <p className="font-serif text-[15px] text-ink/80 leading-relaxed mb-10 max-w-sm mx-auto">
              Vos dates ont été confiées à notre équipe. Un membre de notre conciergerie privée vous contactera sous {SLA_HOURS_MAX || 2} heures pour finaliser votre séjour sur-mesure.
            </p>

            <button
              onClick={onClose}
              className="px-8 py-4 bg-night text-white text-[10px] uppercase tracking-[0.2em] font-semibold hover:bg-black transition-all duration-500 w-full sm:w-auto"
            >
              Retourner à la collection
            </button>
          </div>
        ) : (
          /* ÉTAT FORMULAIRE - HAUTE COUTURE */
          <div className="relative z-10 animate-in fade-in duration-500">
            <h3 className="font-serif text-3xl text-night mb-2 font-light">L'Invitation</h3>
            <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-ink-muted mb-10">
              Résidence <span className="text-gold font-semibold">{residence?.name}</span>
            </p>

            {submitError && (
              <div className="p-4 bg-red-50 text-red-800 border border-red-100 text-sm mb-8 font-sans">
                {submitError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div className="relative group">
                  <label className="block text-[9px] font-bold text-ink-muted uppercase tracking-[0.2em] mb-2 transition-colors group-hover:text-gold">Arrivée</label>
                  <input
                    type="date"
                    required
                    min={today}
                    value={bookingData.check_in_date}
                    onChange={(e) => setBookingData({...bookingData, check_in_date: e.target.value})}
                    className="w-full border-0 border-b border-gray-200 bg-transparent px-0 py-2 font-serif text-lg text-night focus:ring-0 focus:border-gold outline-none transition-colors"
                  />
                </div>
                <div className="relative group">
                  <label className="block text-[9px] font-bold text-ink-muted uppercase tracking-[0.2em] mb-2 transition-colors group-hover:text-gold">Départ</label>
                  <input
                    type="date"
                    required
                    min={bookingData.check_in_date || today}
                    value={bookingData.check_out_date}
                    onChange={(e) => setBookingData({...bookingData, check_out_date: e.target.value})}
                    className="w-full border-0 border-b border-gray-200 bg-transparent px-0 py-2 font-serif text-lg text-night focus:ring-0 focus:border-gold outline-none transition-colors"
                  />
                </div>
              </div>
              
              <div className="relative group">
                <label className="block text-[9px] font-bold text-ink-muted uppercase tracking-[0.2em] mb-2 transition-colors group-hover:text-gold">Nombre de convives</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={residence?.max_guests || 10}
                  value={bookingData.guests_count}
                  onChange={(e) => setBookingData({...bookingData, guests_count: parseInt(e.target.value)})}
                  className="w-full border-0 border-b border-gray-200 bg-transparent px-0 py-2 font-serif text-lg text-night focus:ring-0 focus:border-gold outline-none transition-colors"
                />
              </div>

              <div className="relative group">
                <label className="block text-[9px] font-bold text-ink-muted uppercase tracking-[0.2em] mb-2 transition-colors group-hover:text-gold">Préférences (Optionnel)</label>
                <textarea
                  rows="2"
                  value={bookingData.special_requests}
                  onChange={(e) => setBookingData({...bookingData, special_requests: e.target.value})}
                  className="w-full border-0 border-b border-gray-200 bg-transparent px-0 py-2 font-serif text-[15px] text-night focus:ring-0 focus:border-gold outline-none resize-none transition-colors placeholder:text-gray-300 placeholder:font-sans placeholder:text-sm"
                  placeholder="Transfert aéroport, chef privé..."
                ></textarea>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="relative w-full bg-night text-white py-5 text-[10px] font-bold uppercase tracking-[0.3em] overflow-hidden group disabled:opacity-70 transition-colors"
                >
                  <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
                  
                  <span className="relative flex items-center justify-center gap-3">
                    {isSubmitting ? (
                      <>
                        <span className="w-1.5 h-1.5 bg-gold rounded-full animate-ping" />
                        Transmission en cours...
                      </>
                    ) : 'Confier ma demande'}
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
