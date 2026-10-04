import { MapPin, Home, BedDouble, Wallet, ChevronDown } from 'lucide-react';

export default function FilterBar({ filters, onChange, areaOptions }) {
  const handleSelect = (key, value) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="mb-14 border-y border-neutral-200/60">
      <div className="flex flex-col md:flex-row md:items-center">

        {/* Localisation */}
        <div className="relative flex-1 border-b md:border-b-0 md:border-r border-neutral-200/60 p-4 md:p-6 transition-colors hover:bg-neutral-50/50">
          <label htmlFor="filter-location" className="sr-only">Localisation</label>
          <div className="flex items-center gap-3 mb-2">
            <MapPin size={14} className="text-gold" aria-hidden="true" />
            <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-night/40">Localisation</span>
          </div>
          <div className="relative">
            <select
              id="filter-location"
              value={filters.location}
              onChange={(e) => handleSelect("location", e.target.value)}
              className="w-full appearance-none bg-transparent py-1 pr-8 text-xs uppercase tracking-[0.1em] text-night outline-none cursor-pointer"
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
        <div className="relative flex-1 border-b md:border-b-0 md:border-r border-neutral-200/60 p-4 md:p-6 transition-colors hover:bg-neutral-50/50">
          <label htmlFor="filter-type" className="sr-only">Type de bien</label>
          <div className="flex items-center gap-3 mb-2">
            <Home size={14} className="text-gold" aria-hidden="true" />
            <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-night/40">Type de bien</span>
          </div>
          <div className="relative">
            <select
              id="filter-type"
              value={filters.propertyType}
              onChange={(e) => handleSelect("propertyType", e.target.value)}
              className="w-full appearance-none bg-transparent py-1 pr-8 text-xs uppercase tracking-[0.1em] text-night outline-none cursor-pointer"
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
        <div className="relative flex-1 border-b md:border-b-0 md:border-r border-neutral-200/60 p-4 md:p-6 transition-colors hover:bg-neutral-50/50">
          <label htmlFor="filter-rooms" className="sr-only">Chambres</label>
          <div className="flex items-center gap-3 mb-2">
            <BedDouble size={14} className="text-gold" aria-hidden="true" />
            <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-night/40">Chambres</span>
          </div>
          <div className="relative">
            <select
              id="filter-rooms"
              value={filters.rooms}
              onChange={(e) => handleSelect("rooms", e.target.value)}
              className="w-full appearance-none bg-transparent py-1 pr-8 text-xs uppercase tracking-[0.1em] text-night outline-none cursor-pointer"
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
        <div className="relative flex-1 p-4 md:p-6 transition-colors hover:bg-neutral-50/50">
          <label htmlFor="filter-budget" className="sr-only">Budget</label>
          <div className="flex items-center gap-3 mb-2">
            <Wallet size={14} className="text-gold" aria-hidden="true" />
            <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-night/40">Budget</span>
          </div>
          <div className="relative">
            <select
              id="filter-budget"
              value={filters.budget}
              onChange={(e) => handleSelect("budget", e.target.value)}
              className="w-full appearance-none bg-transparent py-1 pr-8 text-xs uppercase tracking-[0.1em] text-night outline-none cursor-pointer"
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
