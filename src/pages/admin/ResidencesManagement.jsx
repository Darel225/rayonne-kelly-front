import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  AlertCircle, 
  Plus, 
  Building2, 
  Home, 
  Key, 
  Tag, 
  EyeOff, 
  RefreshCw,
  X
} from 'lucide-react';
import Button from '../../components/common/Button';
import api from '../../services/api';
import { getTransactionType, getResidenceStatus, TRANSACTION_TYPES, RESIDENCE_STATUSES } from '../../constants/residenceConstants';

const BACKEND_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1').replace('/api/v1', '');

const getStatusBadge = (statusObj, isActive) => {
  if (!isActive) {
    return {
      text: 'HORS LIGNE (MASQUÉ)',
      color: 'bg-zinc-800 text-zinc-300 border border-zinc-600'
    };
  }
  switch (statusObj.value) {
    case 'vendu':
      return { text: 'DÉJÀ VENDU', color: 'bg-night text-gold border border-gold/40' };
    case 'loue':
      return { text: 'DÉJÀ LOUÉ', color: 'bg-ink/80 text-white' };
    case 'reserve':
      return { text: 'RÉSERVÉ', color: 'bg-amber-600 text-white' };
    case 'disponible':
    default:
      return { text: 'DISPONIBLE', color: 'bg-emerald-700 text-white' };
  }
};

const mapResidence = (row) => {
  let imgUrl = row.cover_image_url;
  if (imgUrl && imgUrl.startsWith('/')) {
    imgUrl = `${BACKEND_URL}${imgUrl}`;
  }

  const rawTx = row.transaction_type || (typeof window !== 'undefined' ? localStorage.getItem(`rk_tx_type_${row.id}`) : null) || 'meuble';
  const rawStatus = row.status || (typeof window !== 'undefined' ? localStorage.getItem(`rk_status_${row.id}`) : null) || 'disponible';

  const txTypeObj = getTransactionType(rawTx);
  const statusObj = getResidenceStatus(rawStatus);
  const isActive = Number(row.is_active) === 1;
  const statusBadge = getStatusBadge(statusObj, isActive);

  return {
    id: row.id,
    city: row.district || row.city || row.address || '',
    name: row.name || '',
    specs: [
      { label: 'TYPE D\'OFFRE', value: txTypeObj.label },
      { label: 'LOCALISATION', value: row.district || row.city || '—' },
      { label: 'PIÈCES', value: row.rooms_count ? `${row.rooms_count} Pièces` : '—' }
    ],
    price: txTypeObj.value === 'vente' 
      ? (Number(row.price_sale) || Number(row.price_per_night) || 0)
      : (Number(row.price_per_night) || Number(row.price_sale) || 0),
    priceSuffix: txTypeObj.priceSuffix,
    img: imgUrl || 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=600&q=80',
    isActive,
    transactionType: txTypeObj,
    statusValue: statusObj.value,
    status: statusBadge.text,
    statusColor: statusBadge.color
  };
};

