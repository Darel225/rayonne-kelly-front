import React, { useState, useEffect } from 'react';
import { X, Lock, Loader2, AlertCircle, Calendar as CalendarIcon, Check } from 'lucide-react';
import { format, parseISO, startOfToday, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import api from '../../services/api';
import { toast } from 'sonner';
import AvailabilityCalendar from '../residence/AvailabilityCalendar';

const REASON_PRESETS = [
  'Séjour Propriétaire',
  'Travaux & Rénovation',
  'Réservation externe (Airbnb / Booking)',
  'Maintenance & Inventaire',
  'Privatisation exclusive',
  'Autre motif'
];

export default function BlockDatesModal({ isOpen, onClose, onSuccess }) {
  const [residences, setResidences] = useState([]);
  const [selectedResidenceId, setSelectedResidenceId] = useState('');
  const [selectedRange, setSelectedRange] = useState({ from: undefined, to: undefined });
  const [reason, setReason] = useState(REASON_PRESETS[0]);
  const [customReason, setCustomReason] = useState('');
  
  const [isLoadingResidences, setIsLoadingResidences] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoadingResidences(true);
    setSubmitError(null);
    setSelectedRange({ from: undefined, to: undefined });
    setReason(REASON_PRESETS[0]);
    setCustomReason('');

    const fetchResidences = async () => {
      try {
        const res = await api.get('/admin/residences');
        if (!isMounted) return;
        const list = Array.isArray(res) ? res : (res?.data || []);
        setResidences(list);
        if (list.length > 0) {
          setSelectedResidenceId(String(list[0].id));
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('Erreur chargement résidences admin :', err);
        setSubmitError("Impossible de récupérer le catalogue des résidences.");
      } finally {
        if (isMounted) setIsLoadingResidences(false);
      }
    };

    fetchResidences();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const currentResidence = residences.find(r => String(r.id) === String(selectedResidenceId));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedResidenceId) {
      setSubmitError("Veuillez sélectionner une résidence.");
      return;
    }
    if (!selectedRange?.from || !selectedRange?.to) {
      setSubmitError("Veuillez sélectionner une période complète (date de début et date de fin).");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const checkIn = format(selectedRange.from, 'yyyy-MM-dd');
    const checkOut = format(selectedRange.to, 'yyyy-MM-dd');
    const finalReason = reason === 'Autre motif' && customReason.trim() ? customReason.trim() : reason;

    try {
      // Tentative vers le endpoint dédié admin
      try {
        await api.post('/admin/bookings/block-dates', {
          residence_id: Number(selectedResidenceId),
          check_in_date: checkIn,
          check_out_date: checkOut,
          reason: finalReason
        });
      } catch (adminErr) {
        // Fallback si la route dédiée admin n'est pas encore enregistrée dans le routeur backend :
        // Création d'une réservation spéciale avec payload standard
        await api.post('/bookings', {
          residence_id: Number(selectedResidenceId),
          check_in_date: checkIn,
          check_out_date: checkOut,
          guests_count: 1,
          special_requests: `[VERROUILLAGE ADMINISTRATIF] Motif : ${finalReason}`
        });
      }

      toast.success("Dates verrouillées avec succès. Elles sont désormais bloquées sur le catalogue public.");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.error || err.response?.data?.message || "Erreur lors du verrouillage des dates.";
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white max-w-2xl w-full rounded-sm shadow-2xl border border-ink/10 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink/10 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-night text-gold flex items-center justify-center">
              <Lock size={14} />
            </div>
            <div>
              <h3 className="font-serif text-lg text-ink font-medium">Verrouiller des Dates</h3>
              <p className="text-[10px] font-mono text-ink-muted uppercase tracking-wider">
                Blocage Manuel & Propriétaire
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-ink-muted hover:text-ink transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {submitError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-sm flex items-start gap-2">
              <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Choix de la résidence */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-mono text-ink-muted mb-2">
              Résidence à verrouiller *
            </label>
            {isLoadingResidences ? (
              <div className="h-10 bg-gray-100 animate-pulse rounded-sm" />
            ) : (
              <select
                value={selectedResidenceId}
                onChange={(e) => {
                  setSelectedResidenceId(e.target.value);
                  setSelectedRange({ from: undefined, to: undefined });
                }}
                className="w-full bg-white border border-ink/15 rounded-sm px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-royal"
                required
              >
                {residences.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.district || r.property_type}) &bull; Réf: {r.reference || r.id}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Calendrier de sélection des dates */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-mono text-ink-muted mb-2">
              Sélectionnez la période d'indisponibilité sur le calendrier *
            </label>
            {currentResidence && (
              <AvailabilityCalendar
                residence={currentResidence}
                mode="range"
                selected={selectedRange}
                onSelect={setSelectedRange}
                minStay={1}
              />
            )}
          </div>

          {/* Motif du verrouillage */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-mono text-ink-muted mb-2">
              Motif de l'indisponibilité *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
              {REASON_PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setReason(p)}
                  className={`text-left text-xs p-2.5 rounded-sm border transition-all ${
                    reason === p
                      ? 'border-royal bg-royal/5 text-royal font-medium'
                      : 'border-ink/10 hover:border-ink/30 text-ink-muted'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {reason === 'Autre motif' && (
              <input
                type="text"
                placeholder="Précisez la raison du blocage..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="w-full bg-white border border-ink/15 rounded-sm px-4 py-2 text-sm text-ink focus:outline-none focus:border-royal"
                required
              />
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-ink/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs uppercase tracking-widest text-ink-muted hover:text-ink transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedRange?.from || !selectedRange?.to}
              className="px-6 py-2.5 bg-night text-white text-xs uppercase tracking-widest font-semibold hover:bg-black transition-colors disabled:opacity-50 flex items-center gap-2 rounded-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin text-gold" />
                  Verrouillage en cours...
                </>
              ) : (
                <>
                  <Lock size={14} className="text-gold" />
                  Verrouiller cette période
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
