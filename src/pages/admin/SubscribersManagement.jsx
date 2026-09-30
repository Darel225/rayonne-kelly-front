import { useState, useMemo, useEffect, useCallback } from 'react';
import { Search } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';
import Button from '../../components/common/Button';

const mapSubscriber = (row) => ({
  id: row.id,
  email: row.email,
  status: Number(row.is_active) === 1 ? 'Actif' : 'Désabonné',
  dateSubscribed: row.created_at ? row.created_at.replace(' ', 'T') : new Date().toISOString(),
});

export default function SubscribersManagement() {
  const [subscribers, setSubscribers] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [isUpdatingId, setIsUpdatingId] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [subToDelete, setSubToDelete] = useState(null);

  const loadSubscribers = useCallback(async (abortController) => {
    try {
      setIsLoading(true);
      setFetchError(null);
      const response = await api.get('/admin/subscribers', { signal: abortController?.signal });
      const dataArray = Array.isArray(response) ? response : response.data;
      setSubscribers(dataArray.map(mapSubscriber));
    } catch (error) {
      if (error.name === 'CanceledError' || error.message === 'canceled') return;
      const msg = error.response?.data?.error || error.response?.data?.message || "Impossible de charger les abonnés.";
      setFetchError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const abortController = new AbortController();
    loadSubscribers(abortController);
    return () => abortController.abort();
  }, [loadSubscribers]);

  const filteredSubscribers = useMemo(() => {
    return subscribers.filter(sub => 
      sub.email.toLowerCase().includes(search.toLowerCase())
    );
  }, [subscribers, search]);

  const activeCount = subscribers.filter(s => s.status === 'Actif').length;

  // Illustrative: count new subscribers this month. Since all dates are fixed mock data,
  // we just compare the month and year against today (new Date()). 
  const newThisMonthCount = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return subscribers.filter(s => {
      const date = new Date(s.dateSubscribed);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).length;
  }, [subscribers]);

  const handleExport = () => {
    // Generate CSV string from the currently filtered subscribers
    const headers = ['Email', "Date d'inscription", 'Statut'];
    const rows = filteredSubscribers.map(sub => {
      // Basic escaping: wrap in double quotes if it contains a comma
      const escapeField = (field) => {
        const stringField = String(field);
        return stringField.includes(',') ? `"${stringField}"` : stringField;
      };
      
      const formattedDate = new Date(sub.dateSubscribed).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
      return [escapeField(sub.email), escapeField(formattedDate), escapeField(sub.status)].join(',');
    });
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'abonnes-rayonne-kelly.csv');
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleToggleStatus = async (id) => {
    if (isUpdatingId) return;
    const sub = subscribers.find(s => s.id === id);
    if (!sub) return;

    try {
      setIsUpdatingId(id);
      const newStatusValue = sub.status === 'Actif' ? 0 : 1;
      await api.put(`/admin/subscribers/${id}/status`, { is_active: newStatusValue });
      toast.success("Statut mis à jour.");
      setSubscribers(prev => prev.map(s => s.id === id ? { ...s, status: newStatusValue === 1 ? 'Actif' : 'Désabonné' } : s));
    } catch (error) {
      const msg = error.response?.data?.error || error.response?.data?.message || "Erreur lors de la mise à jour.";
      toast.error(msg);
    } finally {
      setIsUpdatingId(null);
    }
  };

  const handleDelete = (sub) => {
    setSubToDelete(sub);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!subToDelete || isUpdatingId) return;
    try {
      setIsUpdatingId(subToDelete.id);
      await api.delete(`/admin/subscribers/${subToDelete.id}`);
      toast.success("Abonné supprimé.");
      setSubscribers(prev => prev.filter(s => s.id !== subToDelete.id));
      setShowDeleteModal(false);
      setSubToDelete(null);
    } catch (error) {
      const msg = error.response?.data?.error || error.response?.data?.message || "Impossible de supprimer l'abonné.";
      toast.error(msg);
    } finally {
      setIsUpdatingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-royal">
        <span className="w-1.5 h-1.5 bg-royal rounded-full" aria-hidden="true"></span>
        AUDIENCE & GAZETTE
      </div>
      
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mt-2">
        <h1 className="font-serif text-4xl text-ink mt-1">Newsletter & Abonnés</h1>
        <Button variant="royal" onClick={handleExport} className="uppercase tracking-widest text-xs whitespace-nowrap">
          Exporter les contacts (CSV)
        </Button>
      </div>

      {/* Quick Stats & Search */}
      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
        
        <div className="flex flex-col sm:flex-row gap-6 md:col-span-2">
          <div className="border border-ink/10 rounded-sm p-4 w-full sm:w-1/2">
            <div className="font-mono text-[10px] uppercase tracking-widest text-ink-muted mb-2">Abonnés actifs</div>
            {isLoading ? <div className="h-8 bg-gray-200 animate-pulse rounded w-16"></div> : <div className="font-serif text-2xl text-ink">{activeCount}</div>}
          </div>
          <div className="border border-ink/10 rounded-sm p-4 w-full sm:w-1/2">
            <div className="font-mono text-[10px] uppercase tracking-widest text-ink-muted mb-2">Nouveaux ce mois-ci</div>
            {isLoading ? <div className="h-8 bg-gray-200 animate-pulse rounded w-16"></div> : <div className="font-serif text-2xl text-ink">{newThisMonthCount}</div>}
          </div>
        </div>

        <div className="relative w-full">
          <label htmlFor="subscriber-search" className="sr-only">Rechercher un abonné par email</label>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted h-4 w-4" />
          <input 
            id="subscriber-search" 
            type="text" 
            placeholder="Rechercher par email..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-ink/15 rounded-[1px] pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-royal" 
          />
        </div>
        
      </div>

      {/* Table */}
      <div className="overflow-x-auto mt-8 bg-white border border-ink/10 rounded-sm">
        <table className="w-full text-left text-sm min-w-[700px]">
          <caption className="sr-only">Liste des abonnés à la gazette privée</caption>
          <thead>
            <tr className="border-b border-ink/10">
              <th scope="col" className="py-4 px-6 font-mono text-[10px] uppercase font-normal text-ink-muted tracking-widest">Email</th>
              <th scope="col" className="py-4 px-6 font-mono text-[10px] uppercase font-normal text-ink-muted tracking-widest">Date d'inscription</th>
              <th scope="col" className="py-4 px-6 font-mono text-[10px] uppercase font-normal text-ink-muted tracking-widest">Statut</th>
              <th scope="col" className="py-4 px-6 font-mono text-[10px] uppercase font-normal text-ink-muted tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [...Array(5)].map((_, idx) => (
                <tr key={idx} className="border-b border-ink/10 last:border-b-0">
                  <td className="py-4 px-6"><div className="h-5 bg-gray-200 animate-pulse rounded w-48"></div></td>
                  <td className="py-4 px-6"><div className="h-5 bg-gray-200 animate-pulse rounded w-24"></div></td>
                  <td className="py-4 px-6"><div className="h-5 bg-gray-200 animate-pulse rounded w-20"></div></td>
                  <td className="py-4 px-6"><div className="h-5 bg-gray-200 animate-pulse rounded w-32 ml-auto"></div></td>
                </tr>
              ))
            ) : fetchError ? (
              <tr>
                <td colSpan="4" className="py-12 text-center">
                  <div className="text-red-600 mb-4">{fetchError}</div>
                  <button onClick={() => loadSubscribers()} className="px-4 py-2 border border-ink/15 text-xs uppercase tracking-widest hover:border-royal hover:text-royal transition-colors rounded-sm">Réessayer</button>
                </td>
              </tr>
            ) : filteredSubscribers.length === 0 ? (
              <tr>
                <td colSpan="4" className="py-12 text-center text-ink-muted text-sm">
                  Aucun abonné ne correspond à votre recherche.
                </td>
              </tr>
            ) : (
              filteredSubscribers.map((sub) => {
                const isActif = sub.status === 'Actif';
                return (
                  <tr key={sub.id} className="border-b border-ink/10 last:border-b-0 hover:bg-ink/5 transition-colors">
                    <td className="py-4 px-6 text-ink font-medium">
                      {sub.email}
                    </td>
                    <td className="py-4 px-6 text-ink-muted">
                      {new Date(sub.dateSubscribed).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${isActif ? 'bg-emerald-500' : 'bg-gray-400'}`} aria-hidden="true"></span>
                        <span className="text-ink text-sm">{sub.status}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-end gap-4">
                        <button 
                          type="button" 
                          onClick={() => handleToggleStatus(sub.id)}
                          aria-label={`Changer le statut de ${sub.email}`}
                          disabled={isUpdatingId === sub.id}
                          className="text-xs uppercase tracking-widest text-royal hover:text-royal/80 transition-colors disabled:opacity-50"
                        >
                          {isUpdatingId === sub.id ? '...' : 'Changer le statut'}
                        </button>
                        <button 
                          type="button" 
                          onClick={() => handleDelete(sub)}
                          aria-label={`Supprimer ${sub.email}`}
                          disabled={isUpdatingId === sub.id}
                          className="text-xs uppercase tracking-widest text-red-600 hover:text-red-700 transition-colors disabled:opacity-50"
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md shadow-2xl flex flex-col">
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="text-sm font-medium uppercase tracking-widest text-red-600">
                Confirmation requise
              </h3>
            </div>
            <div className="px-6 py-6 text-gray-600 text-sm leading-relaxed">
              Êtes-vous sûr de vouloir supprimer l'abonné <strong>{subToDelete?.email}</strong> ?<br/><br/>
              Cette action est irréversible.
            </div>
            <div className="px-6 py-5 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isUpdatingId !== null}
                className="px-5 py-2.5 text-xs uppercase tracking-widest text-gray-500 hover:text-gray-800 transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isUpdatingId !== null}
                className="px-5 py-2.5 text-xs uppercase tracking-widest bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isUpdatingId === subToDelete?.id ? 'Suppression...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
