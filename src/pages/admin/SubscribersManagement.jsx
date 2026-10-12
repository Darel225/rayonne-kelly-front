import { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Search, 
  X, 
  Download, 
  Mail, 
  UserCheck, 
  UserMinus, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw, 
  Trash2, 
  Loader2, 
  AlertCircle 
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';

const mapSubscriber = (row) => ({
  id: row.id,
  email: row.email,
  status: Number(row.is_active) === 1 ? 'Actif' : 'Désabonné',
  dateSubscribed: row.created_at ? row.created_at.replace(' ', 'T') : new Date().toISOString(),
});

export default function SubscribersManagement() {
  const [subscribers, setSubscribers] = useState([]);
  const [search, setSearch] = useState('');
  const [activeStatus, setActiveStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [isUpdatingId, setIsUpdatingId] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [subToDelete, setSubToDelete] = useState(null);

  const loadSubscribers = useCallback(async (abortController) => {
    try {
      setIsLoading(true);
      setFetchError(null);
      const response = await api.get('/admin/subscribers', { signal: abortController?.signal });
      const dataArray = Array.isArray(response) ? response : (response?.data || []);
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

  // KPIs
  const totalCount = subscribers.length;
  const activeCount = subscribers.filter(s => s.status === 'Actif').length;
  const inactiveCount = subscribers.filter(s => s.status === 'Désabonné').length;

  const newThisMonthCount = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return subscribers.filter(s => {
      const date = new Date(s.dateSubscribed);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).length;
  }, [subscribers]);

  // Filtrage combiné : Recherche + Statut
  const filteredSubscribers = useMemo(() => {
    return subscribers.filter(sub => {
      if (activeStatus === 'active' && sub.status !== 'Actif') return false;
      if (activeStatus === 'inactive' && sub.status !== 'Désabonné') return false;
      if (search.trim() && !sub.email.toLowerCase().includes(search.toLowerCase().trim())) {
        return false;
      }
      return true;
    });
  }, [subscribers, activeStatus, search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, activeStatus, itemsPerPage]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredSubscribers.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredSubscribers.length);
  const paginatedSubscribers = filteredSubscribers.slice(startIndex, endIndex);

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

  const handleExport = () => {
    const headers = ['Email', "Date d'inscription", 'Statut'];
    const rows = filteredSubscribers.map(sub => {
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
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Exportation CSV téléchargée.");
  };

  const handleToggleStatus = async (id) => {
    if (isUpdatingId) return;
    const sub = subscribers.find(s => s.id === id);
    if (!sub) return;

    const nextIsActive = sub.status === 'Actif' ? 0 : 1;
    try {
      setIsUpdatingId(id);
      await api.put(`/admin/subscribers/${id}`, { is_active: nextIsActive });
      setSubscribers(subscribers.map(s => s.id === id ? { ...s, status: nextIsActive === 1 ? 'Actif' : 'Désabonné' } : s));
      toast.success("Statut de l'abonné mis à jour.");
    } catch (error) {
      toast.error("Impossible de modifier le statut de l'abonné.");
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
      setSubscribers(subscribers.filter(s => s.id !== subToDelete.id));
      setShowDeleteModal(false);
      toast.success("Abonné supprimé avec succès.");
    } catch (error) {
      toast.error("Impossible de supprimer l'abonné.");
    } finally {
      setIsUpdatingId(null);
      setSubToDelete(null);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      
      {/* 1. EN-TÊTE PRINCIPAL */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-gold">Communication & Audience Privée</div>
          <h1 className="font-serif text-3xl text-ink mt-1">Newsletter & Abonnés</h1>
        </div>

        <button
          type="button"
          onClick={handleExport}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-ink border border-ink/20 hover:border-gold hover:text-night text-xs uppercase tracking-wider font-mono rounded-sm transition-all shadow-xs cursor-pointer shrink-0"
        >
          <Download className="w-3.5 h-3.5 text-gold" />
          <span>Exporter la liste (CSV)</span>
        </button>
      </div>

      {/* 2. KPIS DE SYNTHÈSE */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-sm border border-ink/10 shadow-xs">
          <div className="flex items-center justify-between text-ink-muted mb-2">
            <span className="font-mono text-[10px] uppercase tracking-wider">Total Abonnés</span>
            <Mail size={16} className="text-ink-muted" />
          </div>
          <div className="font-serif text-2xl text-ink">{totalCount}</div>
          <div className="text-[11px] text-ink-muted mt-1 font-sans">
            Contacts enregistrés
          </div>
        </div>

        <div className="bg-white p-5 rounded-sm border border-ink/10 shadow-xs">
          <div className="flex items-center justify-between text-ink-muted mb-2">
            <span className="font-mono text-[10px] uppercase tracking-wider">Actifs</span>
            <UserCheck size={16} className="text-emerald-600" />
          </div>
          <div className="font-serif text-2xl text-emerald-700">{activeCount}</div>
          <div className="text-[11px] text-emerald-800/80 mt-1 font-sans">
            Réceptionnaires réguliers
          </div>
        </div>

        <div className="bg-white p-5 rounded-sm border border-ink/10 shadow-xs">
          <div className="flex items-center justify-between text-ink-muted mb-2">
            <span className="font-mono text-[10px] uppercase tracking-wider">Nouveaux ce mois</span>
            <Calendar size={16} className="text-royal" />
          </div>
          <div className="font-serif text-2xl text-royal">{newThisMonthCount}</div>
          <div className="text-[11px] text-royal/80 mt-1 font-sans">
            Inscrits récents
          </div>
        </div>

        <div className="bg-white p-5 rounded-sm border border-ink/10 shadow-xs">
          <div className="flex items-center justify-between text-ink-muted mb-2">
            <span className="font-mono text-[10px] uppercase tracking-wider">Désabonnés</span>
            <UserMinus size={16} className="text-gray-400" />
          </div>
          <div className="font-serif text-2xl text-gray-500">{inactiveCount}</div>
          <div className="text-[11px] text-gray-500/80 mt-1 font-sans">
            Comptes désactivés
          </div>
        </div>
      </div>

      {/* 3. BARRE D'ONGLETS */}
      <div className="border-b border-ink/10 flex items-center overflow-x-auto gap-2 sm:gap-4 pb-px">
        {[
          { id: 'all', label: 'Tous les abonnés', count: totalCount },
          { id: 'active', label: 'Actifs', count: activeCount },
          { id: 'inactive', label: 'Désabonnés', count: inactiveCount }
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
            placeholder="Rechercher par adresse email..."
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

          {(search || activeStatus !== 'all') && (
            <button
              type="button"
              onClick={() => { setSearch(''); setActiveStatus('all'); }}
              className="text-xs text-royal hover:underline font-mono inline-flex items-center gap-1 cursor-pointer pl-2"
            >
              <RefreshCw size={11} /> Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* 5. TABLEAU DES ABONNÉS */}
      <div className="bg-white rounded-sm border border-ink/10 overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 text-royal animate-spin mb-3" />
            <p className="text-xs font-mono uppercase tracking-widest text-ink-muted">Chargement des abonnés...</p>
          </div>
        ) : fetchError ? (
          <div className="py-16 text-center">
            <p className="text-sm text-red-600 mb-4">{fetchError}</p>
            <button
              type="button"
              onClick={() => loadSubscribers()}
              className="px-4 py-2 border border-ink/15 text-xs uppercase tracking-widest hover:border-royal hover:text-royal transition-colors rounded-sm"
            >
              Réessayer
            </button>
          </div>
        ) : filteredSubscribers.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <Mail className="h-10 w-10 text-ink-muted/40 mb-3" />
            <h3 className="font-serif text-lg text-ink mb-1">Aucun abonné trouvé</h3>
            <p className="text-ink-muted text-xs max-w-sm mb-4">
              Aucune adresse email ne correspond à vos filtres actuels.
            </p>
            <button
              type="button"
              onClick={() => { setSearch(''); setActiveStatus('all'); }}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-ink text-xs uppercase tracking-wider font-mono rounded-sm transition-colors cursor-pointer"
            >
              Voir tous les abonnés
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <caption className="sr-only">Liste des abonnés à la newsletter</caption>
              <thead>
                <tr className="border-b border-ink/10 bg-gray-50/80">
                  <th scope="col" className="py-3.5 pl-6 pr-4 font-mono text-[10px] uppercase font-normal text-ink-muted">Adresse Email</th>
                  <th scope="col" className="py-3.5 pr-4 font-mono text-[10px] uppercase font-normal text-ink-muted">Date d'Inscription</th>
                  <th scope="col" className="py-3.5 pr-4 font-mono text-[10px] uppercase font-normal text-ink-muted">Statut</th>
                  <th scope="col" className="py-3.5 pr-6 font-mono text-[10px] uppercase font-normal text-ink-muted text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {paginatedSubscribers.map((sub) => {
                  const isActif = sub.status === 'Actif';
                  return (
                    <tr key={sub.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 pl-6 pr-4 align-top">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-full bg-gray-100 text-ink-muted flex items-center justify-center shrink-0">
                            <Mail size={13} />
                          </div>
                          <span className="font-medium text-ink text-xs">{sub.email}</span>
                        </div>
                      </td>
                      <td className="py-4 pr-4 align-top text-xs text-ink-muted font-mono">
                        {new Date(sub.dateSubscribed).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-4 pr-4 align-top">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xs text-[10px] font-mono uppercase tracking-wider border ${
                          isActif 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-gray-100 text-gray-500 border-gray-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isActif ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                          {sub.status}
                        </span>
                      </td>
                      <td className="py-4 pr-6 align-top text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button 
                            type="button" 
                            onClick={() => handleToggleStatus(sub.id)}
                            disabled={isUpdatingId === sub.id}
                            className="text-xs uppercase tracking-wider font-mono text-royal hover:underline disabled:opacity-50 cursor-pointer"
                          >
                            {isUpdatingId === sub.id ? '...' : isActif ? 'Désactiver' : 'Activer'}
                          </button>
                          <button 
                            type="button" 
                            onClick={() => handleDelete(sub)}
                            disabled={isUpdatingId === sub.id}
                            className="inline-flex items-center gap-1 text-xs uppercase tracking-wider font-mono text-red-600 hover:text-red-700 disabled:opacity-50 cursor-pointer"
                          >
                            <Trash2 size={12} />
                            <span>Supprimer</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 6. PAGINATION */}
        {filteredSubscribers.length > 0 && !isLoading && (
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-ink/10 px-6 py-4 bg-gray-50/60 gap-4">
            <div className="text-xs text-ink-muted font-mono">
              Affichage de <strong className="text-ink">{startIndex + 1}</strong> à <strong className="text-ink">{endIndex}</strong> sur <strong className="text-ink">{filteredSubscribers.length}</strong> abonné{filteredSubscribers.length > 1 ? 's' : ''}
              {filteredSubscribers.length !== totalCount && (
                <span className="text-[11px] text-gold ml-1">
                  (filtré sur {totalCount} au total)
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

      {/* MODALE DE SUPPRESSION */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md shadow-2xl rounded-sm border border-ink/10 overflow-hidden">
            <div className="px-6 py-4 border-b border-ink/10 bg-gray-50/50">
              <h3 className="text-xs font-mono uppercase tracking-widest text-red-600 font-semibold flex items-center gap-2">
                <Trash2 size={14} /> Confirmation de suppression
              </h3>
            </div>
            <div className="p-6 text-ink text-sm leading-relaxed">
              Êtes-vous sûr de vouloir supprimer définitivement l'abonné <strong>{subToDelete?.email}</strong> ?<br/><br/>
              Cette action est irréversible et retirera ce contact de la liste de diffusion.
            </div>
            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-ink/10">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isUpdatingId !== null}
                className="px-4 py-2 text-xs uppercase tracking-widest text-ink-muted hover:text-ink transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isUpdatingId !== null}
                className="px-4 py-2 text-xs uppercase tracking-widest bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2 rounded-sm cursor-pointer"
              >
                {isUpdatingId === subToDelete?.id ? 'Suppression...' : 'Confirmer la suppression'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
