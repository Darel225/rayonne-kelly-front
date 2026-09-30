import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import api from '../../services/api';

const STATUS_STYLES = {
  'Nouveau': { text: 'text-royal', bg: 'bg-royal/5' },
  'Standard': { text: 'text-ink-muted', bg: 'bg-ink/5' },
};

const DEFAULT_STATUS_STYLE = { text: 'text-ink-muted', bg: 'bg-ink/5' };

const mapClient = (row) => ({
  id: row.id,
  name: `${row.first_name ?? ''} ${row.last_name ?? ''}`.trim(),
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
  
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [clientToSuspend, setClientToSuspend] = useState(null);

  const loadClients = useCallback(async (abortController) => {
    try {
      setIsLoading(true);
      setFetchError(null);
      const response = await api.get('/clients', { signal: abortController?.signal });
      // Depending on axios interceptor, response might already be the unwrapped data array
      // But contract says { success: true, data: [...] }. Interceptor returns response.data.data if exists.
      // So response is likely the array itself.
      const dataArray = Array.isArray(response) ? response : response.data;
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

  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const searchMatch = client.name.toLowerCase().includes(search.toLowerCase()) || 
                          client.email.toLowerCase().includes(search.toLowerCase());
      const statusMatch = activeStatus === 'Tous' || client.status === activeStatus;
      return searchMatch && statusMatch;
    });
  }, [clients, search, activeStatus]);

  const handleToggleSuspend = async (client) => {
    if (isUpdatingId) return;

    if (!client.isSuspended) {
      // Ouvre la modale pour confirmer la suspension
      setClientToSuspend(client);
      setShowSuspendModal(true);
      return;
    }

    // Réactivation directe
    try {
      setIsUpdatingId(client.id);
      const body = { client_status: client.status, is_suspended: 0 };
      await api.put(`/clients/${client.id}/status`, body);
      toast.success("Client réactivé.");
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
      toast.success("Client suspendu.");
      setClients(clients.map(c => c.id === clientToSuspend.id ? { ...c, isSuspended: true } : c));
      setShowSuspendModal(false);
      setClientToSuspend(null);
    } catch (error) {
      const msg = error.response?.data?.error || error.response?.data?.message || "Impossible de suspendre le client.";
      toast.error(msg);
    } finally {
      setIsUpdatingId(null);
    }
  };

  const totalClients = clients.length;
  const nouveauxClients = clients.filter(c => c.status === 'Nouveau').length;
  const standardClients = clients.filter(c => c.status === 'Standard').length;

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-royal">
        <span className="w-1.5 h-1.5 bg-royal rounded-full" aria-hidden="true"></span>
        CRM & RÉSEAU
      </div>
      <h1 className="font-serif text-4xl text-ink mt-1">Gestion des Clients</h1>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 mt-6">
        <div className="bg-white border border-ink/10 rounded-sm p-6">
          <div className="text-xs tracking-widest text-ink/60 uppercase mb-2">TOTAL CLIENTS</div>
          {isLoading ? <div className="h-10 bg-gray-200 animate-pulse rounded w-16"></div> : <div className="text-4xl font-serif text-ink">{totalClients}</div>}
        </div>
        <div className="bg-white border border-ink/10 rounded-sm p-6">
          <div className="text-xs tracking-widest text-ink/60 uppercase mb-2">NOUVEAUX CLIENTS</div>
          {isLoading ? <div className="h-10 bg-gray-200 animate-pulse rounded w-16"></div> : <div className="text-4xl font-serif text-ink">{nouveauxClients}</div>}
        </div>
        <div className="bg-white border border-ink/10 rounded-sm p-6">
          <div className="text-xs tracking-widest text-ink/60 uppercase mb-2">CLIENTS STANDARDS</div>
          {isLoading ? <div className="h-10 bg-gray-200 animate-pulse rounded w-16"></div> : <div className="text-4xl font-serif text-ink">{standardClients}</div>}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-10">
        <div className="relative w-full sm:max-w-md">
          <label htmlFor="client-search" className="sr-only">Rechercher un client</label>
          <input 
            id="client-search" 
            type="text" 
            placeholder="Rechercher par nom ou email..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-ink/15 rounded-[1px] px-4 py-2.5 text-sm focus:outline-none focus:border-royal"
          />
        </div>
        
        <div className="flex items-center flex-wrap gap-2">
          {['Tous', 'Nouveau', 'Standard'].map((status) => (
            <button
              key={status}
              type="button"
              aria-pressed={activeStatus === status}
              onClick={() => setActiveStatus(status)}
              className={`text-xs uppercase tracking-widest px-4 py-2 transition-colors rounded-sm border ${
                activeStatus === status 
                  ? 'border-royal bg-royal text-white' 
                  : 'border-ink/15 text-ink-muted hover:border-royal hover:text-royal'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto mt-8 bg-white border border-ink/10 rounded-sm">
        <table className="w-full min-w-[880px] text-left text-sm">
          <caption className="sr-only">Répertoire des clients enregistrés</caption>
          <thead>
            <tr className="font-mono text-[10px] uppercase tracking-widest text-ink-muted border-b border-ink/10">
              <th scope="col" className="px-6 py-4 font-normal">PROFIL CLIENT</th>
              <th scope="col" className="px-6 py-4 font-normal">TÉLÉPHONE</th>
              <th scope="col" className="px-6 py-4 font-normal">STATUT</th>
              <th scope="col" className="px-6 py-4 font-normal">CHIFFRE D'AFFAIRES</th>
              <th scope="col" className="px-6 py-4 font-normal text-right">ACCÈS</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [...Array(5)].map((_, idx) => (
                <tr key={idx} className="border-b border-ink/10 last:border-b-0">
                  <td className="px-6 py-4"><div className="h-10 bg-gray-200 animate-pulse rounded"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-gray-200 animate-pulse rounded w-24"></div></td>
                  <td className="px-6 py-4"><div className="h-6 bg-gray-200 animate-pulse rounded-full w-20"></div></td>
                  <td className="px-6 py-4"><div className="h-10 bg-gray-200 animate-pulse rounded"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-gray-200 animate-pulse rounded w-16 ml-auto"></div></td>
                </tr>
              ))
            ) : fetchError ? (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center">
                  <div className="text-red-600 mb-4">{fetchError}</div>
                  <button onClick={() => loadClients()} className="px-4 py-2 border border-ink/15 text-xs uppercase tracking-widest hover:border-royal hover:text-royal transition-colors rounded-sm">Réessayer</button>
                </td>
              </tr>
            ) : filteredClients.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-ink-muted">
                  Aucun client ne correspond à votre recherche.
                </td>
              </tr>
            ) : (
              filteredClients.map((client) => {
                const statusStyle = STATUS_STYLES[client.status] || DEFAULT_STATUS_STYLE;
                return (
                <tr key={client.id} className={`border-b border-ink/10 last:border-b-0 ${client.isSuspended ? 'opacity-60' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <span className="text-ink font-medium">{client.name}</span>
                      {client.isSuspended && (
                        <span className="text-[10px] uppercase tracking-widest text-red-600 bg-red-50 px-2 py-0.5 rounded-full ml-2">
                          Suspendu
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-ink-muted mt-1">{client.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <a href={`tel:${client.phone.replace(/\s+/g, '')}`} className="text-ink hover:text-royal transition-colors">
                      {client.phone}
                    </a>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full inline-block ${statusStyle.bg} ${statusStyle.text}`}>
                      {client.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-serif text-ink">
                      {client.totalRevenue.toLocaleString('fr-FR')} FCFA
                    </div>
                    <div className="text-xs text-ink-muted mt-1">
                      {client.bookingsCount} {client.bookingsCount > 1 ? 'séjours' : 'séjour'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {client.isSuspended ? (
                      <button 
                        type="button" 
                        aria-label={`Réactiver l'accès de ${client.name}`} 
                        onClick={() => handleToggleSuspend(client)}
                        disabled={isUpdatingId === client.id}
                        className="text-emerald-600 text-xs uppercase tracking-widest hover:underline disabled:opacity-50 disabled:no-underline"
                      >
                        {isUpdatingId === client.id ? '...' : 'Réactiver'}
                      </button>
                    ) : (
                      <button 
                        type="button" 
                        aria-label={`Suspendre l'accès de ${client.name}`} 
                        onClick={() => handleToggleSuspend(client)}
                        disabled={isUpdatingId === client.id}
                        className="text-red-600 text-xs uppercase tracking-widest hover:underline disabled:opacity-50 disabled:no-underline"
                      >
                        {isUpdatingId === client.id ? '...' : 'Suspendre'}
                      </button>
                    )}
                  </td>
                </tr>
              )})
            )}
          </tbody>
        </table>
      </div>

      {showSuspendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md shadow-2xl flex flex-col">
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="text-sm font-medium uppercase tracking-widest text-red-600">
                Confirmation requise
              </h3>
            </div>
            <div className="px-6 py-6 text-gray-600 text-sm leading-relaxed">
              Êtes-vous sûr de vouloir suspendre l'accès de <strong>{clientToSuspend?.name}</strong> ?
            </div>
            <div className="px-6 py-5 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowSuspendModal(false)}
                disabled={isUpdatingId !== null}
                className="px-5 py-2.5 text-xs uppercase tracking-widest text-gray-500 hover:text-gray-800 transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmSuspend}
                disabled={isUpdatingId !== null}
                className="px-5 py-2.5 text-xs uppercase tracking-widest bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isUpdatingId === clientToSuspend?.id ? 'Suspension...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
