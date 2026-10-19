import React, { useState, useEffect, useMemo } from 'react';
import { DayPicker } from 'react-day-picker';
import { fr } from 'date-fns/locale';
import { format, startOfToday, parseISO, differenceInDays } from 'date-fns';
import { Calendar as CalendarIcon, Loader2, AlertCircle, Info } from 'lucide-react';
import api from '../../services/api';

/**
 * Composant Calendrier de Disponibilité Haute Couture
 * 
 * @param {Object} props
 * @param {Object} props.residence - La résidence concernée
 * @param {string} props.mode - 'range' (Meublé / Location) ou 'single' (Visite Achat)
 * @param {Object|Date} props.selected - Dates sélectionnées ({ from, to } ou Date)
 * @param {Function} props.onSelect - Callback appelé lors de la sélection
 * @param {number} props.minStay - Durée minimale du séjour en nuits (défaut: 1)
 */
export default function AvailabilityCalendar({
  residence,
  mode = 'range',
  selected,
  onSelect,
  minStay = 1
}) {
  const [blockedRanges, setBlockedRanges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const residenceSlug = residence?.slug || residence?.id;
  const today = useMemo(() => startOfToday(), []);

  // Chargement des dates bloquées depuis l'API backend
  useEffect(() => {
    let isMounted = true;
    if (!residenceSlug) return;

    const fetchBlockedDates = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await api.get(`/residences/${residenceSlug}/blocked-dates`);
        if (!isMounted) return;

        const data = Array.isArray(res) ? res : (res?.data || []);
        
        // Normaliser les intervalles bloqués
        const parsedRanges = data.map(item => ({
          from: parseISO(item.check_in),
          to: parseISO(item.check_out)
        }));

        setBlockedRanges(parsedRanges);
      } catch (err) {
        if (!isMounted) return;
        console.error('Erreur chargement dates bloquées :', err);
        setError("Impossible d'actualiser les disponibilités en temps réel.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchBlockedDates();

    return () => {
      isMounted = false;
    };
  }, [residenceSlug]);

  // Définir les jours désactivés
  const disabledDays = useMemo(() => {
    const list = [
      { before: today } // Tous les jours antérieurs à aujourd'hui
    ];

    blockedRanges.forEach(range => {
      // Bloque toutes les dates de check_in à check_out
      list.push({ from: range.from, to: range.to });
    });

    return list;
  }, [today, blockedRanges]);

  // Vérifie si une plage sélectionnée chevauche une date déjà bloquée
  const handleRangeSelect = (range) => {
    if (!range) {
      onSelect(range);
      return;
    }

    if (range.from && range.to) {
      // S'assurer qu'aucune date entre from et to n'est bloquée
      let hasConflict = false;
      for (const b of blockedRanges) {
        if (
          (range.from <= b.to && range.to >= b.from)
        ) {
          hasConflict = true;
          break;
        }
      }

      if (hasConflict) {
        // En cas de conflit, réinitialiser sur le point de départ
        onSelect({ from: range.from, to: undefined });
        return;
      }
    }

    onSelect(range);
  };

  const nightsCount = useMemo(() => {
    if (mode === 'range' && selected?.from && selected?.to) {
      return Math.max(0, differenceInDays(selected.to, selected.from));
    }
    return 0;
  }, [mode, selected]);

  return (
    <div className="w-full bg-[#FAFAF8] border border-ink/10 rounded-2xl p-3 sm:p-5 select-none font-sans overflow-hidden">
      {/* En-tête calendrier */}
      <div className="flex items-center justify-between pb-3 border-b border-ink/10 mb-3">
        <div className="flex items-center gap-2">
          <CalendarIcon size={14} className="text-gold" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-ink font-semibold">
            Calendrier des Disponibilités
          </span>
        </div>
        {isLoading && (
          <div className="flex items-center gap-1.5 text-xs text-ink-muted font-mono">
            <Loader2 size={12} className="animate-spin text-gold" />
            <span className="text-[9px] uppercase tracking-wider">Synchronisation...</span>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 text-[11px] rounded-lg flex items-center gap-2">
          <AlertCircle size={14} className="text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Calendrier React Day Picker avec styles Haute Couture */}
      <div className="flex justify-center rk-calendar-wrapper overflow-x-auto py-1 max-w-full">
        {mode === 'range' ? (
          <DayPicker
            mode="range"
            selected={selected}
            onSelect={handleRangeSelect}
            disabled={disabledDays}
            locale={fr}
            numberOfMonths={1}
            min={minStay}
            className="rk-day-picker"
          />
        ) : (
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={onSelect}
            disabled={disabledDays}
            locale={fr}
            numberOfMonths={1}
            className="rk-day-picker"
          />
        )}
      </div>

      {/* Légende Haute Couture */}
      <div className="mt-3 pt-3 border-t border-ink/10 flex flex-wrap items-center justify-between text-[10px] font-mono text-ink-muted gap-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-white border border-gray-300 inline-block" />
            <span>Disponible</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1A1A1A] inline-block" />
            <span>Sélectionné</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-200 line-through text-gray-400 inline-block" />
            <span>Réservé</span>
          </div>
        </div>

        {mode === 'range' && minStay > 1 && (
          <div className="flex items-center gap-1 text-gold">
            <Info size={11} />
            <span>Min. {minStay} nuits</span>
          </div>
        )}
      </div>

      {/* Résumé dynamique de la sélection */}
      {mode === 'range' && selected?.from && (
        <div className="mt-3 p-3 bg-white border border-gold/30 rounded-sm flex items-center justify-between text-xs">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-ink-muted block">Arrivée</span>
            <strong className="text-night font-serif text-sm">{format(selected.from, 'dd MMMM yyyy', { locale: fr })}</strong>
          </div>
          <div className="text-center font-mono text-[10px] uppercase text-gold px-2">
            {selected.to ? `${nightsCount} nuit${nightsCount > 1 ? 's' : ''}` : 'Sélectionnez le départ'}
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono uppercase tracking-widest text-ink-muted block">Départ</span>
            <strong className="text-night font-serif text-sm">
              {selected.to ? format(selected.to, 'dd MMMM yyyy', { locale: fr }) : '—'}
            </strong>
          </div>
        </div>
      )}

      {mode === 'single' && selected && (
        <div className="mt-3 p-3 bg-white border border-gold/30 rounded-sm flex items-center justify-between text-xs">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-ink-muted block">Date retenue</span>
            <strong className="text-night font-serif text-sm">{format(selected, 'EEEE dd MMMM yyyy', { locale: fr })}</strong>
          </div>
          <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-sm">Créneau disponible</span>
        </div>
      )}
    </div>
  );
}
