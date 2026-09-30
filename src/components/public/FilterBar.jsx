import { MapPin, KeyRound, BedDouble, ChevronDown } from 'lucide-react';

export default function FilterBar({ filters, onChange, areaOptions, amenityOptions }) {
  const handleSelect = (key, value) => {
    onChange({ ...filters, [key]: value });
  };

  const toggleAmenity = (id) => {
    const next = filters.amenities.includes(id)
      ? filters.amenities.filter(a => a !== id)
      : [...filters.amenities, id];
    onChange({ ...filters, amenities: next });
  };

  return (
    <div className="mb-14 border-y border-neutral-200/60">
      <div className="flex flex-col md:flex-row md:items-center">

        {/* Destination */}
        <div className="relative flex-1 border-b md:border-b-0 md:border-r border-neutral-200/60 p-4 md:p-6 transition-colors hover:bg-neutral-50/50">
          <label htmlFor="filter-area" className="sr-only">Destination</label>
          <div className="flex items-center gap-3 mb-2">
            <MapPin size={14} className="text-gold" aria-hidden="true" />
            <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-night/40">Destination</span>
          </div>
          <div className="relative">
            <select
              id="filter-area"
              value={filters.area}
              onChange={(e) => handleSelect("area", e.target.value)}
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

        {/* Capacity */}
        <div className="relative flex-1 border-b md:border-b-0 md:border-r border-neutral-200/60 p-4 md:p-6 transition-colors hover:bg-neutral-50/50">
          <label htmlFor="filter-guests" className="sr-only">Capacité</label>
          <div className="flex items-center gap-3 mb-2">
            <BedDouble size={14} className="text-gold" aria-hidden="true" />
            <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-night/40">Capacité</span>
          </div>
          <div className="relative">
            <select
              id="filter-guests"
              value={filters.minGuests}
              onChange={(e) => handleSelect("minGuests", Number(e.target.value))}
              className="w-full appearance-none bg-transparent py-1 pr-8 text-xs uppercase tracking-[0.1em] text-night outline-none cursor-pointer"
            >
              <option value={0}>Tous les voyageurs</option>
              <option value={2}>2 voyageurs et plus</option>
              <option value={4}>4 voyageurs et plus</option>
              <option value={6}>6 voyageurs et plus</option>
            </select>
            <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-night/30" aria-hidden="true" />
          </div>
        </div>

        {/* Price Slider */}
        <div className="relative flex-1 p-4 md:p-6 transition-colors hover:bg-neutral-50/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-night/40">Budget Min.</span>
            <span className="text-xs font-serif text-night">
              {`${new Intl.NumberFormat("fr-FR").format(filters.minPrice)}+ FCFA`}
            </span>
          </div>
          <input
            type="range"
            min={50000}
            max={400000}
            step={10000}
            value={filters.minPrice}
            onChange={(e) => handleSelect("minPrice", Number(e.target.value))}
            className="w-full h-0.5 bg-neutral-200 appearance-none accent-gold cursor-pointer"
            aria-label="Prix minimum par nuit"
          />
        </div>

      </div>
    </div>
  );
}
