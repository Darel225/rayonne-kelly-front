import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight, ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import Button from '../../components/common/Button';
import api from '../../services/api';

const BACKEND_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1').replace('/api/v1', '');

const mapResidence = (row) => {
  let imgUrl = row.cover_image_url;
  if (imgUrl && imgUrl.startsWith('/')) {
    imgUrl = `${BACKEND_URL}${imgUrl}`;
  }

  return {
    id: row.id,
    city: row.district || row.city || row.address || '',
    name: row.name || '',
    specs: [
      { label: 'LOCALISATION', value: row.district || row.city || '—' },
      { label: 'CAPACITÉ', value: row.guests_capacity ? `${row.guests_capacity} Voyageurs` : '—' },
      { label: 'PIÈCES', value: row.rooms_count ? `${row.rooms_count} Pièces` : '—' }
    ],
    price: Number(row.price_per_night),
    img: imgUrl || 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=600&q=80',
    isActive: Number(row.is_active) === 1
  };
};

const getStatusConfig = (isActive) => {
  return {
    text: isActive ? 'DISPONIBLE' : 'HORS LIGNE',
    color: isActive ? 'bg-night text-white' : 'bg-red-500 text-white'
  };
};



export default function ResidencesManagement() {
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('Toutes les villes');
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCity]);

  const fetchResidences = useCallback(async (controller) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/admin/residences', { signal: controller?.signal });
      const responseData = response.data?.data || response.data || response || [];
      const mapped = (Array.isArray(responseData) ? responseData : []).map(row => {
        const mappedProp = mapResidence(row);
        const statusConfig = getStatusConfig(mappedProp.isActive);
        return {
          ...mappedProp,
          status: statusConfig.text,
          statusColor: statusConfig.color
        };
      });
      setProperties(mapped);
    } catch (err) {
      if (err.name === 'AbortError' || err.name === 'CanceledError') return;
      const errorMsg = err.response?.data?.error 
        || err.response?.data?.message 
        || (err.response ? "Impossible de charger les résidences." : "Connexion impossible au serveur.");
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchResidences(controller);
    return () => controller.abort();
  }, [fetchResidences]);

  const uniqueCities = useMemo(() => {
    const cities = properties.map(p => p.city).filter(c => c && c.trim() !== '');
    return ['Toutes les villes', ...new Set(cities)].sort((a, b) => {
      if (a === 'Toutes les villes') return -1;
      if (b === 'Toutes les villes') return 1;
      return a.localeCompare(b);
    });
  }, [properties]);

  const filteredProperties = useMemo(() => {
    return properties.filter((prop) => {
      const s = searchTerm.toLowerCase();
      const matchSearch = (prop.name ?? '').toLowerCase().includes(s) || 
                          (prop.city ?? '').toLowerCase().includes(s);
      const matchCity = selectedCity === 'Toutes les villes' || (prop.city ?? '').toLowerCase() === selectedCity.toLowerCase();
      return matchSearch && matchCity;
    });
  }, [properties, searchTerm, selectedCity]);

  const totalPages = Math.ceil(filteredProperties.length / ITEMS_PER_PAGE);
  const paginatedProperties = filteredProperties.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-royal">
        <span className="w-1.5 h-1.5 bg-royal rounded-full" aria-hidden="true"></span>
        Gestion du Catalogue
      </div>
      
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mt-2">
        <h1 className="font-serif text-4xl text-ink">Portfolio Propriétés</h1>
        {/* TODO: wire creation flow */}
        <Button variant="royal" onClick={() => navigate('/admin/residences/create')} className="uppercase tracking-widest text-xs whitespace-nowrap">
          + Ajouter une résidence
        </Button>
      </div>

      {/* Filters row */}
      <div className="mt-10 flex flex-col sm:flex-row gap-4">
        <label htmlFor="residence-search" className="sr-only">Rechercher une résidence</label>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted h-4 w-4" />
          <input 
            id="residence-search" 
            type="text" 
            placeholder="Rechercher une résidence, une zone..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-ink/15 rounded-[1px] pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-royal" 
          />
        </div>
        
        <label htmlFor="residence-city" className="sr-only">Filtrer par ville</label>
        <select 
          id="residence-city" 
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          className="bg-white border border-ink/15 rounded-[1px] px-4 py-2 text-sm focus:outline-none focus:border-royal"
        >
          {uniqueCities.map(city => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="bg-white border border-ink/10 rounded-[1px] flex flex-col h-[450px]">
              <div className="h-48 w-full bg-gray-200 animate-pulse rounded-t-[1px]"></div>
              <div className="p-6 flex flex-col flex-1">
                <div className="h-3 w-24 bg-gray-200 animate-pulse mb-4"></div>
                <div className="h-6 w-48 bg-gray-200 animate-pulse mb-6"></div>
                <div className="space-y-4 mt-2 flex-1">
                  <div className="h-4 w-full bg-gray-200 animate-pulse"></div>
                  <div className="h-4 w-full bg-gray-200 animate-pulse"></div>
                  <div className="h-4 w-full bg-gray-200 animate-pulse"></div>
                </div>
                <div className="mt-auto pt-6 flex justify-between items-center border-t border-ink/10">
                  <div className="h-6 w-32 bg-gray-200 animate-pulse"></div>
                  <div className="h-8 w-20 bg-gray-200 animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="py-20 flex flex-col items-center justify-center text-ink-muted mt-10 bg-white border border-ink/10 rounded-[1px]">
          <AlertCircle className="h-8 w-8 mb-4 text-red-500" />
          <p className="mb-4 text-sm">{error}</p>
          <Button onClick={() => fetchResidences(new AbortController())} variant="outline" className="text-xs uppercase tracking-widest px-6 py-2">
            Réessayer
          </Button>
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-ink-muted mt-10 bg-white border border-ink/10 rounded-[1px]">
          <Search className="h-8 w-8 mb-4 opacity-20" />
          <p className="text-sm">Aucune résidence trouvée.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10" role="list">
        {paginatedProperties.map((prop) => (
          <article key={prop.id} role="listitem" className="bg-white border border-ink/10 rounded-[1px] flex flex-col group shadow-sm hover:shadow-md transition-shadow">
            <div className="relative h-48 w-full overflow-hidden rounded-t-[1px]">
              <img 
                src={prop.img} 
                alt={`${prop.name}, ${prop.city}`} 
                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700" 
                loading="lazy" 
              />
              <span className={`absolute top-3 left-3 text-[9px] uppercase tracking-widest px-2.5 py-1 font-mono ${prop.statusColor}`}>
                {prop.status}
              </span>
            </div>
            
            <div className="p-6 flex flex-col flex-1">
              <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-ink-muted">
                {prop.city} • RÉF. {prop.id}
              </span>
              <h2 className="font-serif text-2xl text-ink mt-2">{prop.name}</h2>
              
              <ul className="mt-6 flex flex-col w-full">
                {prop.specs.map((spec, idx) => (
                  <li key={idx} className="flex items-center justify-between py-2 border-b border-ink/10 last:border-0">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-ink-muted">
                      {spec.label}
                    </span>
                    <span className="text-xs text-ink font-medium">
                      {spec.value}
                    </span>
                  </li>
                ))}
              </ul>
              
              <div className="mt-auto pt-6 flex items-center justify-between border-t border-ink/10">
                <div>
                  <div className="font-serif text-xl text-ink">
                    {prop.price.toLocaleString('fr-FR')} FCFA
                    <span className="text-[9px] font-mono uppercase tracking-widest text-ink-muted ml-1">/ nuit</span>
                  </div>
                </div>
                {/* TODO: route not yet wired — will 404 until EditResidence.jsx is connected */}
                <Button 
                  variant="royal" 
                  onClick={() => navigate(`/admin/residences/${prop.id}/edit`)} 
                  className="uppercase tracking-widest text-[10px] px-3 py-2"
                >
                  Gérer <ArrowRight className="h-3 w-3 ml-1.5 inline" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>
      )}

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-10 pb-16 text-xs text-ink-muted gap-3">
        <div>
          Affichage de {paginatedProperties.length} sur {filteredProperties.length} propriétés
        </div>
        <div className="flex items-center gap-2">
          <button 
            type="button" 
            disabled={currentPage === 1} 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            className="p-1 hover:text-ink disabled:opacity-30 transition-colors" 
            aria-label="Page précédente"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="px-2">
            {currentPage} / {totalPages > 0 ? totalPages : 1}
          </span>
          <button 
            type="button" 
            disabled={currentPage === totalPages || totalPages === 0} 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            className="p-1 hover:text-ink disabled:opacity-30 transition-colors" 
            aria-label="Page suivante"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

    </div>
  );
}
