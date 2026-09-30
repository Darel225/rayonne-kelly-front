import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronRight, Pencil, Loader2, AlertCircle } from 'lucide-react';
import Button from '../../components/common/Button';
import api from '../../services/api';
import { getImageUrl } from '../../utils/getImageUrl';

export default function Dashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [residences, setResidences] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [totalResidences, setTotalResidences] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const [statsRes, residencesRes, bookingsRes] = await Promise.all([
          api.get('/admin/stats', { signal: controller.signal }),
          api.get('/residences', { signal: controller.signal }),
          api.get('/bookings', { signal: controller.signal })
        ]);
        
        if (!isMounted) return;
        
        const sData = statsRes?.data || statsRes;
        const rData = Array.isArray(residencesRes) ? residencesRes : (residencesRes?.data || []);
        const bData = Array.isArray(bookingsRes) ? bookingsRes : (bookingsRes?.data || []);
        
        setStats(sData);
        setResidences(rData.slice(0, 3));
        setTotalResidences(rData.length);
        
        bData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setRecentBookings(bData.slice(0, 3));
        
      } catch (err) {
        if (!isMounted) return;
        if (err.name === 'CanceledError') return;
        console.error(err);
        setError("Impossible de charger les données du tableau de bord.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  const pendingTotal = stats ? (stats.pending_count + stats.cancellation_requested_count + stats.modification_requested_count) : 0;
  
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('fr-FR').format(val || 0);
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

  const formatName = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  return (
    <div className="max-w-[1400px] mx-auto">
      
      {/* Section 1 — Supervision (KPIs) */}
      <section className="mb-16">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-royal">
          <span className="w-1.5 h-1.5 bg-royal rounded-full" aria-hidden="true"></span>
          Direction Générale & Asset Management
        </div>
        
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mt-2">
          <div>
            <h1 className="font-serif text-4xl text-ink">Supervision & Portefeuille Privé</h1>
            <p className="text-sm text-ink-muted mt-2 max-w-xl leading-relaxed">
              Console de gestion exécutive des domaines Rayonne Kelly. Flux d'acquisitions, arbitrage des réservations VIP et administration du parc d'exception.
            </p>
          </div>
          <Button variant="royal" onClick={() => navigate('/admin/residences/create')} className="uppercase tracking-widest text-xs whitespace-nowrap">
            + Ajouter une résidence
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-10 pb-10 border-b border-ink/10">
          
          {/* Card 1: Demandes en attente */}
          <div className={`${!isLoading && !error ? 'cursor-pointer hover:bg-gray-50/50 transition-colors p-2 -m-2 rounded-sm' : ''}`} onClick={() => !isLoading && !error && navigate('/admin/bookings')}>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">
                DEMANDES EN ATTENTE
              </span>
              {!isLoading && !error && pendingTotal > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium text-amber-600 bg-amber-50">
                  Priorité Haute
                </span>
              )}
            </div>
            <div className="font-serif text-4xl text-ink">
              {isLoading ? <div className="h-10 w-20 bg-gray-200 animate-pulse rounded"></div> : error ? '—' : (pendingTotal < 10 ? `0${pendingTotal}` : pendingTotal)}
            </div>
            {!isLoading && !error && (
              <div className="text-xs text-ink-muted mt-2">
                {pendingTotal} requête(s) à traiter
              </div>
            )}
          </div>

          {/* Card 2: Réservations confirmées */}
          <div className={`${!isLoading && !error ? 'cursor-pointer hover:bg-gray-50/50 transition-colors p-2 -m-2 rounded-sm' : ''}`} onClick={() => !isLoading && !error && navigate('/admin/bookings')}>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">
                RÉSERVATIONS CONFIRMÉES
              </span>
            </div>
            <div className="font-serif text-4xl text-ink">
              {isLoading ? <div className="h-10 w-20 bg-gray-200 animate-pulse rounded"></div> : error ? '—' : (stats?.confirmed_count < 10 ? `0${stats?.confirmed_count}` : stats?.confirmed_count)}
            </div>
            {!isLoading && !error && (
              <div className="text-xs text-ink-muted mt-2">
                séjours validés
              </div>
            )}
          </div>

          {/* Card 3: Volume d'affaires */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">
                VOLUME D'AFFAIRES BRUT
              </span>
            </div>
            <div className="font-serif text-4xl text-ink">
              {isLoading ? <div className="h-10 w-32 bg-gray-200 animate-pulse rounded"></div> : error ? '—' : formatCurrency(stats?.total_revenue)}
              {!isLoading && !error && <span className="text-sm ml-1.5">FCFA</span>}
            </div>
          </div>

          {/* Card 4: Résidences actives */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">
                RÉSIDENCES ACTIVES
              </span>
            </div>
            <div className="font-serif text-4xl text-ink">
              {isLoading ? <div className="h-10 w-20 bg-gray-200 animate-pulse rounded"></div> : error ? '—' : (stats?.active_residences_count < 10 ? `0${stats?.active_residences_count}` : stats?.active_residences_count)}
            </div>
            {!isLoading && !error && (
              <div className="text-xs text-ink-muted mt-2">
                domaines publiés
              </div>
            )}
          </div>

        </div>

        {error && (
          <div className="mt-4 flex items-center gap-3 text-sm text-red-600 bg-red-50 p-4 rounded-sm">
            <AlertCircle className="h-4 w-4" />
            {error}
            <button onClick={() => window.location.reload()} className="underline font-medium hover:text-red-800">
              Réessayer
            </button>
          </div>
        )}
      </section>

      {/* Section 2 — Gestion des Réservations */}
      <section className="mb-16">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-gold">Traitement des Séjours</div>
            <h2 className="font-serif text-3xl text-ink mt-1">Dernières Réservations</h2>
          </div>
        </div>

        <div className="bg-white rounded-sm border border-ink/10 overflow-hidden mb-6">
          {isLoading ? (
            <div className="p-8 space-y-4">
              <div className="h-12 bg-gray-100 animate-pulse rounded"></div>
              <div className="h-12 bg-gray-100 animate-pulse rounded"></div>
              <div className="h-12 bg-gray-100 animate-pulse rounded"></div>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-ink-muted text-sm">
              Impossible de charger les réservations.
            </div>
          ) : recentBookings.length === 0 ? (
            <div className="p-8 text-center text-ink-muted text-sm">
              Aucune réservation récente.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-sm">
                <caption className="sr-only">Dernières réservations</caption>
                <thead>
                  <tr className="border-b border-ink/10 bg-gray-50/50">
                    <th scope="col" className="py-4 pl-6 pr-4 font-mono text-[10px] uppercase font-normal text-ink-muted">Réf & Date</th>
                    <th scope="col" className="py-4 pr-4 font-mono text-[10px] uppercase font-normal text-ink-muted">Client</th>
                    <th scope="col" className="py-4 pr-4 font-mono text-[10px] uppercase font-normal text-ink-muted">Résidence</th>
                    <th scope="col" className="py-4 pr-6 font-mono text-[10px] uppercase font-normal text-ink-muted">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/10">
                  {recentBookings.map((booking) => {
                    const statusInfo = getStatusDisplay(booking.status);
                    return (
                      <tr key={booking.id} className="hover:bg-gray-50/30 transition-colors">
                        <td className="py-4 pl-6 pr-4 align-top">
                          <Link to={`/admin/bookings/${booking.id}`} className="text-royal font-medium hover:underline block">
                            {booking.reference}
                          </Link>
                          <div className="text-xs text-ink-muted mt-1">{new Date(booking.created_at).toLocaleDateString('fr-FR')}</div>
                        </td>
                        <td className="py-4 pr-4 align-top">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-amber-50 text-amber-800 text-xs font-medium flex items-center justify-center shrink-0">
                              {(booking.user_first_name?.[0] || '').toUpperCase()}{(booking.user_last_name?.[0] || '').toUpperCase()}
                            </div>
                            <span className="text-ink font-medium">
                              {formatName(booking.user_first_name)} {formatName(booking.user_last_name)}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 pr-4 align-top">
                          <div className="text-ink font-medium">{booking.residence_name}</div>
                          <div className="text-xs text-ink-muted mt-1">{booking.residence_location}</div>
                        </td>
                        <td className="py-4 pr-6 align-top">
                          <div className="flex items-center gap-2 whitespace-nowrap pt-1">
                            <span className={`w-2 h-2 rounded-full ${statusInfo.color}`} aria-hidden="true"></span>
                            <span className="text-ink text-sm">{statusInfo.label}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="text-center">
          <Link 
            to="/admin/bookings" 
            className="inline-flex items-center justify-center bg-royal text-white px-8 py-3 text-xs tracking-[0.2em] font-mono uppercase hover:bg-royal-dark transition-colors rounded-sm"
          >
            Voir toutes les réservations →
          </Link>
        </div>
      </section>

      {/* Section 3 — Portfolio des Domaines */}
      <section>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-gold">Collection Prestige</div>
            <h2 className="font-serif text-3xl text-ink mt-1">Portfolio des Résidences</h2>
          </div>
          {!isLoading && !error && (
            <Link to="/admin/residences" className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-royal hover:text-royal-dark transition-colors pb-1">
              Explorer l'intégralité du catalogue ({totalResidences})
              <ChevronRight className="h-3 w-3" />
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/3] bg-gray-200 rounded-sm mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))
          ) : error ? null : (
            residences.map((residence) => (
              <div key={residence.id} className="group cursor-pointer" onClick={() => navigate(`/admin/residences/${residence.id}/edit`)}>
                <div className="relative aspect-[4/3] overflow-hidden rounded-sm mb-5">
                  <img
                    src={residence.cover_image_url ? getImageUrl(residence.cover_image_url) : ''}
                    alt={residence.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlNWU3ZWIiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBpbmRpc3BvbmlibGU8L3RleHQ+PC9zdmc+';
                    }}
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 text-[10px] uppercase font-mono tracking-widest text-ink rounded-sm">
                    {formatCurrency(residence.price_per_night)} / nuit
                  </div>
                </div>
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-gold mb-2 truncate">
                    {residence.district || 'Non spécifié'} • {residence.max_guests} HÔTES
                  </div>
                  <h3 className="font-serif text-xl text-ink group-hover:text-royal transition-colors mb-2">
                    {residence.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                    <Pencil className="h-3 w-3" /> Éditer la fiche
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
      
    </div>
  );
}
