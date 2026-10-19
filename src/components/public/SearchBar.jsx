import { useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function SearchBar() {
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  const [location, setLocation] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [rooms, setRooms] = useState('');
  const [guests, setGuests] = useState('');

  const premiumEase = [0.22, 1, 0.36, 1];

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (location) params.set('location', location);
    if (propertyType) params.set('type', propertyType);
    if (rooms) params.set('rooms', rooms);
    if (guests) params.set('guests', guests);
    
    navigate(`/collection?${params.toString()}`);
  };

  return (
    <div className="w-full mt-4 max-w-5xl mx-auto">
      {/* Barre principale (Pilule sur Desktop) */}
      <motion.div 
        className="bg-white shadow-xl shadow-night/5 border border-gray-100 md:rounded-full rounded-2xl flex flex-col md:flex-row items-stretch md:pl-8 md:pr-2 md:py-2"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 1.0, ease: premiumEase, delay: 0.1 }}
      >
        
        {/* Toggle Mobile Interactif */}
        <div 
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsMobileOpen(!isMobileOpen); }}
          className="md:hidden flex items-center justify-between p-4 cursor-pointer select-none active:bg-gray-50 transition-colors border-b border-gray-100"
        >
          <div className="flex items-center gap-2.5">
            <Search size={16} className="text-royal" />
            <span className="text-xs uppercase tracking-widest text-ink font-semibold">
              {isMobileOpen ? 'Filtres de recherche' : 'Rechercher un bien'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-ink-muted">
              {isMobileOpen ? 'Fermer' : 'Affiner'}
            </span>
            <div className={`p-1.5 rounded-full transition-all duration-300 ${isMobileOpen ? 'bg-royal text-white rotate-90 shadow-sm' : 'bg-gray-100 text-ink-muted'}`}>
              <SlidersHorizontal size={14} />
            </div>
          </div>
        </div>

        {/* Champs */}
        <div className={`${isMobileOpen ? 'flex' : 'hidden'} md:flex flex-col md:flex-row flex-1`}>
          
          <div className="flex-1 p-4 md:py-2 md:px-6 md:border-r border-b md:border-b-0 border-gray-200 flex flex-col justify-center">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Localisation</label>
            <input 
              type="text" 
              placeholder="Où souhaitez-vous aller ?" 
              className="w-full text-sm text-ink outline-none bg-transparent placeholder-gray-400 font-serif"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>

          <div className="flex-1 p-4 md:py-2 md:px-6 md:border-r border-b md:border-b-0 border-gray-200 flex flex-col justify-center">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Type de bien</label>
            <select 
              className="w-full text-sm text-ink outline-none bg-transparent appearance-none font-serif cursor-pointer"
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
            >
              <option value="">Tous les types</option>
              <option value="villa">Villa</option>
              <option value="appartement">Appartement</option>
              <option value="penthouse">Penthouse</option>
            </select>
          </div>

          <div className="flex-1 p-4 md:py-2 md:px-6 md:border-r border-b md:border-b-0 border-gray-200 flex flex-col justify-center">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Chambres</label>
            <select 
              className="w-full text-sm text-ink outline-none bg-transparent appearance-none font-serif cursor-pointer"
              value={rooms}
              onChange={(e) => setRooms(e.target.value)}
            >
              <option value="">Peu importe</option>
              <option value="1">1 chambre</option>
              <option value="2">2 chambres</option>
              <option value="3">3+ chambres</option>
            </select>
          </div>

          <div className="flex-1 p-4 md:py-2 md:px-6 border-b md:border-b-0 border-gray-200 flex flex-col justify-center">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Voyageurs</label>
            <select 
              className="w-full text-sm text-ink outline-none bg-transparent appearance-none font-serif cursor-pointer"
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
            >
              <option value="">Toute capacité</option>
              <option value="2">1 à 2 personnes</option>
              <option value="4">3 à 4 personnes</option>
              <option value="6">5 personnes et +</option>
            </select>
          </div>
        </div>

        {/* Bouton de recherche (Strictement conservé avec la couleur signature de Rayonne Kelly) */}
        <div className={`${isMobileOpen ? 'flex' : 'hidden'} md:flex p-4 md:p-0 items-center justify-center`}>
          <button 
            onClick={handleSearch}
            className="bg-royal hover:bg-royal-dark transition-colors text-white flex items-center justify-center py-3.5 md:py-4 px-8 rounded-full w-full md:w-auto group shadow-md cursor-pointer"
          >
            <Search size={18} className="mr-2 group-hover:scale-110 transition-transform duration-300" />
            <span className="text-sm font-medium">Rechercher</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
