import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  ArrowRight, 
  ArrowDown, 
  Loader2, 
  AlertCircle, 
  Check, 
  Lock, 
  Unlock, 
  Search, 
  X, 
  Filter, 
  Calendar, 
  Users, 
  SlidersHorizontal, 
  Clock, 
  CheckCircle2, 
  Ban, 
  Building2,
  RefreshCw
} from 'lucide-react';
import api from '../../services/api';
import { toast } from 'sonner';
import { downloadBookingDocument } from '../../utils/downloadBookingDocument';
import BlockDatesModal from '../../components/admin/BlockDatesModal';

export default function BookingsManagement() {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [isDownloading, setIsDownloading] = useState(null);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);

  // Filtres et Recherche
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedResidence, setSelectedResidence] = useState('all');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const bookingsRes = await api.get('/bookings', { signal: controller.signal });
        
        if (!isMounted) return;
        
        const bData = Array.isArray(bookingsRes) ? bookingsRes : (bookingsRes?.data || []);
        
        bData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setBookings(bData);
      } catch (err) {
        if (!isMounted) return;
        if (err.name === 'CanceledError') return;
        console.error(err);
        setError("Impossible de charger les données des réservations.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [retryCount]);

  // Helper pour identifier les verrouillages administratifs
  const isBlockBooking = (b) => Boolean(b.special_requests?.includes('[VERROUILLAGE ADMINISTRATIF]'));

  // Statistiques KPIs
  const stats = useMemo(() => {
    const total = bookings.length;
    const clientBookings = bookings.filter(b => !isBlockBooking(b));
    const adminBlocks = bookings.filter(b => isBlockBooking(b));
    
    const pending = clientBookings.filter(b => b.status === 'pending').length;
    const requests = clientBookings.filter(b => ['cancellation_requested', 'modification_requested'].includes(b.status)).length;
    const validated = bookings.filter(b => b.status === 'validated').length;
    const activeBlocks = adminBlocks.filter(b => b.status === 'validated').length;
    const completed = bookings.filter(b => b.status === 'completed').length;
    const cancelled = bookings.filter(b => b.status === 'cancelled').length;

    return {
      total,
      clientCount: clientBookings.length,
      adminBlockCount: adminBlocks.length,
      pending,
      requests,
      actionRequired: pending + requests,
      validated,
      activeBlocks,
      completed,
      cancelled
    };
  }, [bookings]);

  // Onglets intelligents avec compteurs
  const bookingTabs = useMemo(() => [
    { id: 'all', label: 'Toutes', count: stats.total },
    { id: 'clients', label: 'Réservations Clients', count: stats.clientCount },
    { id: 'blocks', label: 'Verrouillages Admin', count: stats.adminBlockCount },
    { id: 'pending', label: 'En attente', count: stats.pending, alert: stats.pending > 0 },
    { id: 'requests', label: 'Demandes en cours', count: stats.requests, alert: stats.requests > 0 },
    { id: 'validated', label: 'Validées', count: stats.validated },
    { id: 'completed', label: 'Terminées', count: stats.completed },
    { id: 'cancelled', label: 'Annulées', count: stats.cancelled },
  ], [stats]);

  // Liste unique des résidences pour le filtre
  const residenceOptions = useMemo(() => {
    const list = Array.from(new Set(bookings.map(b => b.residence_name).filter(Boolean)));
    return list.sort();
  }, [bookings]);

  // Filtrage combiné : Onglet + Résidence + Recherche textuelle
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      // 1. Filtre d'onglet
      if (filterStatus === 'clients' && isBlockBooking(b)) return false;
      if (filterStatus === 'blocks' && !isBlockBooking(b)) return false;
      if (filterStatus === 'requests' && !['cancellation_requested', 'modification_requested'].includes(b.status)) return false;
      if (!['all', 'clients', 'blocks', 'requests'].includes(filterStatus) && b.status !== filterStatus) return false;

      // 2. Filtre de résidence
      if (selectedResidence !== 'all' && b.residence_name !== selectedResidence) return false;

      // 3. Recherche textuelle
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const refMatch = b.reference?.toLowerCase().includes(query);
        const nameMatch = `${b.user_first_name || ''} ${b.user_last_name || ''}`.toLowerCase().includes(query);
        const residenceMatch = `${b.residence_name || ''} ${b.residence_location || ''}`.toLowerCase().includes(query);
        const notesMatch = b.special_requests?.toLowerCase().includes(query);
        const reasonMatch = b.request_reason?.toLowerCase().includes(query);

        if (!refMatch && !nameMatch && !residenceMatch && !notesMatch && !reasonMatch) {
          return false;
        }
      }

      return true;
    });
  }, [bookings, filterStatus, selectedResidence, searchQuery]);

  // Réinitialiser la page à 1 lors d'un changement de filtre
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, selectedResidence, searchQuery, itemsPerPage]);

  // Calcul pagination
  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredBookings.length);
  const paginatedBookings = filteredBookings.slice(startIndex, endIndex);

  // Génération des numéros de page (avec ellipses élégantes)
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

  const handleStatusUpdate = async (id, newStatus) => {
    if (actionLoadingId) return;
    setActionLoadingId(id);
    try {
      await api.put(`/bookings/${id}/status`, { status: newStatus });
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
      toast.success(newStatus === 'cancelled' && isBlockBooking(bookings.find(b => b.id === id)) 
        ? "Période déverrouillée avec succès. Dates à nouveau disponibles." 
        : "Statut mis à jour avec succès.");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Erreur lors de la mise à jour du statut.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDownload = async (bookingId, reference, type) => {
    setIsDownloading(bookingId);
    const result = await downloadBookingDocument(bookingId, reference, type);
    if (!result.success) {
      toast.error(result.message);
      if ([403, 404, 409].includes(result.status)) {
        setRetryCount(prev => prev + 1);
      }
    } else {
      toast.success(type === 'completed' ? "Facture téléchargée." : "Confirmation téléchargée.");
    }
    setIsDownloading(null);
  };

  const getStatusDisplay = (status) => {
    switch (status) {
      case 'pending': return { color: 'bg-amber-500', label: 'En attente' };
      case 'validated': return { color: 'bg-emerald-500', label: 'Validée' };
      case 'rejected': return { color: 'bg-red-500', label: 'Rejetée' };
      case 'completed': return { color: 'bg-royal', label: 'Terminée' };
      case 'cancelled': return { color: 'bg-gray-400', label: 'Annulée' };
      case 'cancellation_requested': return { color: 'bg-violet-500', label: 'Annulation demandée' };
      case 'modification_requested': return { color: 'bg-blue-500', label: 'Modification demandée' };
      default: return { color: 'bg-gray-500', label: status };
    }
  };

  const resetAllFilters = () => {
    setFilterStatus('all');
    setSearchQuery('');
    setSelectedResidence('all');
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="max-w-[1400px] mx-auto py-16 flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 text-royal animate-spin mb-4" />
        <p className="text-ink-muted text-xs uppercase tracking-widest font-mono">Chargement des dossiers...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-[1400px] mx-auto py-16 flex flex-col items-center justify-center min-h-[50vh] text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="font-serif text-2xl text-ink mb-2">Erreur de chargement</h2>
        <p className="text-sm text-ink-muted max-w-md">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-6 px-5 py-2.5 bg-royal text-white text-xs uppercase tracking-widest rounded-sm hover:bg-royal-dark transition-colors cursor-pointer"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      
      {/* 1. EN-TÊTE PRINCIPAL */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-gold">Traitement des Séjours</div>
          <h1 className="font-serif text-3xl text-ink mt-1">Gestion des Réservations</h1>
        </div>

        <button
          type="button"
          onClick={() => setIsBlockModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-night text-gold border border-gold/40 hover:border-gold hover:bg-black text-xs uppercase tracking-wider font-mono rounded-sm transition-all shadow-sm cursor-pointer shrink-0"
        >
          <Lock className="w-3.5 h-3.5 text-gold" />
          <span>Verrouiller des dates</span>
        </button>
      </div>

      {/* 2. CARTES DE SYNTHÈSE / KPIS LUXE */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Dossiers */}
        <div className="bg-white p-5 rounded-sm border border-ink/10 shadow-xs">
          <div className="flex items-center justify-between text-ink-muted mb-2">
            <span className="font-mono text-[10px] uppercase tracking-wider">Total Dossiers</span>
            <Building2 size={16} className="text-ink-muted" />
          </div>
          <div className="font-serif text-2xl text-ink">{stats.total}</div>
          <div className="text-[11px] text-ink-muted mt-1 font-sans">
            {stats.clientCount} clients &bull; {stats.adminBlockCount} blocages
          </div>
        </div>

        {/* À Traiter en Priorité */}
        <div className={`p-5 rounded-sm border shadow-xs transition-colors ${stats.actionRequired > 0 ? 'bg-amber-50/40 border-amber-300' : 'bg-white border-ink/10'}`}>
          <div className="flex items-center justify-between text-ink-muted mb-2">
            <span className="font-mono text-[10px] uppercase tracking-wider">À Traiter</span>
            {stats.actionRequired > 0 ? (
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
            ) : (
              <Clock size={16} className="text-ink-muted" />
            )}
          </div>
          <div className="font-serif text-2xl text-amber-700">{stats.actionRequired}</div>
          <div className="text-[11px] text-amber-800/80 mt-1 font-sans">
            {stats.pending} en attente &bull; {stats.requests} demandes
          </div>
        </div>

        {/* Séjours Validés */}
        <div className="bg-white p-5 rounded-sm border border-ink/10 shadow-xs">
          <div className="flex items-center justify-between text-ink-muted mb-2">
            <span className="font-mono text-[10px] uppercase tracking-wider">Validées</span>
            <CheckCircle2 size={16} className="text-emerald-600" />
          </div>
          <div className="font-serif text-2xl text-emerald-700">{stats.validated}</div>
          <div className="text-[11px] text-emerald-800/80 mt-1 font-sans">
            Dossiers confirmés & actifs
          </div>
        </div>

        {/* Verrouillages Actifs */}
        <div className="bg-white p-5 rounded-sm border border-ink/10 shadow-xs">
          <div className="flex items-center justify-between text-ink-muted mb-2">
            <span className="font-mono text-[10px] uppercase tracking-wider">Dates Verrouillées</span>
            <Lock size={16} className="text-gold" />
          </div>
          <div className="font-serif text-2xl text-night">{stats.activeBlocks}</div>
          <div className="text-[11px] text-ink-muted mt-1 font-sans">
            Périodes bloquées en direct
          </div>
        </div>
      </div>

      {/* 3. BARRE D'ONGLETS DE NAVIGATION */}
      <div className="border-b border-ink/10 flex items-center overflow-x-auto gap-2 sm:gap-4 pb-px">
        {bookingTabs.map((tab) => {
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
                  ? 'bg-amber-100 text-amber-800 font-bold'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 4. BARRE D'OUTILS : RECHERCHE + FILTRE RÉSIDENCE + SÉLECTEUR ÉLÉMENTS */}
      <div className="bg-white p-4 rounded-sm border border-ink/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Recherche en temps réel */}
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par référence, client, résidence..."
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

        <div className="flex flex-wrap items-center gap-3">
          {/* Filtre par Résidence */}
          <div className="flex items-center gap-2">
            <Filter size={13} className="text-ink-muted" />
            <select
              value={selectedResidence}
              onChange={(e) => setSelectedResidence(e.target.value)}
              className="bg-gray-50/70 border border-ink/10 rounded-sm px-3 py-2 text-xs text-ink focus:bg-white focus:outline-none focus:border-royal cursor-pointer"
            >
              <option value="all">Toutes les résidences</option>
              {residenceOptions.map((resName) => (
                <option key={resName} value={resName}>{resName}</option>
              ))}
            </select>
          </div>

          {/* Nombre par page */}
          <div className="flex items-center gap-2 border-l border-ink/10 pl-3">
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

          {/* Bouton Réinitialiser si recherche/filtre actif */}
          {(searchQuery || selectedResidence !== 'all' || filterStatus !== 'all') && (
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

      {/* 5. TABLEAU PRINCIPAL */}
      <div className="bg-white rounded-sm border border-ink/10 overflow-hidden shadow-xs">
        {filteredBookings.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <Building2 className="h-10 w-10 text-ink-muted/40 mb-3" />
            <h3 className="font-serif text-lg text-ink mb-1">Aucun dossier trouvé</h3>
            <p className="text-ink-muted text-xs max-w-sm mb-4">
              Aucun résultat ne correspond à vos critères de recherche ou de filtre.
            </p>
            <button
              type="button"
              onClick={resetAllFilters}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-ink text-xs uppercase tracking-wider font-mono rounded-sm transition-colors cursor-pointer"
            >
              Voir tous les dossiers
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left text-sm">
              <caption className="sr-only">Suivi des réservations et blocages</caption>
              <thead>
                <tr className="border-b border-ink/10 bg-gray-50/80">
                  <th scope="col" className="py-3.5 pl-6 pr-4 font-mono text-[10px] uppercase font-normal text-ink-muted">Réf & Date</th>
                  <th scope="col" className="py-3.5 pr-4 font-mono text-[10px] uppercase font-normal text-ink-muted">Bénéficiaire</th>
                  <th scope="col" className="py-3.5 pr-4 font-mono text-[10px] uppercase font-normal text-ink-muted">Résidence</th>
                  <th scope="col" className="py-3.5 pr-4 font-mono text-[10px] uppercase font-normal text-ink-muted">Période & Détails</th>
                  <th scope="col" className="py-3.5 pr-4 font-mono text-[10px] uppercase font-normal text-ink-muted">Montant</th>
                  <th scope="col" className="py-3.5 pr-4 font-mono text-[10px] uppercase font-normal text-ink-muted">Statut</th>
                  <th scope="col" className="py-3.5 pr-6 font-mono text-[10px] uppercase font-normal text-ink-muted text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {paginatedBookings.map((booking) => {
                  const statusInfo = getStatusDisplay(booking.status);
                  const isBlock = isBlockBooking(booking);
                  
                  const formatName = (str) => {
                    if (!str) return '';
                    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
                  };
                  
                  return (
                    <tr 
                      key={booking.id} 
                      className={`transition-colors ${
                        isBlock && booking.status === 'validated'
                          ? 'bg-amber-50/30 hover:bg-amber-50/50'
                          : 'hover:bg-gray-50/50'
                      }`}
                    >
                      {/* Réf & Date */}
                      <td className="py-4 pl-6 pr-4 align-top">
                        <Link to={`/admin/bookings/${booking.id}`} className="text-royal font-medium hover:underline block font-mono text-xs">
                          {booking.reference}
                        </Link>
                        <div className="text-[11px] text-ink-muted mt-0.5">{new Date(booking.created_at).toLocaleDateString('fr-FR')}</div>
                        
                        {isBlock && (
                          booking.status === 'validated' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 mt-1.5 rounded-xs bg-amber-500/15 text-amber-800 border border-amber-500/40 text-[9px] font-mono uppercase tracking-wider font-semibold">
                              <Lock className="w-2.5 h-2.5 text-amber-600" /> Verrouillé
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 mt-1.5 rounded-xs bg-gray-100 text-gray-500 border border-gray-200 text-[9px] font-mono uppercase tracking-wider">
                              <Unlock className="w-2.5 h-2.5 text-gray-400" /> Déverrouillé
                            </span>
                          )
                        )}
                      </td>

                      {/* Bénéficiaire / Client */}
                      <td className="py-4 pr-4 align-top">
                        {isBlock ? (
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-full bg-night text-gold text-xs font-medium flex items-center justify-center shrink-0 border border-gold/30">
                              <Lock size={12} />
                            </div>
                            <div>
                              <span className="text-ink font-medium block text-xs">Direction & Conciergerie</span>
                              <span className="text-[10px] font-mono text-ink-muted uppercase">Blocage Interne</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-full bg-amber-50 text-amber-800 text-xs font-medium flex items-center justify-center shrink-0 border border-amber-200">
                              {(booking.user_first_name?.[0] || '').toUpperCase()}{(booking.user_last_name?.[0] || '').toUpperCase()}
                            </div>
                            <div>
                              <span className="text-ink font-medium block text-xs">
                                {formatName(booking.user_first_name)} {formatName(booking.user_last_name)}
                              </span>
                              <span className="text-[10px] text-ink-muted font-mono">Client Résident</span>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Résidence */}
                      <td className="py-4 pr-4 align-top">
                        <div className="text-ink font-medium text-xs">{booking.residence_name}</div>
                        <div className="text-[11px] text-ink-muted mt-0.5">{booking.residence_location}</div>
                      </td>

                      {/* Période & Hôtes */}
                      <td className="py-4 pr-4 align-top">
                        <div className="text-ink text-xs whitespace-nowrap font-mono">
                          {new Date(booking.check_in_date).toLocaleDateString('fr-FR')} &rarr; {new Date(booking.check_out_date).toLocaleDateString('fr-FR')}
                        </div>
                        <div className="text-[11px] text-ink-muted mt-0.5">
                          {isBlock ? 'Indisponibilité réservée' : `${booking.guests_count} personne(s)`}
                        </div>
                      </td>

                      {/* Montant */}
                      <td className="py-4 pr-4 align-top">
                        {isBlock ? (
                          <div className="text-xs font-mono text-ink-muted uppercase">
                            — Interne
                          </div>
                        ) : parseFloat(booking.total_price) > 0 ? (
                          <div className="font-serif font-medium text-ink whitespace-nowrap text-xs">
                            {parseFloat(booking.total_price).toLocaleString('fr-FR')} FCFA
                          </div>
                        ) : (
                          <div>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-xs bg-gold/15 text-gold border border-gold/40 text-[9px] font-mono uppercase tracking-wider font-semibold">
                              Tarif sur devis
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Statut */}
                      <td className="py-4 pr-4 align-top">
                        {isBlock ? (
                          <>
                            <div className="flex items-center gap-1.5 whitespace-nowrap">
                              <span className={`w-2 h-2 rounded-full ${booking.status === 'validated' ? 'bg-amber-500 animate-pulse' : 'bg-gray-400'}`} aria-hidden="true" />
                              <span className="text-ink text-xs font-medium">
                                {booking.status === 'validated' ? 'Période Verrouillée' : 'Déverrouillé (Libéré)'}
                              </span>
                            </div>
                            <div className="text-[10px] text-amber-800 italic mt-0.5 max-w-[170px] truncate" title={booking.special_requests}>
                              {booking.special_requests.replace('[VERROUILLAGE ADMINISTRATIF]', '').trim()}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-1.5 whitespace-nowrap">
                              <span className={`w-2 h-2 rounded-full ${statusInfo.color}`} aria-hidden="true" />
                              <span className="text-ink text-xs">{statusInfo.label}</span>
                            </div>
                            {booking.request_type && (
                              <div className="text-[10px] text-ink-muted italic mt-0.5 max-w-[150px] truncate" title={booking.request_reason}>
                                Motif : {booking.request_reason || 'Non précisé'}
                              </div>
                            )}
                          </>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 pr-6 align-top">
                        <div className="flex flex-row flex-wrap items-center justify-end gap-2.5">
                          {isBlock && (
                            booking.status === 'validated' ? (
                              <button 
                                type="button" 
                                disabled={actionLoadingId === booking.id}
                                onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 text-xs font-medium rounded-sm transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                                title="Déverrouiller ces dates et les libérer immédiatement pour les visiteurs du site"
                              >
                                {actionLoadingId === booking.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Unlock className="h-3 w-3" />}
                                <span>Déverrouiller</span>
                              </button>
                            ) : (
                              <span className="text-xs text-ink-muted font-mono italic">
                                Période libérée
                              </span>
                            )
                          )}

                          {booking.status === 'pending' && (
                            <>
                              <button 
                                type="button" 
                                disabled={actionLoadingId === booking.id}
                                onClick={() => handleStatusUpdate(booking.id, 'validated')}
                                className="inline-flex items-center gap-1 text-xs text-royal font-medium hover:text-royal-dark transition-colors disabled:opacity-50 cursor-pointer"
                              >
                                {actionLoadingId === booking.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Valider'} <ArrowRight className="h-3 w-3" />
                              </button>
                              <button 
                                type="button" 
                                disabled={actionLoadingId === booking.id}
                                onClick={() => handleStatusUpdate(booking.id, 'rejected')}
                                className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-red-500 transition-colors disabled:opacity-50 cursor-pointer"
                              >
                                {actionLoadingId === booking.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Décliner'} <ArrowDown className="h-3 w-3" />
                              </button>
                            </>
                          )}

                          {booking.status === 'cancellation_requested' && (
                            <>
                              <button 
                                type="button" 
                                disabled={actionLoadingId === booking.id}
                                onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                                className="inline-flex items-center gap-1 text-xs text-red-600 font-medium hover:text-red-700 transition-colors disabled:opacity-50 cursor-pointer"
                              >
                                {actionLoadingId === booking.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Confirmer l'annulation"} <ArrowRight className="h-3 w-3" />
                              </button>
                              <button 
                                type="button" 
                                disabled={actionLoadingId === booking.id}
                                onClick={() => handleStatusUpdate(booking.id, 'validated')}
                                className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink transition-colors disabled:opacity-50 cursor-pointer"
                              >
                                {actionLoadingId === booking.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Rejeter'}
                              </button>
                            </>
                          )}

                          {booking.status === 'modification_requested' && (
                            <button 
                              type="button" 
                              disabled={actionLoadingId === booking.id}
                              onClick={() => handleStatusUpdate(booking.id, 'validated')}
                              className="inline-flex items-center gap-1 text-xs text-royal font-medium hover:text-royal-dark transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              {actionLoadingId === booking.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Marquer traité'} <Check className="h-3 w-3" />
                            </button>
                          )}

                          {booking.status === 'validated' && !isBlock && (() => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const checkOut = new Date(booking.check_out_date);
                            checkOut.setHours(0, 0, 0, 0);
                            const canComplete = checkOut <= today;
                            
                            return (
                              <>
                                <button 
                                  type="button" 
                                  disabled={isDownloading === booking.id}
                                  onClick={() => handleDownload(booking.id, booking.reference, 'validated')}
                                  className="inline-flex items-center gap-1 text-xs text-royal hover:text-royal-dark transition-colors disabled:opacity-50 cursor-pointer"
                                >
                                  {isDownloading === booking.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Confirmation PDF'} <ArrowDown className="h-3 w-3" />
                                </button>
                                <button 
                                  type="button" 
                                  disabled={!canComplete || actionLoadingId === booking.id}
                                  onClick={() => handleStatusUpdate(booking.id, 'completed')}
                                  title={!canComplete ? "Disponible à partir de la date de départ" : ""}
                                  className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                >
                                  {actionLoadingId === booking.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Clôturer'} <Check className="h-3 w-3" />
                                </button>
                              </>
                            );
                          })()}

                          {booking.status === 'completed' && (
                            <button 
                              type="button" 
                              disabled={isDownloading === booking.id}
                              onClick={() => handleDownload(booking.id, booking.reference, 'completed')}
                              className="inline-flex items-center gap-1 text-xs text-royal hover:text-royal-dark transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              {isDownloading === booking.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Facture PDF'} <ArrowDown className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 6. PAGINATION HAUTE PRÉCISION (TOUJOURS VISIBLE) */}
        {filteredBookings.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-ink/10 px-6 py-4 bg-gray-50/60 gap-4">
            
            {/* Compteur d'affichage */}
            <div className="text-xs text-ink-muted font-mono">
              Affichage de <strong className="text-ink">{startIndex + 1}</strong> à <strong className="text-ink">{endIndex}</strong> sur <strong className="text-ink">{filteredBookings.length}</strong> dossier{filteredBookings.length > 1 ? 's' : ''}
              {filteredBookings.length !== bookings.length && (
                <span className="text-[11px] text-gold ml-1">
                  (filtré sur {bookings.length} au total)
                </span>
              )}
            </div>

            {/* Boutons et numérotation de pages */}
            <div className="flex items-center gap-2">
              {/* Bouton Précédent */}
              <button 
                type="button"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-sm border border-ink/10 bg-white text-xs font-medium text-ink hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-colors cursor-pointer"
                aria-label="Page précédente"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Précédent</span>
              </button>

              {/* Numéros de page */}
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

              {/* Bouton Suivant */}
              <button 
                type="button"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-sm border border-ink/10 bg-white text-xs font-medium text-ink hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-colors cursor-pointer"
                aria-label="Page suivante"
              >
                <span>Suivant</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODALE DE VERROUILLAGE */}
      <BlockDatesModal 
        isOpen={isBlockModalOpen}
        onClose={() => setIsBlockModalOpen(false)}
        onSuccess={() => setRetryCount(prev => prev + 1)}
      />
    </div>
  );
}
