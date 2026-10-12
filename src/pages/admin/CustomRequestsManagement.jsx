import { useState, useEffect, useMemo } from 'react';
import { 
  Eye, 
  CheckCircle, 
  Search, 
  Mail, 
  Phone, 
  Calendar, 
  Home, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  Archive,
  RefreshCw,
  Loader2
} from 'lucide-react';
import api from '../../services/api';
import { toast } from 'sonner';

export default function CustomRequestsManagement() {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Filtres et pagination
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/admin/custom-requests?limit=100');
      const data = Array.isArray(response) ? response : (response?.data || response || []);
      setRequests(data);
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors du chargement des demandes sur-mesure.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const updateStatus = async (id, newStatus) => {
    try {
      await api.put(`/admin/custom-requests/${id}/status`, { status: newStatus });
      toast.success('Statut de la demande mis à jour avec succès.');
      setRequests(requests.map(req => req.id === id ? { ...req, status: newStatus } : req));
      if (selectedRequest && selectedRequest.id === id) {
        setSelectedRequest({ ...selectedRequest, status: newStatus });
      }
    } catch (err) {
      toast.error('Erreur lors de la mise à jour du statut.');
    }
  };

  // KPIs
  const stats = useMemo(() => {
    const total = requests.length;
    const newCount = requests.filter(r => r.status === 'new').length;
    const contactedCount = requests.filter(r => r.status === 'contacted').length;
    const closedCount = requests.filter(r => r.status === 'closed').length;
    return { total, newCount, contactedCount, closedCount };
  }, [requests]);

  // Filtrage combiné
  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      // Filtre statut
      if (filterStatus !== 'all' && req.status !== filterStatus) return false;

      // Recherche
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const nameMatch = req.full_name?.toLowerCase().includes(query);
        const phoneMatch = req.phone?.includes(query);
        const emailMatch = req.email?.toLowerCase().includes(query);
        const typeMatch = req.property_type?.toLowerCase().includes(query);
        const locMatch = req.preferred_location?.toLowerCase().includes(query);
        const budgetMatch = req.budget?.toLowerCase().includes(query);
        const critMatch = req.criteria?.toLowerCase().includes(query);

        if (!nameMatch && !phoneMatch && !emailMatch && !typeMatch && !locMatch && !budgetMatch && !critMatch) {
          return false;
        }
      }

      return true;
    });
  }, [requests, filterStatus, searchQuery]);

  // Réinitialiser la page
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, searchQuery, itemsPerPage]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredRequests.length);
  const paginatedRequests = filteredRequests.slice(startIndex, endIndex);

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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'new':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xs text-[10px] font-mono uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" /> Nouveau
          </span>
        );
      case 'contacted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xs text-[10px] font-mono uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
            <Clock size={10} /> Contacté
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xs text-[10px] font-mono uppercase tracking-wider bg-gray-100 text-gray-600 border border-gray-200">
            <CheckCircle size={10} /> Clôturé
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date inconnue';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      
      {/* 1. EN-TÊTE PRINCIPAL */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-gold">Conciergerie Privée & Chasse Immobilière</div>
          <h1 className="font-serif text-3xl text-ink mt-1">Recherches sur-mesure</h1>
        </div>
      </div>

      {/* 2. KPIS DE SYNTHÈSE */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-sm border border-ink/10 shadow-xs">
          <div className="flex items-center justify-between text-ink-muted mb-2">
            <span className="font-mono text-[10px] uppercase tracking-wider">Total Demandes</span>
            <Sparkles size={16} className="text-gold" />
          </div>
          <div className="font-serif text-2xl text-ink">{stats.total}</div>
          <div className="text-[11px] text-ink-muted mt-1 font-sans">
            Cahiers des charges VIP
          </div>
        </div>

        <div className={`p-5 rounded-sm border shadow-xs transition-colors ${stats.newCount > 0 ? 'bg-blue-50/40 border-blue-200' : 'bg-white border-ink/10'}`}>
          <div className="flex items-center justify-between text-ink-muted mb-2">
            <span className="font-mono text-[10px] uppercase tracking-wider">Nouvelles</span>
            {stats.newCount > 0 ? (
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping" />
            ) : (
              <Clock size={16} className="text-ink-muted" />
            )}
          </div>
          <div className="font-serif text-2xl text-blue-700">{stats.newCount}</div>
          <div className="text-[11px] text-blue-800/80 mt-1 font-sans">
            À traiter rapidement
          </div>
        </div>

        <div className="bg-white p-5 rounded-sm border border-ink/10 shadow-xs">
          <div className="flex items-center justify-between text-ink-muted mb-2">
            <span className="font-mono text-[10px] uppercase tracking-wider">Contactées</span>
            <Clock size={16} className="text-amber-600" />
          </div>
          <div className="font-serif text-2xl text-amber-700">{stats.contactedCount}</div>
          <div className="text-[11px] text-amber-800/80 mt-1 font-sans">
            En échange commercial
          </div>
        </div>

        <div className="bg-white p-5 rounded-sm border border-ink/10 shadow-xs">
          <div className="flex items-center justify-between text-ink-muted mb-2">
            <span className="font-mono text-[10px] uppercase tracking-wider">Clôturées</span>
            <CheckCircle2 size={16} className="text-emerald-600" />
          </div>
          <div className="font-serif text-2xl text-emerald-700">{stats.closedCount}</div>
          <div className="text-[11px] text-emerald-800/80 mt-1 font-sans">
            Dossiers finalisés
          </div>
        </div>
      </div>

      {/* 3. BARRE D'ONGLETS DE NAVIGATION */}
      <div className="border-b border-ink/10 flex items-center overflow-x-auto gap-2 sm:gap-4 pb-px">
        {[
          { id: 'all', label: 'Toutes les demandes', count: stats.total },
          { id: 'new', label: 'Nouvelles', count: stats.newCount, alert: stats.newCount > 0 },
          { id: 'contacted', label: 'Contactées', count: stats.contactedCount },
          { id: 'closed', label: 'Clôturées', count: stats.closedCount }
        ].map((tab) => {
          const isActive = filterStatus === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterStatus(tab.id)}
              className={`pb-3 px-1 text-xs font-medium whitespace-nowrap transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
                isActive 
                  ? 'border-gold text-ink font-semibold' 
                  : 'border-transparent text-ink-muted hover:text-ink hover:border-ink/20'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                isActive 
                  ? 'bg-night text-gold' 
                  : tab.alert 
                  ? 'bg-blue-100 text-blue-800 font-bold'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 4. BARRE D'OUTILS : RECHERCHE + SÉLECTEUR ÉLÉMENTS */}
      <div className="bg-white p-4 rounded-sm border border-ink/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par nom, téléphone, email, quartier, budget..."
            className="w-full bg-gray-50/70 border border-ink/10 rounded-sm pl-9 pr-8 py-2 text-xs text-ink placeholder:text-ink-muted focus:bg-white focus:outline-none focus:border-royal transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink p-0.5"
            >
              <X size={12} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-ink-muted font-mono uppercase">Afficher</span>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="bg-gray-50/70 border border-ink/10 rounded-sm px-2 py-1.5 text-xs text-ink focus:bg-white focus:outline-none focus:border-royal cursor-pointer"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          {(searchQuery || filterStatus !== 'all') && (
            <button
              type="button"
              onClick={() => { setSearchQuery(''); setFilterStatus('all'); }}
              className="text-xs text-royal hover:underline font-mono inline-flex items-center gap-1 cursor-pointer pl-2"
            >
              <RefreshCw size={11} /> Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* 5. TABLEAU DES DEMANDES */}
      <div className="bg-white rounded-sm border border-ink/10 overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 text-royal animate-spin mb-3" />
            <p className="text-xs font-mono uppercase tracking-widest text-ink-muted">Chargement des demandes sur-mesure...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <Sparkles className="h-10 w-10 text-ink-muted/40 mb-3" />
            <h3 className="font-serif text-lg text-ink mb-1">Aucune demande trouvée</h3>
            <p className="text-ink-muted text-xs max-w-sm mb-4">
              Aucun dossier ne correspond à vos filtres actuels.
            </p>
            <button
              type="button"
              onClick={() => { setSearchQuery(''); setFilterStatus('all'); }}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-ink text-xs uppercase tracking-wider font-mono rounded-sm transition-colors cursor-pointer"
            >
              Voir toutes les demandes
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-left text-sm">
              <caption className="sr-only">Suivi des recherches sur-mesure</caption>
              <thead>
                <tr className="border-b border-ink/10 bg-gray-50/80">
                  <th scope="col" className="py-3.5 pl-6 pr-4 font-mono text-[10px] uppercase font-normal text-ink-muted">Client & Contact</th>
                  <th scope="col" className="py-3.5 pr-4 font-mono text-[10px] uppercase font-normal text-ink-muted">Critères Recherchés</th>
                  <th scope="col" className="py-3.5 pr-4 font-mono text-[10px] uppercase font-normal text-ink-muted">Date Reçue</th>
                  <th scope="col" className="py-3.5 pr-4 font-mono text-[10px] uppercase font-normal text-ink-muted">Statut</th>
                  <th scope="col" className="py-3.5 pr-6 font-mono text-[10px] uppercase font-normal text-ink-muted text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {paginatedRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                    {/* Client & Contact */}
                    <td className="py-4 pl-6 pr-4 align-top">
                      <div className="font-medium text-ink text-xs mb-1">{req.full_name}</div>
                      <div className="space-y-0.5">
                        <div className="flex items-center text-[11px] text-ink-muted gap-1.5">
                          <Phone className="w-3 h-3 text-gold" />
                          <a href={`tel:${req.phone?.replace(/\s+/g, '')}`} className="hover:text-royal">
                            {req.phone}
                          </a>
                        </div>
                        {req.email && (
                          <div className="flex items-center text-[11px] text-ink-muted gap-1.5">
                            <Mail className="w-3 h-3 text-ink-muted" />
                            <span>{req.email}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Critères */}
                    <td className="py-4 pr-4 align-top">
                      <div className="text-xs space-y-1">
                        {req.property_type && (
                          <div className="flex items-center gap-1.5 text-ink font-medium">
                            <Home className="w-3.5 h-3.5 text-gold shrink-0" />
                            <span>{req.property_type}</span>
                          </div>
                        )}
                        <div className="text-[11px] text-ink-muted flex flex-wrap gap-2">
                          {req.preferred_location && <span>Secteur: <strong className="text-ink">{req.preferred_location}</strong></span>}
                          {req.budget && <span>Budget: <strong className="text-ink">{req.budget}</strong></span>}
                        </div>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-4 pr-4 align-top text-xs text-ink-muted font-mono">
                      {formatDate(req.created_at)}
                    </td>

                    {/* Statut */}
                    <td className="py-4 pr-4 align-top">
                      {getStatusBadge(req.status)}
                    </td>

                    {/* Actions */}
                    <td className="py-4 pr-6 align-top text-right">
                      <button 
                        type="button"
                        onClick={() => setSelectedRequest(req)} 
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-night text-gold hover:bg-black text-xs font-mono uppercase tracking-wider rounded-sm transition-colors cursor-pointer"
                        title="Examiner le dossier complet"
                      >
                        <Eye size={12} />
                        <span>Consulter</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 6. PAGINATION */}
        {filteredRequests.length > 0 && !isLoading && (
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-ink/10 px-6 py-4 bg-gray-50/60 gap-4">
            <div className="text-xs text-ink-muted font-mono">
              Affichage de <strong className="text-ink">{startIndex + 1}</strong> à <strong className="text-ink">{endIndex}</strong> sur <strong className="text-ink">{filteredRequests.length}</strong> demande{filteredRequests.length > 1 ? 's' : ''}
              {filteredRequests.length !== stats.total && (
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

      {/* 7. MODALE DE DÉTAILS LUXE */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative bg-white rounded-sm shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-ink/10 overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-ink/10 bg-gray-50/50">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-gold">Dossier VIP</div>
                <h3 className="font-serif text-2xl text-ink">Cahier des charges sur-mesure</h3>
                <p className="text-xs text-ink-muted mt-0.5">Enregistré le {formatDate(selectedRequest.created_at)}</p>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedRequest(null)} 
                className="text-ink-muted hover:text-ink p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
              {/* Coordonnées */}
              <div>
                <h4 className="text-[10px] font-mono uppercase tracking-widest text-ink-muted mb-2 font-semibold">Coordonnées du Client</h4>
                <div className="bg-[#FAFAF8] border border-ink/10 rounded-sm p-4 space-y-2.5">
                  <div className="flex items-start justify-between">
                    <span className="text-xs text-ink-muted">Nom complet</span>
                    <strong className="text-xs text-ink font-medium">{selectedRequest.full_name}</strong>
                  </div>
                  <div className="flex items-start justify-between">
                    <span className="text-xs text-ink-muted">WhatsApp / Téléphone</span>
                    <a href={`tel:${selectedRequest.phone}`} className="text-xs text-royal hover:underline font-mono">
                      {selectedRequest.phone}
                    </a>
                  </div>
                  <div className="flex items-start justify-between">
                    <span className="text-xs text-ink-muted">Adresse Email</span>
                    <span className="text-xs text-ink">{selectedRequest.email || 'Non renseigné'}</span>
                  </div>
                </div>
              </div>

              {/* Critères */}
              <div>
                <h4 className="text-[10px] font-mono uppercase tracking-widest text-gold mb-2 font-semibold">Exigences & Critères</h4>
                <div className="bg-[#FAFAF8] border border-ink/10 rounded-sm p-4 space-y-2.5">
                  <div className="flex items-start justify-between">
                    <span className="text-xs text-ink-muted">Type de bien</span>
                    <span className="text-xs text-ink font-medium">{selectedRequest.property_type || '—'}</span>
                  </div>
                  <div className="flex items-start justify-between">
                    <span className="text-xs text-ink-muted">Localisation souhaitée</span>
                    <span className="text-xs text-ink font-medium">{selectedRequest.preferred_location || '—'}</span>
                  </div>
                  <div className="flex items-start justify-between">
                    <span className="text-xs text-ink-muted">Budget envisagé</span>
                    <strong className="text-xs text-gold font-mono">{selectedRequest.budget || '—'}</strong>
                  </div>
                  <div className="flex items-start justify-between">
                    <span className="text-xs text-ink-muted">Période ou durée</span>
                    <span className="text-xs text-ink">{selectedRequest.duration || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Message */}
              <div>
                <h4 className="text-[10px] font-mono uppercase tracking-widest text-ink-muted mb-2 font-semibold">Notes & Demandes Particulières</h4>
                <div className="bg-[#FAFAF8] border border-ink/10 rounded-sm p-4 text-xs text-ink leading-relaxed whitespace-pre-wrap font-serif">
                  {selectedRequest.criteria || 'Aucune note particulière mentionnée.'}
                </div>
              </div>
            </div>

            {/* Actions de Statut */}
            <div className="p-5 border-t border-ink/10 flex items-center justify-between bg-gray-50/80">
              <div className="flex items-center gap-2">
                <span className="text-xs text-ink-muted">Statut actuel :</span>
                {getStatusBadge(selectedRequest.status)}
              </div>
              <div className="flex items-center gap-2">
                {selectedRequest.status !== 'contacted' && (
                  <button 
                    type="button"
                    onClick={() => updateStatus(selectedRequest.id, 'contacted')}
                    className="px-3.5 py-2 text-xs font-mono uppercase tracking-wider bg-white border border-ink/20 hover:border-gold text-ink rounded-sm transition-colors cursor-pointer"
                  >
                    Marquer Contacté
                  </button>
                )}
                {selectedRequest.status !== 'closed' && (
                  <button 
                    type="button"
                    onClick={() => updateStatus(selectedRequest.id, 'closed')}
                    className="px-4 py-2 text-xs font-mono uppercase tracking-wider bg-night text-gold hover:bg-black rounded-sm transition-colors cursor-pointer"
                  >
                    Clôturer le dossier
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
