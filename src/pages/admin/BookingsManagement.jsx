import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight, ArrowDown, Loader2, AlertCircle, Check } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'sonner';
import { downloadBookingDocument } from '../../utils/downloadBookingDocument';

const bookingTabs = [
  { id: 'all', label: 'Toutes' },
  { id: 'pending', label: 'En attente' },
  { id: 'requests', label: 'Demandes en cours' },
  { id: 'validated', label: 'Validées' },
  { id: 'rejected', label: 'Rejetées' },
  { id: 'completed', label: 'Terminées' },
  { id: 'cancelled', label: 'Annulées' },
];

export default function BookingsManagement() {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [isDownloading, setIsDownloading] = useState(null);

  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  
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

  const filteredBookings = useMemo(() => {
    if (filterStatus === 'all') return bookings;
    if (filterStatus === 'requests') {
      return bookings.filter(b => ['cancellation_requested', 'modification_requested'].includes(b.status));
    }
    return bookings.filter(b => b.status === filterStatus);
  }, [bookings, filterStatus]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus]);

  const paginatedBookings = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredBookings.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredBookings, currentPage]);

  const handleStatusUpdate = async (id, newStatus) => {
    if (actionLoadingId) return;
    setActionLoadingId(id);
    try {
      await api.put(`/bookings/${id}/status`, { status: newStatus });
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
      toast.success("Statut de la réservation mis à jour avec succès.");
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
      case 'cancelled': return { color: 'bg-gray-500', label: 'Annulée' };
      case 'cancellation_requested': return { color: 'bg-violet-500', label: 'Annulation demandée' };
      case 'modification_requested': return { color: 'bg-blue-500', label: 'Modification demandée' };
      default: return { color: 'bg-gray-500', label: status };
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-[1400px] mx-auto py-12 flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 text-royal animate-spin mb-4" />
        <p className="text-ink-muted text-sm uppercase tracking-widest font-mono">Chargement des dossiers...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-[1400px] mx-auto py-12 flex flex-col items-center justify-center min-h-[50vh] text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="font-serif text-2xl text-ink mb-2">Erreur de chargement</h2>
        <p className="text-sm text-ink-muted max-w-md">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-6 px-4 py-2 bg-royal text-white text-xs uppercase tracking-widest rounded-sm hover:bg-royal-dark transition-colors"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-gold">Traitement des Séjours</div>
          <h1 className="font-serif text-3xl text-ink mt-1">Gestion des Réservations</h1>
        </div>
        <div className="flex flex-wrap gap-4 text-xs font-medium border-b border-ink/10 w-full md:w-auto md:border-b-0 pb-2 md:pb-0 overflow-x-auto">
          {bookingTabs.map((tab) => {
            const count = tab.id === 'all' 
              ? bookings.length 
              : (tab.id === 'requests' 
                  ? bookings.filter(b => ['cancellation_requested', 'modification_requested'].includes(b.status)).length
                  : bookings.filter(b => b.status === tab.id).length);
            
            return (
              <button 
                key={tab.id}
                type="button"
                onClick={() => setFilterStatus(tab.id)}
                aria-pressed={filterStatus === tab.id}
                className={`whitespace-nowrap ${filterStatus === tab.id ? 'text-ink font-semibold' : 'text-ink-muted hover:text-ink transition-colors'}`}
              >
                {tab.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-sm border border-ink/10 overflow-hidden">
        {filteredBookings.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <p className="text-ink-muted text-sm mb-4">Aucun dossier correspondant à ce filtre.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <caption className="sr-only">Suivi des réservations</caption>
              <thead>
                <tr className="border-b border-ink/10 bg-gray-50/50">
                  <th scope="col" className="py-4 pl-6 pr-4 font-mono text-[10px] uppercase font-normal text-ink-muted">Réf & Date</th>
                  <th scope="col" className="py-4 pr-4 font-mono text-[10px] uppercase font-normal text-ink-muted">Client</th>
                  <th scope="col" className="py-4 pr-4 font-mono text-[10px] uppercase font-normal text-ink-muted">Résidence</th>
                  <th scope="col" className="py-4 pr-4 font-mono text-[10px] uppercase font-normal text-ink-muted">Période & Hôtes</th>
                  <th scope="col" className="py-4 pr-4 font-mono text-[10px] uppercase font-normal text-ink-muted">Montant</th>
                  <th scope="col" className="py-4 pr-4 font-mono text-[10px] uppercase font-normal text-ink-muted">Statut</th>
                  <th scope="col" className="py-4 pr-6 font-mono text-[10px] uppercase font-normal text-ink-muted text-right">Actions Opérationnelles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {paginatedBookings.map((booking) => {
                  const statusInfo = getStatusDisplay(booking.status);
                  
                  const formatName = (str) => {
                    if (!str) return '';
                    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
                  };
                  
                  return (
                    <tr key={booking.id} className="hover:bg-gray-50/30 transition-colors">
                      <td className="py-5 pl-6 pr-4 align-top">
                        <Link to={`/admin/bookings/${booking.id}`} className="text-royal font-medium hover:underline block">
                          {booking.reference}
                        </Link>
                        <div className="text-xs text-ink-muted mt-1">{new Date(booking.created_at).toLocaleDateString('fr-FR')}</div>
                      </td>
                      <td className="py-5 pr-4 align-top">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-amber-50 text-amber-800 text-xs font-medium flex items-center justify-center shrink-0">
                            {(booking.user_first_name?.[0] || '').toUpperCase()}{(booking.user_last_name?.[0] || '').toUpperCase()}
                          </div>
                          <span className="text-ink font-medium">
                            {formatName(booking.user_first_name)} {formatName(booking.user_last_name)}
                          </span>
                        </div>
                      </td>
                      <td className="py-5 pr-4 align-top">
                        <div className="text-ink font-medium">{booking.residence_name}</div>
                        <div className="text-xs text-ink-muted mt-1">{booking.residence_location}</div>
                      </td>
                      <td className="py-5 pr-4 align-top">
                        <div className="text-ink whitespace-nowrap">
                          {new Date(booking.check_in_date).toLocaleDateString('fr-FR')} — {new Date(booking.check_out_date).toLocaleDateString('fr-FR')}
                        </div>
                        <div className="text-xs text-ink-muted mt-1">{booking.guests_count} hôte(s)</div>
                      </td>
                      <td className="py-5 pr-4 align-top">
                        <div className="font-serif font-medium text-ink whitespace-nowrap">
                          {parseFloat(booking.total_price).toLocaleString('fr-FR')} FCFA
                        </div>
                      </td>
                      <td className="py-5 pr-4 align-top">
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <span className={`w-2 h-2 rounded-full ${statusInfo.color}`} aria-hidden="true"></span>
                          <span className="text-ink text-sm">{statusInfo.label}</span>
                        </div>
                        {booking.request_type && (
                          <div className="text-[10px] text-ink-muted italic mt-1 max-w-[150px] truncate" title={booking.request_reason}>
                            Motif : {booking.request_reason || 'Non précisé'}
                          </div>
                        )}
                      </td>
                      <td className="py-5 pr-6 align-top">
                        <div className="flex flex-row flex-wrap items-center justify-end gap-3">
                          {booking.status === 'pending' && (
                            <>
                              <button 
                                type="button" 
                                disabled={actionLoadingId === booking.id}
                                onClick={() => handleStatusUpdate(booking.id, 'validated')}
                                className="inline-flex items-center gap-1 text-sm text-royal font-medium hover:text-royal-dark transition-colors disabled:opacity-50"
                              >
                                {actionLoadingId === booking.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Valider'} <ArrowRight className="h-3 w-3" />
                              </button>
                              <button 
                                type="button" 
                                disabled={actionLoadingId === booking.id}
                                onClick={() => handleStatusUpdate(booking.id, 'rejected')}
                                className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-red-500 transition-colors disabled:opacity-50"
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
                                className="inline-flex items-center gap-1 text-sm text-red-600 font-medium hover:text-red-700 transition-colors disabled:opacity-50"
                              >
                                {actionLoadingId === booking.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Confirmer l'annulation"} <ArrowRight className="h-3 w-3" />
                              </button>
                              <button 
                                type="button" 
                                disabled={actionLoadingId === booking.id}
                                onClick={() => handleStatusUpdate(booking.id, 'validated')}
                                className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink transition-colors disabled:opacity-50"
                              >
                                {actionLoadingId === booking.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Rejeter la demande'}
                              </button>
                            </>
                          )}

                          {booking.status === 'modification_requested' && (
                            <button 
                              type="button" 
                              disabled={actionLoadingId === booking.id}
                              onClick={() => handleStatusUpdate(booking.id, 'validated')}
                              className="inline-flex items-center gap-1 text-sm text-royal font-medium hover:text-royal-dark transition-colors disabled:opacity-50"
                            >
                              {actionLoadingId === booking.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Marquer comme traité'} <Check className="h-3 w-3" />
                            </button>
                          )}

                          {booking.status === 'validated' && (() => {
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
                                  className="inline-flex items-center gap-1 text-sm text-royal hover:text-royal-dark transition-colors disabled:opacity-50"
                                >
                                  {isDownloading === booking.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Confirmation PDF'} <ArrowDown className="h-3 w-3" />
                                </button>
                                <button 
                                  type="button" 
                                  disabled={!canComplete || actionLoadingId === booking.id}
                                  onClick={() => handleStatusUpdate(booking.id, 'completed')}
                                  title={!canComplete ? "Disponible à partir de la date de départ" : ""}
                                  className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {actionLoadingId === booking.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Clôturer le séjour'} <Check className="h-3 w-3" />
                                </button>
                              </>
                            );
                          })()}

                          {booking.status === 'completed' && (
                            <button 
                              type="button" 
                              disabled={isDownloading === booking.id}
                              onClick={() => handleDownload(booking.id, booking.reference, 'completed')}
                              className="inline-flex items-center gap-1 text-sm text-royal hover:text-royal-dark transition-colors disabled:opacity-50"
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

        {filteredBookings.length > ITEMS_PER_PAGE && (
          <div className="flex items-center justify-between border-t border-ink/10 px-6 py-4 bg-gray-50/50">
            <div className="text-xs text-ink-muted font-mono uppercase tracking-widest">
              Page {currentPage} sur {Math.ceil(filteredBookings.length / ITEMS_PER_PAGE)}
            </div>
            <div className="flex items-center gap-4">
              <button 
                type="button"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 hover:text-ink disabled:opacity-30 transition-colors"
                aria-label="Page précédente"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button 
                type="button"
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredBookings.length / ITEMS_PER_PAGE), p + 1))}
                disabled={currentPage === Math.ceil(filteredBookings.length / ITEMS_PER_PAGE)}
                className="p-1 hover:text-ink disabled:opacity-30 transition-colors"
                aria-label="Page suivante"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
