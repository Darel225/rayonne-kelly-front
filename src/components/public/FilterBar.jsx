import { MapPin, Home, BedDouble, Wallet, ChevronDown, KeyRound, Tag } from 'lucide-react';
import { TRANSACTION_TYPES, RESIDENCE_STATUSES } from '../../constants/residenceConstants';

export default function FilterBar({ filters, onChange, areaOptions }) {
  const handleSelect = (key, value) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="mb-14 border-y border-neutral-200/60 bg-white/40 backdrop-blur-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 divide-y sm:divide-y-0 sm:divide-x divide-neutral-200/60">

        {/* Transaction */}
        <div className="relative p-4 md:p-5 transition-colors hover:bg-neutral-50/50">
          <label htmlFor="filter-transaction" className="sr-only">Transaction</label>
          <div className="flex items-center gap-2 mb-2">
            <KeyRound size={13} className="text-gold" aria-hidden="true" />
            <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-night/50">Offre</span>
          </div>
          <div className="relative">
            <select
              id="filter-transaction"
              value={filters.transactionType || ""}
              onChange={(e) => handleSelect("transactionType", e.target.value)}
              className="w-full appearance-none bg-transparent py-1 pr-6 text-xs uppercase tracking-[0.1em] text-night font-medium outline-none cursor-pointer"
            >
              <option value="">Toutes les offres</option>
              {TRANSACTION_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.shortLabel}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-night/30" aria-hidden="true" />
          </div>
        </div>

        {/* Statut Commercial */}
        <div className="relative p-4 md:p-5 transition-colors hover:bg-neutral-50/50">
          <label htmlFor="filter-status" className="sr-only">Statut</label>
          <div className="flex items-center gap-2 mb-2">
            <Tag size={13} className="text-gold" aria-hidden="true" />
            <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-night/50">Statut</span>
          </div>
          <div className="relative">
            <select
              id="filter-status"
              value={filters.status || ""}
              onChange={(e) => handleSelect("status", e.target.value)}
              className="w-full appearance-none bg-transparent py-1 pr-6 text-xs uppercase tracking-[0.1em] text-night font-medium outline-none cursor-pointer"
            >
              <option value="">Tous les statuts</option>
              {RESIDENCE_STATUSES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-night/30" aria-hidden="true" />
          </div>
        </div>

        {/* Localisation */}
        <div className="relative p-4 md:p-5 transition-colors hover:bg-neutral-50/50">
          <label htmlFor="filter-location" className="sr-only">Localisation</label>
          <div className="flex items-center gap-2 mb-2">
            <MapPin size={13} className="text-gold" aria-hidden="true" />
            <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-night/50">Localisation</span>
          </div>
          <div className="relative">
            <select
              id="filter-location"
              value={filters.location}
              onChange={(e) => handleSelect("location", e.target.value)}
              className="w-full appearance-none bg-transparent py-1 pr-6 text-xs uppercase tracking-[0.1em] text-night outline-none cursor-pointer"
            >
              <option value="">Toutes les zones</option>
              {areaOptions.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-night/30" aria-hidden="true" />
          </div>
        </div>

        {/* Type de bien */}
        <div className="relative p-4 md:p-5 transition-colors hover:bg-neutral-50/50">
          <label htmlFor="filter-type" className="sr-only">Type de bien</label>
          <div className="flex items-center gap-2 mb-2">
            <Home size={13} className="text-gold" aria-hidden="true" />
            <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-night/50">Type</span>
          </div>
          <div className="relative">
            <select
              id="filter-type"
              value={filters.propertyType}
              onChange={(e) => handleSelect("propertyType", e.target.value)}
              className="w-full appearance-none bg-transparent py-1 pr-6 text-xs uppercase tracking-[0.1em] text-night outline-none cursor-pointer"
            >
              <option value="">Tous les types</option>
              <option value="appartement">Appartement</option>
              <option value="villa">Villa</option>
              <option value="penthouse">Penthouse</option>
            </select>
            <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-night/30" aria-hidden="true" />
          </div>
        </div>

        {/* Chambres */}
        <div className="relative p-4 md:p-5 transition-colors hover:bg-neutral-50/50">
          <label htmlFor="filter-rooms" className="sr-only">Chambres</label>
          <div className="flex items-center gap-2 mb-2">
            <BedDouble size={13} className="text-gold" aria-hidden="true" />
            <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-night/50">Chambres</span>
          </div>
          <div className="relative">
            <select
              id="filter-rooms"
              value={filters.rooms}
              onChange={(e) => handleSelect("rooms", e.target.value)}
              className="w-full appearance-none bg-transparent py-1 pr-6 text-xs uppercase tracking-[0.1em] text-night outline-none cursor-pointer"
            >
              <option value="">Peu importe</option>
              <option value="1">1 chambre</option>
              <option value="2">2 chambres</option>
              <option value="3">3+ chambres</option>
            </select>
            <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-night/30" aria-hidden="true" />
          </div>
        </div>

        {/* Budget */}
        <div className="relative p-4 md:p-5 transition-colors hover:bg-neutral-50/50">
          <label htmlFor="filter-budget" className="sr-only">Budget</label>
          <div className="flex items-center gap-2 mb-2">
            <Wallet size={13} className="text-gold" aria-hidden="true" />
            <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-night/50">Budget</span>
          </div>
          <div className="relative">
            <select
              id="filter-budget"
              value={filters.budget}
              onChange={(e) => handleSelect("budget", e.target.value)}
              className="w-full appearance-none bg-transparent py-1 pr-6 text-xs uppercase tracking-[0.1em] text-night outline-none cursor-pointer"
            >
              <option value="">Peu importe</option>
              <option value="100k">- de 100k FCFA</option>
              <option value="300k">100k - 300k FCFA</option>
              <option value="500k">300k+ FCFA</option>
            </select>
            <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-night/30" aria-hidden="true" />
          </div>
        </div>

      </div>
    </div>
  );
}
