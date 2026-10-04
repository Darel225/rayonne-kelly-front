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
  const [budget, setBudget] = useState('');

  const premiumEase = [0.22, 1, 0.36, 1];

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (location) params.set('location', location);
    if (propertyType) params.set('type', propertyType);
    if (rooms) params.set('rooms', rooms);
    if (budget) params.set('budget', budget);
    
    navigate(`/collection?${params.toString()}`);
  };

  const handleQuickTag = (tag) => {
    const params = new URLSearchParams();
    const t = tag.toLowerCase();
    if (t === 'appartements') params.set('type', 'appartement');
    else if (t === 'villas') params.set('type', 'villa');
    // Si 'tous', on ne met rien pour tout afficher
    
    navigate(`/collection?${params.toString()}`);
  };

  return (
    <div className="w-full mt-8 max-w-5xl mx-auto">
      {/* Barre principale (Pilule sur Desktop) */}
      <motion.div 
        className="bg-white shadow-2xl md:rounded-full rounded-2xl flex flex-col md:flex-row items-stretch md:pl-8 md:pr-2 md:py-2"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 1.2, ease: premiumEase, delay: 0.1 }}
      >
        
        {/* Toggle Mobile */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-100">
          <span className="text-xs uppercase tracking-widest text-ink font-medium">Rechercher un bien</span>
          <button 
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-2 bg-gray-50 text-ink-muted hover:text-royal rounded-md"
          >
            <SlidersHorizontal size={18} />
          </button>
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
              <option value="appartement">Appartement</option>
              <option value="villa">Villa</option>
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
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Budget</label>
            <select 
              className="w-full text-sm text-ink outline-none bg-transparent appearance-none font-serif cursor-pointer"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
            >
              <option value="">Peu importe</option>
              <option value="100k">- de 100k FCFA</option>
              <option value="300k">100k - 300k FCFA</option>
              <option value="500k">300k+ FCFA</option>
            </select>
          </div>
        </div>

        {/* Bouton de recherche */}
        <div className="p-4 md:p-0 flex items-center justify-center">
          <button 
            onClick={handleSearch}
            className="bg-royal hover:bg-royal-dark transition-colors text-white flex items-center justify-center py-3 md:py-4 px-8 rounded-full w-full md:w-auto group shadow-md"
          >
            <Search size={18} className="mr-2 group-hover:scale-110 transition-transform duration-300" />
            <span className="text-sm font-medium">Rechercher</span>
          </button>
        </div>
      </motion.div>

      {/* Filtres rapides (Style tags) */}
      <motion.div 
        className="mt-6 flex flex-wrap justify-center items-center gap-3"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 1.2, ease: premiumEase, delay: 0.25 }}
      >
        {['Tous', 'Meublés', 'Appartements', 'Villas', 'Location', 'Vente'].map((tag) => (
          <span 
            key={tag} 
            onClick={() => handleQuickTag(tag)}
            className="px-5 py-2 rounded-full border border-gray-200 text-sm font-medium text-gray-600 hover:border-black hover:text-black transition-all cursor-pointer"
          >
            {tag}
          </span>
        ))}
      </motion.div>
    </div>
  );
}
