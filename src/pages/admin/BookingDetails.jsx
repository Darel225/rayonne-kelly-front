import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Loader2, AlertCircle, ArrowRight, ArrowDown, Check } from 'lucide-react';
import api from '../../services/api';
import { getImageUrl } from '../../utils/getImageUrl';
import { toast } from 'sonner';
import { downloadBookingDocument } from '../../utils/downloadBookingDocument';

export default function BookingDetails() {
  const { id } = useParams();
  
  const [booking, setBooking] = useState(null);
  const [residence, setResidence] = useState(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const bookingRes = await api.get(`/bookings/${id}`, { signal: controller.signal });
        const bookingData = bookingRes?.data || bookingRes;

        if (!isMounted) return;

        setBooking(bookingData);

        if (bookingData.residence_slug) {
          try {
            const residenceRes = await api.get(`/residences/${bookingData.residence_slug}`, { signal: controller.signal });
            if (isMounted) {
              setResidence(residenceRes?.data || residenceRes);
            }
          } catch (rErr) {
            console.warn("Impossible de charger les détails de la résidence:", rErr);
            // On continue, la vue de la réservation fonctionnera de façon dégradée (robustesse)
          }
        }
      } catch (err) {
        if (!isMounted) return;
        if (err.name === 'CanceledError') return;
        console.error(err);
        if (err.response?.status === 404) {
          setError('not_found');
        } else {
          setError("Impossible de charger les détails du dossier.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [id, retryCount]);

  const handleStatusUpdate = async (newStatus) => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      await api.put(`/bookings/${id}/status`, { status: newStatus });
      setBooking(prev => ({ ...prev, status: newStatus }));
      toast.success("Statut de la réservation mis à jour avec succès.");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Erreur lors de la mise à jour du statut.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownload = async (bookingId, reference, type) => {
    setIsDownloading(true);
    const result = await downloadBookingDocument(bookingId, reference, type);
    if (!result.success) {
      toast.error(result.message);
      if ([403, 404, 409].includes(result.status)) {
        setRetryCount(prev => prev + 1);
      }
    } else {
      toast.success(type === 'completed' ? "Facture téléchargée." : "Confirmation téléchargée.");
    }
    setIsDownloading(false);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 text-royal animate-spin mb-4" />
        <p className="text-ink-muted text-sm uppercase tracking-widest font-mono">Chargement du dossier...</p>
      </div>
    );
  }

  if (error === 'not_found') {
    return (
      <div className="max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[50vh] text-center">
        <h1 className="font-serif text-3xl text-ink mb-4">Réservation introuvable.</h1>
        <Link to="/admin/bookings" className="text-royal hover:underline">Retour à la liste des réservations</Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[50vh] text-center">
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

  if (!booking) return null;

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

  const statusInfo = getStatusDisplay(booking.status);
  
  const formatName = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };
  
  const clientFullName = `${formatName(booking.user_first_name)} ${formatName(booking.user_last_name)}`;
  
  // Group amenities by category
  const amenitiesByCategory = {};
  if (residence?.amenities) {
    residence.amenities.forEach(amenity => {
      const cat = amenity.category || 'Autres';
      if (!amenitiesByCategory[cat]) amenitiesByCategory[cat] = [];
      amenitiesByCategory[cat].push(amenity.name);
    });
  }

  return (
    <div className="max-w-7xl mx-auto pb-12">
      {/* Back Link */}
      <Link to="/admin/bookings" className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-ink-muted hover:text-ink mb-8 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Retour aux réservations
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mt-10">
        {/* Left Column: Context & Presentation */}
        <div className="lg:col-span-2 space-y-10">

          <div>
            {residence?.images?.[0] ? (
              <img
                src={getImageUrl(residence.images[0].image_url)}
                alt={`Photo de la résidence ${residence.name}`}
                onError={(e) => { e.target.onerror = null; e.target.src = getImageUrl(null); }}
                className="h-80 w-full object-cover rounded-lg"
              />
            ) : (
              <div className="h-80 w-full bg-gray-200 rounded-lg flex items-center justify-center text-ink-muted">
                Aucune image
              </div>
            )}
            
            <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="font-serif text-4xl text-ink">{residence?.name || booking.residence_name}</h1>
                <div className="italic text-ink-muted text-sm mt-1">{residence?.district || booking.residence_location}</div>
                <div className="text-sm font-medium text-ink/70 mt-3 flex items-center gap-2">
                  Capacité de base : {residence?.max_guests || '-'} voyageurs • {residence?.rooms_count || '-'} Pièces
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 border border-ink/10 rounded-full shrink-0 shadow-sm">
                <span className={`w-2 h-2 rounded-full ${statusInfo.color}`} aria-hidden="true"></span>
                <span className="text-xs uppercase tracking-widest text-ink font-medium">Dossier {booking.reference} — {statusInfo.label}</span>
              </div>
            </div>
          </div>

          {(booking.status === 'cancellation_requested' || booking.status === 'modification_requested') && (
            <section className="bg-red-50/50 p-6 rounded-lg border border-red-100">
              <div className="font-mono text-[10px] uppercase tracking-widest text-red-600 mb-2">
                Motif de la demande
              </div>
              <p className="text-ink-muted leading-relaxed text-sm">
                {booking.request_reason || "Aucun motif renseigné."}
              </p>
            </section>
          )}

          <section>
            <div className="font-mono text-[10px] uppercase tracking-widest text-gold mb-6 border-b border-ink/10 pb-2">
              01 / PRÉSENTATION
            </div>
            <p className="text-ink-muted leading-relaxed">
              {residence?.description || "Description non disponible."}
            </p>
          </section>

          <section>
            <div className="font-mono text-[10px] uppercase tracking-widest text-gold mb-6 border-b border-ink/10 pb-2">
              02 / ÉQUIPEMENTS
            </div>
            {Object.keys(amenitiesByCategory).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {Object.entries(amenitiesByCategory).map(([category, items], idx) => (
                  <div key={idx}>
                    <h3 className="font-serif text-lg text-ink mb-4">{category}</h3>
                    <ul className="space-y-3">
                      {items.map((item, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="text-ink-muted mt-1.5">—</span>
                          <span className="text-sm text-ink-muted leading-snug">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-ink-muted text-sm italic">Aucun équipement renseigné.</p>
            )}
          </section>

        </div>

        {/* Right Column: Admin Action Panel (Sticky) */}
        <aside className="lg:col-span-1 lg:sticky lg:top-32 h-fit">
          <div className="bg-white border border-ink/10 rounded-sm p-8 space-y-8 shadow-sm">

            {/* Profil Client */}
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink-muted mb-4">Profil Client</div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-serif text-xl text-ink">{clientFullName}</h2>
                <span className="text-[10px] uppercase tracking-widest font-bold text-ink-muted bg-ink/5 border border-ink/10 px-1.5 py-0.5 rounded-sm">
                  Client #{booking.user_id}
                </span>
              </div>
              <div className="space-y-2">
                <a href={`mailto:${booking.user_email}`} className="flex items-center gap-3 text-xs text-ink-muted hover:text-royal transition-colors">
                  <Mail className="h-3 w-3 shrink-0" />
                  {booking.user_email}
                </a>
                <a href={`tel:${booking.user_phone?.replace(/\s+/g, '')}`} className="flex items-center gap-3 text-xs text-ink-muted hover:text-royal transition-colors">
                  <Phone className="h-3 w-3 shrink-0" />
                  {booking.user_phone}
                </a>
              </div>
            </div>

            <hr className="border-ink/10" />

            {/* Détails du Séjour */}
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink-muted mb-4">Détails du Séjour</div>
              <div className="space-y-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-ink-muted">Période</span>
                  <span className="text-sm font-medium text-ink text-right">
                    Du {new Date(booking.check_in_date).toLocaleDateString('fr-FR')} <br/>
                    Au {new Date(booking.check_out_date).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-ink-muted">Hôtes</span>
                  <span className="text-sm font-medium text-ink">{booking.guests_count} Voyageur(s)</span>
                </div>
                <div>
                  <span className="text-sm text-ink-muted block mb-2">Demandes particulières :</span>
                  <div className="text-sm font-medium text-ink italic p-3 bg-gray-50/50 rounded-sm">
                    {booking.special_requests || "Aucune demande particulière."}
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-ink/10" />

            {/* Total */}
            <div>
              <div className="flex justify-between items-end mb-6">
                <span className="text-sm text-ink">Total du séjour</span>
                <span className="font-serif text-2xl text-ink">
                  {parseFloat(booking.total_price).toLocaleString('fr-FR')} FCFA
                </span>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                {booking.status === 'pending' && (
                  <>
                    <button 
                      onClick={() => handleStatusUpdate('validated')}
                      disabled={actionLoading}
                      className="w-full bg-royal text-white py-3 text-xs uppercase tracking-widest font-mono hover:bg-royal-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Valider la réservation"}
                    </button>
                    <button 
                      onClick={() => handleStatusUpdate('rejected')}
                      disabled={actionLoading}
                      className="w-full border border-red-200 text-red-600 bg-red-50/30 py-3 text-xs uppercase tracking-widest font-mono hover:bg-red-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Décliner"}
                    </button>
                  </>
                )}

                {booking.status === 'cancellation_requested' && (
                  <>
                    <button 
                      onClick={() => handleStatusUpdate('cancelled')}
                      disabled={actionLoading}
                      className="w-full bg-red-600 text-white py-3 text-xs uppercase tracking-widest font-mono hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmer l'annulation"}
                    </button>
                    <button 
                      onClick={() => handleStatusUpdate('validated')}
                      disabled={actionLoading}
                      className="w-full border border-ink/20 text-ink py-3 text-xs uppercase tracking-widest font-mono hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Rejeter la demande"}
                    </button>
                  </>
                )}

                {booking.status === 'modification_requested' && (
                  <button 
                    onClick={() => handleStatusUpdate('validated')}
                    disabled={actionLoading}
                    className="w-full bg-royal text-white py-3 text-xs uppercase tracking-widest font-mono hover:bg-royal-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Marquer comme traité"} <Check className="h-4 w-4" />
                  </button>
                )}

                {['validated', 'rejected', 'completed', 'cancelled'].includes(booking.status) && (
                  <div className="w-full text-center py-3 text-xs uppercase tracking-widest font-mono text-ink-muted bg-gray-50/50">
                    Dossier {getStatusDisplay(booking.status).label}
                  </div>
                )}
                
                {booking.status === 'validated' && (() => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const checkOut = new Date(booking.check_out_date);
                  checkOut.setHours(0, 0, 0, 0);
                  const canComplete = checkOut <= today;
                  
                  return (
                    <div className="flex flex-col gap-3 mt-2">
                      <button 
                        type="button" 
                        disabled={isDownloading}
                        onClick={() => handleDownload(booking.id, booking.reference, 'validated')}
                        className="w-full border border-royal text-royal py-3 text-xs uppercase tracking-widest font-mono hover:bg-royal hover:text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Télécharger la confirmation'}
                      </button>
                      <button 
                        type="button" 
                        disabled={!canComplete || actionLoading}
                        onClick={() => handleStatusUpdate('completed')}
                        title={!canComplete ? "Disponible à partir de la date de départ" : ""}
                        className="w-full bg-emerald-600 text-white py-3 text-xs uppercase tracking-widest font-mono hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Clôturer le séjour'}
                      </button>
                    </div>
                  );
                })()}

                {booking.status === 'completed' && (
                  <div className="flex flex-col gap-3 mt-2">
                    <button 
                      type="button" 
                      disabled={isDownloading}
                      onClick={() => handleDownload(booking.id, booking.reference, 'completed')}
                      className="w-full border border-royal text-royal py-3 text-xs uppercase tracking-widest font-mono hover:bg-royal hover:text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Télécharger la facture'}
                    </button>
                  </div>
                )}
              </div>
            </div>
            
          </div>
        </aside>
      </div>
    </div>
  );
}
