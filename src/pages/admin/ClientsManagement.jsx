import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Search, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Users, 
  UserCheck, 
  UserX, 
  ShieldAlert, 
  Loader2, 
  RefreshCw,
  Phone,
  Mail,
  DollarSign
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';

const STATUS_STYLES = {
  'Nouveau': { text: 'text-royal', bg: 'bg-royal/10 border-royal/20' },
  'Standard': { text: 'text-ink-muted', bg: 'bg-gray-100 border-gray-200' },
  'VIP': { text: 'text-gold', bg: 'bg-gold/10 border-gold/30' }
};

const DEFAULT_STATUS_STYLE = { text: 'text-ink-muted', bg: 'bg-gray-100 border-gray-200' };

const mapClient = (row) => ({
  id: row.id,
  name: `${row.first_name ?? ''} ${row.last_name ?? ''}`.trim(),
  firstName: row.first_name ?? '',
  lastName: row.last_name ?? '',
  email: row.email ?? '',
  phone: row.phone ?? '',
  status: row.client_status ?? 'Nouveau',
  bookingsCount: Number(row.stays_count) || 0,
  totalRevenue: Number(row.total_revenue) || 0,
  isSuspended: Number(row.is_suspended) === 1,
});

export default function ClientsManagement() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [activeStatus, setActiveStatus] = useState('Tous');
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [isUpdatingId, setIsUpdatingId] = useState(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [clientToSuspend, setClientToSuspend] = useState(null);

  const loadClients = useCallback(async (abortController) => {
    try {
      setIsLoading(true);
      setFetchError(null);
      const response = await api.get('/clients', { signal: abortController?.signal });
      const dataArray = Array.isArray(response) ? response : (response?.data || []);
      setClients(dataArray.map(mapClient));
    } catch (error) {
      if (error.name === 'CanceledError' || error.message === 'canceled') return;
      const msg = error.response?.data?.error || error.response?.data?.message || "Impossible de charger les clients.";
      setFetchError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const abortController = new AbortController();
    loadClients(abortController);
    return () => abortController.abort();
  }, [loadClients]);

  // Statistiques KPIs
  const totalClients = clients.length;
  const nouveauxClients = clients.filter(c => c.status === 'Nouveau').length;
  const standardClients = clients.filter(c => c.status === 'Standard').length;
  const suspendedClients = clients.filter(c => c.isSuspended).length;

  // Filtrage combiné : Recherche + Statut
  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const searchMatch = !search.trim() || 
        client.name.toLowerCase().includes(search.toLowerCase().trim()) || 
        client.email.toLowerCase().includes(search.toLowerCase().trim()) ||
        client.phone.includes(search.trim());
      
      const statusMatch = activeStatus === 'Tous' || 
        (activeStatus === 'Suspendus' ? client.isSuspended : client.status === activeStatus);

      return searchMatch && statusMatch;
    });
  }, [clients, search, activeStatus]);

  // Réinitialiser la page si les filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [search, activeStatus, itemsPerPage]);

  // Calcul pagination
  const totalPages = Math.max(1, Math.ceil(filteredClients.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredClients.length);
  const paginatedClients = filteredClients.slice(startIndex, endIndex);

  // Plage de numéros de page
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

  const handleToggleSuspend = async (client) => {
    if (isUpdatingId) return;

    if (!client.isSuspended) {
      setClientToSuspend(client);
      setShowSuspendModal(true);
      return;
    }

    try {
      setIsUpdatingId(client.id);
      const body = { client_status: client.status, is_suspended: 0 };
      await api.put(`/clients/${client.id}/status`, body);
      toast.success("Client réactivé avec succès.");
      setClients(clients.map(c => c.id === client.id ? { ...c, isSuspended: false } : c));
    } catch (error) {
      const msg = error.response?.data?.error || error.response?.data?.message || "Impossible de réactiver le client.";
      toast.error(msg);
    } finally {
      setIsUpdatingId(null);
    }
  };

  const confirmSuspend = async () => {
    if (!clientToSuspend || isUpdatingId) return;

    try {
      setIsUpdatingId(clientToSuspend.id);
      const body = { client_status: clientToSuspend.status, is_suspended: 1 };
      await api.put(`/clients/${clientToSuspend.id}/status`, body);
      toast.success("Client suspendu avec succès.");
      setClients(clients.map(c => c.id === clientToSuspend.id ? { ...c, isSuspended: true } : c));
      setShowSuspendModal(false);
    } catch (error) {
      const msg = error.response?.data?.error || error.response?.data?.message || "Impossible de suspendre le client.";
      toast.error(msg);
    } finally {
      setIsUpdatingId(null);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      
      {/* 1. EN-TÊTE PRINCIPAL */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-gold">Base d'Acquéreurs & Résidents</div>
          <h1 className="font-serif text-3xl text-ink mt-1">Gestion des Clients</h1>
        </div>
      </div>

      {/* 2. KPIS DE SYNTHÈSE */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-sm border border-ink/10 shadow-xs">
          <div className="flex items-center justify-between text-ink-muted mb-2">
            <span className="font-mono text-[10px] uppercase tracking-wider">Total Comptes</span>
            <Users size={16} className="text-ink-muted" />
          </div>
          <div className="font-serif text-2xl text-ink">{totalClients}</div>
          <div className="text-[11px] text-ink-muted mt-1 font-sans">
            Comptes clients enregistrés
          </div>
        </div>

        <div className="bg-white p-5 rounded-sm border border-ink/10 shadow-xs">
          <div className="flex items-center justify-between text-ink-muted mb-2">
            <span className="font-mono text-[10px] uppercase tracking-wider">Nouveaux</span>
            <UserCheck size={16} className="text-royal" />
          </div>
          <div className="font-serif text-2xl text-royal">{nouveauxClients}</div>
          <div className="text-[11px] text-royal/80 mt-1 font-sans">
            Inscrits récemment
          </div>
        </div>

        <div className="bg-white p-5 rounded-sm border border-ink/10 shadow-xs">
          <div className="flex items-center justify-between text-ink-muted mb-2">
            <span className="font-mono text-[10px] uppercase tracking-wider">Standards & Actifs</span>
            <ShieldCheckIcon size={16} className="text-emerald-600" />
          </div>
          <div className="font-serif text-2xl text-emerald-700">{standardClients}</div>
          <div className="text-[11px] text-emerald-800/80 mt-1 font-sans">
            Profils confirmés
          </div>
        </div>

        <div className="bg-white p-5 rounded-sm border border-ink/10 shadow-xs">
          <div className="flex items-center justify-between text-ink-muted mb-2">
            <span className="font-mono text-[10px] uppercase tracking-wider">Suspendus</span>
            <UserX size={16} className="text-red-500" />
          </div>
          <div className="font-serif text-2xl text-red-600">{suspendedClients}</div>
          <div className="text-[11px] text-red-700/80 mt-1 font-sans">
            Accès restreint
          </div>
        </div>
      </div>

      {/* 3. ONGLETS DE FILTRE DE STATUT */}
      <div className="border-b border-ink/10 flex items-center overflow-x-auto gap-2 sm:gap-4 pb-px">
        {[
          { id: 'Tous', label: 'Tous les clients', count: totalClients },
          { id: 'Nouveau', label: 'Nouveaux', count: nouveauxClients },
          { id: 'Standard', label: 'Standards', count: standardClients },
          { id: 'Suspendus', label: 'Suspendus', count: suspendedClients }
        ].map((tab) => {
          const isActive = activeStatus === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveStatus(tab.id)}
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

      {/* 4. BARRE D'OUTILS : RECHERCHE + SÉLECTEUR ÉLÉMENTS */}
      <div className="bg-white p-4 rounded-sm border border-ink/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, email ou téléphone..."
            className="w-full bg-gray-50/70 border border-ink/10 rounded-sm pl-9 pr-8 py-2 text-xs text-ink placeholder:text-ink-muted focus:bg-white focus:outline-none focus:border-royal transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
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

          {(search || activeStatus !== 'Tous') && (
            <button
              type="button"
              onClick={() => { setSearch(''); setActiveStatus('Tous'); }}
              className="text-xs text-royal hover:underline font-mono inline-flex items-center gap-1 cursor-pointer pl-2"
            >
              <RefreshCw size={11} /> Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* 5. TABLEAU DES CLIENTS */}
      <div className="bg-white rounded-sm border border-ink/10 overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 text-royal animate-spin mb-3" />
            <p className="text-xs font-mono uppercase tracking-widest text-ink-muted">Chargement du répertoire clients...</p>
          </div>
        ) : fetchError ? (
          <div className="py-16 text-center">
            <p className="text-sm text-red-600 mb-4">{fetchError}</p>
            <button
              type="button"
              onClick={() => loadClients()}
              className="px-4 py-2 border border-ink/15 text-xs uppercase tracking-widest hover:border-royal hover:text-royal transition-colors rounded-sm"
            >
              Réessayer
            </button>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <Users className="h-10 w-10 text-ink-muted/40 mb-3" />
            <h3 className="font-serif text-lg text-ink mb-1">Aucun client trouvé</h3>
            <p className="text-ink-muted text-xs max-w-sm mb-4">
              Aucun profil ne correspond à vos filtres actuels.
            </p>
            <button
              type="button"
              onClick={() => { setSearch(''); setActiveStatus('Tous'); }}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-ink text-xs uppercase tracking-wider font-mono rounded-sm transition-colors cursor-pointer"
            >
              Voir tous les clients
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-left text-sm">
              <caption className="sr-only">Répertoire des clients enregistrés</caption>
              <thead>
                <tr className="border-b border-ink/10 bg-gray-50/80">
                  <th scope="col" className="py-3.5 pl-6 pr-4 font-mono text-[10px] uppercase font-normal text-ink-muted">Profil Client</th>
                  <th scope="col" className="py-3.5 pr-4 font-mono text-[10px] uppercase font-normal text-ink-muted">Coordonnées</th>
                  <th scope="col" className="py-3.5 pr-4 font-mono text-[10px] uppercase font-normal text-ink-muted">Statut Commercial</th>
                  <th scope="col" className="py-3.5 pr-4 font-mono text-[10px] uppercase font-normal text-ink-muted">Activité & Valeur</th>
                  <th scope="col" className="py-3.5 pr-6 font-mono text-[10px] uppercase font-normal text-ink-muted text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {paginatedClients.map((client) => {
                  const statusStyle = STATUS_STYLES[client.status] || DEFAULT_STATUS_STYLE;
                  const initials = `${(client.firstName?.[0] || '').toUpperCase()}${(client.lastName?.[0] || '').toUpperCase()}` || 'CL';

                  return (
                    <tr key={client.id} className={`hover:bg-gray-50/50 transition-colors ${client.isSuspended ? 'bg-red-50/20' : ''}`}>
                      {/* Profil Client */}
                      <td className="py-4 pl-6 pr-4 align-top">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-amber-50 text-amber-800 text-xs font-semibold flex items-center justify-center shrink-0 border border-amber-200">
                            {initials}
                          </div>
                          <div>
                            <span className="text-ink font-medium text-xs block">
                              {client.name || 'Nom non renseigné'}
                            </span>
                            {client.isSuspended ? (
                              <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider text-red-700 bg-red-100/80 px-2 py-0.5 rounded-xs font-mono font-semibold mt-1">
                                <ShieldAlert size={10} /> Compte Suspendu
                              </span>
                            ) : (
                              <span className="text-[10px] text-ink-muted font-mono block mt-0.5">
                                Client Enregistré
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Coordonnées */}
                      <td className="py-4 pr-4 align-top">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs text-ink">
                            <Mail size={12} className="text-ink-muted" />
                            <span>{client.email || '—'}</span>
                          </div>
                          {client.phone && (
                            <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                              <Phone size={12} className="text-ink-muted" />
                              <a href={`tel:${client.phone.replace(/\s+/g, '')}`} className="hover:text-royal transition-colors">
                                {client.phone}
                              </a>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Statut Commercial */}
                      <td className="py-4 pr-4 align-top">
                        <span className={`text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-sm border inline-block ${statusStyle.bg} ${statusStyle.text}`}>
                          {client.status}
                        </span>
                      </td>

                      {/* Activité & Valeur */}
                      <td className="py-4 pr-4 align-top">
                        <div className="font-serif text-ink text-sm font-medium">
                          {client.totalRevenue.toLocaleString('fr-FR')} FCFA
                        </div>
                        <div className="text-[11px] text-ink-muted mt-0.5 font-mono">
                          {client.bookingsCount} {client.bookingsCount > 1 ? 'séjours' : 'séjour'}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 pr-6 align-top text-right">
                        {client.isSuspended ? (
                          <button 
                            type="button" 
                            onClick={() => handleToggleSuspend(client)}
                            disabled={isUpdatingId === client.id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-medium rounded-sm transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            {isUpdatingId === client.id ? <Loader2 size={12} className="animate-spin" /> : <UserCheck size={12} />}
                            <span>Réactiver</span>
                          </button>
                        ) : (
                          <button 
                            type="button" 
                            onClick={() => handleToggleSuspend(client)}
                            disabled={isUpdatingId === client.id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 text-xs font-medium rounded-sm transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            {isUpdatingId === client.id ? <Loader2 size={12} className="animate-spin" /> : <UserX size={12} />}
                            <span>Suspendre</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 6. PAGINATION HAUTE PRÉCISION */}
        {filteredClients.length > 0 && !isLoading && !fetchError && (
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-ink/10 px-6 py-4 bg-gray-50/60 gap-4">
            <div className="text-xs text-ink-muted font-mono">
              Affichage de <strong className="text-ink">{startIndex + 1}</strong> à <strong className="text-ink">{endIndex}</strong> sur <strong className="text-ink">{filteredClients.length}</strong> client{filteredClients.length > 1 ? 's' : ''}
              {filteredClients.length !== totalClients && (
                <span className="text-[11px] text-gold ml-1">
                  (filtré sur {totalClients} au total)
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

      {/* MODALE DE SUSPENSION */}
      {showSuspendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md shadow-2xl rounded-sm border border-ink/10 overflow-hidden">
            <div className="px-6 py-4 border-b border-ink/10 bg-gray-50/50 flex items-center justify-between">
              <h3 className="text-xs font-mono uppercase tracking-widest text-red-600 font-semibold flex items-center gap-2">
                <ShieldAlert size={14} /> Confirmation requise
              </h3>
            </div>
            <div className="p-6 text-ink text-sm leading-relaxed">
              Êtes-vous sûr de vouloir suspendre l'accès de <strong>{clientToSuspend?.name}</strong> ?<br/><br/>
              Ce client ne pourra plus effectuer de réservation en ligne jusqu'à sa réactivation.
            </div>
            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-ink/10">
              <button
                type="button"
                onClick={() => setShowSuspendModal(false)}
                disabled={isUpdatingId !== null}
                className="px-4 py-2 text-xs uppercase tracking-widest text-ink-muted hover:text-ink transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmSuspend}
                disabled={isUpdatingId !== null}
                className="px-4 py-2 text-xs uppercase tracking-widest bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2 rounded-sm cursor-pointer"
              >
                {isUpdatingId === clientToSuspend?.id ? 'Suspension...' : 'Confirmer la suspension'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Icon helper
function ShieldCheckIcon({ size = 16, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