export default function ResidencesManagement() {
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('Toutes les villes');
  const [selectedTxType, setSelectedTxType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const navigate = useNavigate();

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  const fetchResidences = useCallback(async (controller) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/admin/residences', { signal: controller?.signal });
      const responseData = response.data?.data || response.data || response || [];
      const mapped = (Array.isArray(responseData) ? responseData : []).map(mapResidence);
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

  // KPIs
  const stats = useMemo(() => {
    const total = properties.length;
    const meubleCount = properties.filter(p => p.transactionType.value === 'meuble').length;
    const locationCount = properties.filter(p => p.transactionType.value === 'location').length;
    const venteCount = properties.filter(p => p.transactionType.value === 'vente').length;
    const hiddenCount = properties.filter(p => !p.isActive).length;
    return { total, meubleCount, locationCount, venteCount, hiddenCount };
  }, [properties]);

  const uniqueCities = useMemo(() => {
    const cities = properties.map(p => p.city).filter(c => c && c.trim() !== '');
    return ['Toutes les villes', ...new Set(cities)].sort((a, b) => {
      if (a === 'Toutes les villes') return -1;
      if (b === 'Toutes les villes') return 1;
      return a.localeCompare(b);
    });
  }, [properties]);

  // Filtrage combiné
  const filteredProperties = useMemo(() => {
    return properties.filter((prop) => {
      // Filtre transaction tab
      if (selectedTxType === 'offline' && prop.isActive) return false;
      if (selectedTxType !== 'all' && selectedTxType !== 'offline' && prop.transactionType.value !== selectedTxType) return false;

      // Filtre statut
      if (selectedStatus !== 'all' && prop.statusValue !== selectedStatus) return false;

      // Filtre ville
      if (selectedCity !== 'Toutes les villes' && prop.city.toLowerCase() !== selectedCity.toLowerCase()) return false;

      // Recherche
      if (searchTerm.trim()) {
        const s = searchTerm.toLowerCase().trim();
        const matchName = (prop.name ?? '').toLowerCase().includes(s);
        const matchCity = (prop.city ?? '').toLowerCase().includes(s);
        if (!matchName && !matchCity) return false;
      }

      return true;
    });
  }, [properties, searchTerm, selectedCity, selectedTxType, selectedStatus]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCity, selectedTxType, selectedStatus, itemsPerPage]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredProperties.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredProperties.length);
  const paginatedProperties = filteredProperties.slice(startIndex, endIndex);

  const paginationRange = useMemo(() => {
    const delta = 1;
    const range = [];
    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }
    if (currentPage - delta > 2) range.unshift('...');
    if (currentPage + delta < totalPages - 1) range.push('...');
    range.unshift(1);
    if (totalPages > 1) range.push(totalPages);
    return range;
  }, [currentPage, totalPages]);

  const resetAllFilters = () => {
    setSearchTerm('');
    setSelectedCity('Toutes les villes');
    setSelectedTxType('all');
    setSelectedStatus('all');
    setCurrentPage(1);
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      
      {/* 1. EN-TÊTE PRINCIPAL */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-gold">Collection d'Exception & Patrimoine</div>
          <h1 className="font-serif text-3xl text-ink mt-1">Portfolio Propriétés</h1>
        </div>

        <button
          type="button"
          onClick={() => navigate('/admin/residences/create')}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-night text-gold border border-gold/40 hover:border-gold hover:bg-black text-xs uppercase tracking-wider font-mono rounded-sm transition-all shadow-sm cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5 text-gold" />
          <span>Ajouter une résidence</span>
        </button>
      </div>

      {/* 2. KPIS DE SYNTHÈSE */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-sm border border-ink/10 shadow-xs">
          <div className="flex items-center justify-between text-ink-muted mb-2">
            <span className="font-mono text-[10px] uppercase tracking-wider">Parc Immobilier</span>
            <Building2 size={16} className="text-gold" />
          </div>
          <div className="font-serif text-2xl text-ink">{stats.total}</div>
          <div className="text-[11px] text-ink-muted mt-1 font-sans">
            Propriétés enregistrées
          </div>
        </div>

        <div className="bg-white p-5 rounded-sm border border-ink/10 shadow-xs">
          <div className="flex items-center justify-between text-ink-muted mb-2">
            <span className="font-mono text-[10px] uppercase tracking-wider">Hébergements Meublés</span>
            <Home size={16} className="text-royal" />
          </div>
          <div className="font-serif text-2xl text-royal">{stats.meubleCount}</div>
          <div className="text-[11px] text-royal/80 mt-1 font-sans">
            Séjours d'exception
          </div>
        </div>

        <div className="bg-white p-5 rounded-sm border border-ink/10 shadow-xs">
          <div className="flex items-center justify-between text-ink-muted mb-2">
            <span className="font-mono text-[10px] uppercase tracking-wider">Locations Longue Durée</span>
            <Key size={16} className="text-emerald-600" />
          </div>
          <div className="font-serif text-2xl text-emerald-700">{stats.locationCount}</div>
          <div className="text-[11px] text-emerald-800/80 mt-1 font-sans">
            Baux résidentiels
          </div>
        </div>

        <div className="bg-white p-5 rounded-sm border border-ink/10 shadow-xs">
          <div className="flex items-center justify-between text-ink-muted mb-2">
            <span className="font-mono text-[10px] uppercase tracking-wider">Acquisitions (Vente)</span>
            <Tag size={16} className="text-amber-600" />
          </div>
          <div className="font-serif text-2xl text-amber-700">{stats.venteCount}</div>
          <div className="text-[11px] text-amber-800/80 mt-1 font-sans">
            Actifs patrimoniaux
          </div>
        </div>
      </div>

      {/* 3. BARRE D'ONGLETS DE TRANSACTION */}
      <div className="border-b border-ink/10 flex items-center overflow-x-auto gap-2 sm:gap-4 pb-px">
        {[
          { id: 'all', label: 'Toutes les propriétés', count: stats.total },
          { id: 'meuble', label: 'Hébergements Meublés', count: stats.meubleCount },
          { id: 'location', label: 'Locations Résidentielles', count: stats.locationCount },
          { id: 'vente', label: 'Biens en Vente', count: stats.venteCount },
          { id: 'offline', label: 'Hors Ligne / Brouillons', count: stats.hiddenCount }
        ].map((tab) => {
          const isActive = selectedTxType === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedTxType(tab.id)}
              className={`pb-3 px-1 text-xs font-medium whitespace-nowrap transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
                isActive 
                  ? 'border-gold text-ink font-semibold' 
                  : 'border-transparent text-ink-muted hover:text-ink hover:border-ink/20'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                isActive ? 'bg-night text-gold' : 'bg-gray-100 text-gray-600'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 4. BARRE D'OUTILS : RECHERCHE + FILTRES + SÉLECTEUR ÉLÉMENTS */}
      <div className="bg-white p-4 rounded-sm border border-ink/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Recherche */}
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par nom de résidence, quartier, ville..."
            className="w-full bg-gray-50/70 border border-ink/10 rounded-sm pl-9 pr-8 py-2 text-xs text-ink placeholder:text-ink-muted focus:bg-white focus:outline-none focus:border-royal transition-colors"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink p-0.5"
            >
              <X size={12} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Ville / Secteur */}
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="bg-gray-50/70 border border-ink/10 rounded-sm px-3 py-2 text-xs text-ink focus:bg-white focus:outline-none focus:border-royal cursor-pointer"
          >
            {uniqueCities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>

          {/* Statut Commercial */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-gray-50/70 border border-ink/10 rounded-sm px-3 py-2 text-xs text-ink focus:bg-white focus:outline-none focus:border-royal cursor-pointer"
          >
            <option value="all">Tous les statuts</option>
            {RESIDENCE_STATUSES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          {/* Afficher par page */}
          <div className="flex items-center gap-1.5 border-l border-ink/10 pl-3">
            <span className="text-[11px] text-ink-muted font-mono uppercase">Afficher</span>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="bg-gray-50/70 border border-ink/10 rounded-sm px-2 py-1.5 text-xs text-ink focus:bg-white focus:outline-none focus:border-royal cursor-pointer"
            >
              <option value={6}>6</option>
              <option value={9}>9</option>
              <option value={12}>12</option>
              <option value={24}>24</option>
            </select>
          </div>

          {(searchTerm || selectedCity !== 'Toutes les villes' || selectedStatus !== 'all' || selectedTxType !== 'all') && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="text-xs text-royal hover:underline font-mono inline-flex items-center gap-1 cursor-pointer pl-1"
            >
              <RefreshCw size={11} /> Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* 5. GRILLE DES PROPRIÉTÉS */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="bg-white border border-ink/10 rounded-sm flex flex-col h-[420px] animate-pulse">
              <div className="h-48 w-full bg-gray-200" />
              <div className="p-6 flex flex-col flex-1 space-y-4">
                <div className="h-3 w-24 bg-gray-200" />
                <div className="h-6 w-48 bg-gray-200" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-full bg-gray-200" />
                  <div className="h-4 w-full bg-gray-200" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-12 text-center bg-white border border-ink/10 rounded-sm">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-3" />
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <button 
            type="button"
            onClick={() => { const c = new AbortController(); fetchResidences(c); }}
            className="px-4 py-2 border border-ink/15 text-xs uppercase tracking-widest hover:border-royal hover:text-royal transition-colors rounded-sm"
          >
            Réessayer
          </button>
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="p-20 text-center bg-white border border-ink/10 rounded-sm flex flex-col items-center justify-center">
          <Building2 className="h-10 w-10 text-ink-muted/40 mb-3" />
          <h3 className="font-serif text-lg text-ink mb-1">Aucune propriété trouvée</h3>
          <p className="text-ink-muted text-xs max-w-sm mb-4">
            Aucun bien ne correspond à vos filtres de recherche.
          </p>
          <button
            type="button"
            onClick={resetAllFilters}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-ink text-xs uppercase tracking-wider font-mono rounded-sm transition-colors cursor-pointer"
          >
            Voir tout le catalogue
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedProperties.map((prop) => (
            <article 
              key={prop.id} 
              className="bg-white border border-ink/10 rounded-sm flex flex-col overflow-hidden hover:shadow-lg transition-all group duration-300"
            >
              {/* Image & Badges */}
              <div className="relative h-52 w-full overflow-hidden bg-gray-100">
                <img 
                  src={prop.img} 
                  alt={prop.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                  loading="lazy" 
                />
                
                {/* Badge statut commercial */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                  <span className={`text-[9px] font-mono font-bold tracking-widest uppercase px-2.5 py-1 rounded-xs shadow-xs backdrop-blur-md ${prop.statusColor}`}>
                    {prop.status}
                  </span>
                </div>

                {/* Badge Type d'offre */}
                <div className="absolute top-3 right-3 z-10">
                  <span className="text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-xs bg-night/80 text-gold backdrop-blur-md border border-gold/30">
                    {prop.transactionType.label}
                  </span>
                </div>
              </div>

              {/* Détails */}
              <div className="p-6 flex flex-col flex-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-gold mb-1">
                  {prop.city}
                </span>
                <h3 className="font-serif text-xl text-ink mb-4 font-normal group-hover:text-royal transition-colors line-clamp-1">
                  {prop.name}
                </h3>
                
                <ul className="space-y-2 mb-6 border-t border-ink/10 pt-4 flex-1">
                  {prop.specs.map((spec, i) => (
                    <li key={i} className="flex justify-between items-center py-1">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-ink-muted">
                        {spec.label}
                      </span>
                      <span className="text-xs text-ink font-medium">
                        {spec.value}
                      </span>
                    </li>
                  ))}
                </ul>
                
                <div className="mt-auto pt-4 flex items-center justify-between border-t border-ink/10">
                  <div>
                    <div className="font-serif text-lg text-ink font-medium">
                      {prop.price.toLocaleString('fr-FR')} FCFA
                      {prop.priceSuffix && (
                        <span className="text-[9px] font-mono uppercase tracking-widest text-ink-muted ml-1">{prop.priceSuffix}</span>
                      )}
                    </div>
                  </div>
                  <Button 
                    variant="royal" 
                    onClick={() => navigate(`/admin/residences/${prop.id}/edit`)} 
                    className="uppercase tracking-widest text-[10px] px-3.5 py-2 cursor-pointer"
                  >
                    Gérer <ArrowRight className="h-3 w-3 ml-1.5 inline" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* 6. PAGINATION HAUTE PRÉCISION */}
      {filteredProperties.length > 0 && !isLoading && (
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-ink/10 pt-6 pb-12 gap-4">
          <div className="text-xs text-ink-muted font-mono">
            Affichage de <strong className="text-ink">{startIndex + 1}</strong> à <strong className="text-ink">{endIndex}</strong> sur <strong className="text-ink">{filteredProperties.length}</strong> propriété{filteredProperties.length > 1 ? 's' : ''}
            {filteredProperties.length !== stats.total && (
              <span className="text-[11px] text-gold ml-1">
                (filtré sur {stats.total} au total)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button 
              type="button"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-sm border border-ink/10 bg-white text-xs font-medium text-ink hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Précédent</span>
            </button>

            <div className="flex items-center gap-1 px-1">
              {paginationRange.map((pageNumber, idx) => {
                if (pageNumber === '...') {
                  return (
                    <span key={`dots-${idx}`} className="px-2 py-1 text-xs text-ink-muted font-mono">
                      ...
                    </span>
                  );
                }
                const isCurrent = currentPage === pageNumber;
                return (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => setCurrentPage(pageNumber)}
                    className={`min-w-[28px] h-7 px-2 text-xs font-mono rounded-sm transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-night text-gold font-bold shadow-xs'
                        : 'bg-white hover:bg-gray-100 text-ink border border-ink/10'
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
            </div>

            <button 
              type="button"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-sm border border-ink/10 bg-white text-xs font-medium text-ink hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <span>Suivant</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
