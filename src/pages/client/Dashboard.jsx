import { useState, useEffect, useMemo } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BadgeCheck, ChevronDown, ChevronLeft, ChevronRight, Check, KeyRound, ShieldCheck, Phone, Mail, ArrowRight, Loader2, AlertCircle, Download, FileText, X } from 'lucide-react';
import Button from '../../components/common/Button';
import useAuthStore from '../../store/authStore';
import { differenceInDays, differenceInHours, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import api from '../../services/api';
import { getImageUrl } from '../../utils/getImageUrl';
import { SLA_HOURS_MAX } from '../../constants/sla';
import { toast } from 'sonner';
import { downloadBookingDocument } from '../../utils/downloadBookingDocument';

const avatarUrl = 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&q=80';

const DEFAULT_CONCIERGE = {
  phone: "+225 07 00 00 01",
  email: "vip@rayonnekelly.ci"
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
};

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  const [conciergeData, setConciergeData] = useState(null);
  const [isLoadingConcierge, setIsLoadingConcierge] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchConcierge = async () => {
      try {
        const response = await api.get('/settings/public');
        if (!cancelled) {
          setConciergeData({
            phone: response.concierge_phone || '',
            email: response.concierge_email || '',
            photo_path: response.concierge_photo_path || null
          });
        }
      } catch (error) {
        // Fallback silently
      } finally {
        if (!cancelled) setIsLoadingConcierge(false);
      }
    };
    fetchConcierge();
    return () => { cancelled = true; };
  }, []);

  const [bookings, setBookings] = useState([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);
  const [bookingsError, setBookingsError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const [filterStatus, setFilterStatus] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const [cancellationModal, setCancellationModal] = useState({
    isOpen: false,
    booking: null,
    type: 'cancellation',
    reason: '',
    isSubmitting: false,
    error: null
  });

  const [isDownloading, setIsDownloading] = useState(null);

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

  const filteredBookings = useMemo(() => {
    if (filterStatus === 'all') return bookings;
    if (filterStatus === 'pending') {
      return bookings.filter(b => ['pending', 'cancellation_requested', 'modification_requested'].includes(b.status));
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

  const getFilterEmptyMessage = () => {
    switch (filterStatus) {
      case 'pending': return "Aucune réservation en attente.";
      case 'validated': return "Aucune réservation validée.";
      case 'completed': return "Aucun séjour terminé.";
      case 'cancelled': return "Aucune réservation annulée.";
      default: return "Votre carnet de séjours est vide.";
    }
  };


  useEffect(() => {
    // Ne se déclenche que lorsque l'authentification est résolue
    if (!user) return;

    const controller = new AbortController();
    let isMounted = true;

    const fetchBookings = async () => {
      setIsLoadingBookings(true);
      setBookingsError(null);

      try {
        const response = await api.get('/bookings/me', { signal: controller.signal });

        if (!isMounted) return;

        let data = Array.isArray(response) ? response : (response || []);
        // Sort by check_in_date descending
        data.sort((a, b) => new Date(b.check_in_date) - new Date(a.check_in_date));
        setBookings(data);
      } catch (err) {
        if (!isMounted) return;
        if (err.name === 'CanceledError') return;
        if (err.response?.status === 401) return;

        console.error(err);
        setBookingsError("Impossible de charger vos réservations.");
      } finally {
        if (isMounted) {
          setIsLoadingBookings(false);
        }
      }
    };

    fetchBookings();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [user, retryCount]);

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || user.firstName || user.prenom || user.name || '');
      setLastName(user.last_name || user.lastName || user.nom || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (isSubmittingProfile) return;

    setIsSubmittingProfile(true);
    try {
      const payload = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim()
      };

      const response = await api.put('/clients/me', payload);
      const updatedUser = response.data?.data || response.data || payload;

      useAuthStore.getState().setUser({ ...user, ...updatedUser });
      toast.success("Profil mis à jour avec succès.");
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.error
        || error.response?.data?.message
        || (error.response ? "Impossible de mettre à jour le profil. Réessayez." : "Connexion impossible au serveur.");
      toast.error(errorMsg);
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  const closePasswordModal = () => {
    if (isSubmittingPassword) return;
    setIsPasswordModalOpen(false);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isPasswordModalOpen) {
        closePasswordModal();
      }
    };
    if (isPasswordModalOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPasswordModalOpen, isSubmittingPassword]);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (isSubmittingPassword) return;

    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error("Veuillez remplir tous les champs.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Les nouveaux mots de passe ne correspondent pas.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Le nouveau mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (newPassword === oldPassword) {
      toast.error("Le nouveau mot de passe doit être différent de l'ancien.");
      return;
    }

    setIsSubmittingPassword(true);
    try {
      await api.put('/clients/password', {
        old_password: oldPassword,
        new_password: newPassword
      });
      toast.success("Mot de passe mis à jour avec succès.");
      closePasswordModal();
    } catch (error) {
      console.error(error);
      const is422 = error.response?.status === 422;
      const errorMsg = error.response?.data?.error
        || error.response?.data?.message
        || (error.response ? "Impossible de mettre à jour le mot de passe. Réessayez." : "Connexion impossible au serveur.");

      toast.error(errorMsg);
      if (is422 && errorMsg.toLowerCase().includes('ancien')) {
        setOldPassword('');
      }
    } finally {
      setIsSubmittingPassword(false);
    }
  };


  const submitCancellationRequest = async () => {
    if (!cancellationModal.booking) return;
    setCancellationModal(prev => ({ ...prev, isSubmitting: true, error: null }));

    try {
      await api.post(`/bookings/${cancellationModal.booking.id}/request-cancellation`, {
        type: cancellationModal.type,
        reason: cancellationModal.reason
      });

      const newStatus = cancellationModal.type === 'cancellation' ? 'cancellation_requested' : 'modification_requested';

      setBookings(prev => prev.map(b =>
        b.id === cancellationModal.booking.id ? { ...b, status: newStatus } : b
      ));

      toast.success("Votre demande a été transmise à notre conciergerie. Réponse sous 24h.");
      setCancellationModal({ isOpen: false, booking: null, type: 'cancellation', reason: '', isSubmitting: false, error: null });
    } catch (err) {
      setCancellationModal(prev => ({
        ...prev,
        isSubmitting: false,
        error: err.response?.data?.message || "Une erreur est survenue lors de l'envoi de votre demande."
      }));
    }
  };

  const stats = useMemo(() => {
    const bks = bookings || [];
    const pendingCount = bks.filter(b => b.status === 'pending').length;
    const validatedCount = bks.filter(b => ['validated', 'completed'].includes(b.status)).length;

    return [
      { value: String(validatedCount).padStart(2, '0'), label: 'SÉJOURS VALIDÉS' },
      { value: String(pendingCount).padStart(2, '0'), label: 'EN ATTENTE', accent: 'gold' },
      { value: 'Actif', label: 'CONCIERGERIE 24/7', live: true },
    ];
  }, [bookings]);

  // Puisque AuthProvider a déjà bloqué le rendu pendant l'initialisation,
  // si user est null ici, c'est que la session est vraiment absente.
  if (!user) {
    return <Navigate to="/connexion" replace />;
  }

  // Déduction intelligente du nom au cas où le backend utilise d'autres clés
  const displayFirstName = user?.first_name || user?.firstName || user?.prenom || user?.name || '';
  const displayLastName = user?.last_name || user?.lastName || user?.nom || '';

  const getStatusDisplay = (status) => {
    switch (status) {
      case 'pending': return { color: 'bg-amber-500', text: 'En attente' };
      case 'cancellation_requested': return { color: 'bg-violet-500', text: 'Annulation en cours' };
      case 'modification_requested': return { color: 'bg-blue-500', text: 'Modification en cours' };
      case 'validated': return { color: 'bg-green-500', text: 'Validée' };
      case 'completed': return { color: 'bg-gray-300', text: 'Terminée' };
      case 'cancelled': return { color: 'bg-red-500', text: 'Annulée' };
      case 'rejected': return { color: 'bg-red-500', text: 'Refusée' };
      default: return { color: 'bg-gray-400', text: status || 'Inconnu' };
    }
  };

  const displayPhone = conciergeData?.phone || DEFAULT_CONCIERGE.phone;
  const displayEmail = conciergeData?.email || DEFAULT_CONCIERGE.email;
  const telLink = `tel:${displayPhone.replace(/[\s.-]/g, '')}`;
  const mailLink = `mailto:${displayEmail}`;

  return (
    <main className="bg-ivory min-h-screen pt-28 pb-24">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-7xl mx-auto px-6 md:px-12">

        {/* TASK 2: Welcome banner */}
        <motion.section variants={itemVariants} className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10 border-b border-ink/10 pb-12">
          <div>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-royal font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-royal" aria-hidden="true"></span>
              Portail Client Sécurisé
            </div>
            <h1 className="font-serif text-3xl md:text-4xl leading-[1.1] text-ink max-w-2xl mt-4">
              Bienvenue dans votre Espace Privé,
              <span className="block italic text-royal mt-1">{displayFirstName} {displayLastName}</span>
            </h1>
            <div className="text-xs text-ink mt-6 flex items-center gap-2">
              Votre Conseiller Dédié : Département Conciergerie Rayonne Kelly
              <BadgeCheck className="h-4 w-4 text-royal" />
            </div>
          </div>

          <div className="flex flex-row items-center gap-8 lg:gap-12">
            {stats.map((stat, i) => (
              <div key={i} className={i !== 0 ? 'border-l border-ink/10 pl-8 relative' : 'relative'}>
                <div className={`font-serif text-4xl ${stat.accent === 'gold' ? 'text-gold' : 'text-ink'}`}>
                  {stat.value}
                  {stat.live && (
                    <span className="absolute top-1 -right-3 w-2 h-2 rounded-full bg-green-500" aria-hidden="true"></span>
                  )}
                </div>
                <div className="font-mono uppercase tracking-widest text-[10px] text-ink-muted mt-2 max-w-[100px] leading-relaxed">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* TASK 3: Bookings table */}
        <motion.section variants={itemVariants} className="mt-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold">Carnet de Séjours</div>
              <h2 className="font-serif text-3xl md:text-4xl text-ink mt-1">Mes Réservations & Demandes</h2>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="flex items-center gap-2 text-xs uppercase tracking-widest text-ink-muted hover:text-ink transition-colors"
              >
                {filterStatus === 'all' ? 'Filtrer les archives' : `Filtre: ${filterStatus}`}
                <ChevronDown className="h-4 w-4" />
              </button>

              {isFilterOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-ink/10 shadow-xl z-10 py-2">
                  <button onClick={() => { setFilterStatus('all'); setIsFilterOpen(false); }} className={`w-full text-left px-4 py-2 text-xs uppercase tracking-widest ${filterStatus === 'all' ? 'text-royal bg-mist' : 'text-ink hover:bg-mist'} transition-colors`}>Toutes</button>
                  <button onClick={() => { setFilterStatus('pending'); setIsFilterOpen(false); }} className={`w-full text-left px-4 py-2 text-xs uppercase tracking-widest ${filterStatus === 'pending' ? 'text-royal bg-mist' : 'text-ink hover:bg-mist'} transition-colors`}>En attente</button>
                  <button onClick={() => { setFilterStatus('validated'); setIsFilterOpen(false); }} className={`w-full text-left px-4 py-2 text-xs uppercase tracking-widest ${filterStatus === 'validated' ? 'text-royal bg-mist' : 'text-ink hover:bg-mist'} transition-colors`}>Validées</button>
                  <button onClick={() => { setFilterStatus('completed'); setIsFilterOpen(false); }} className={`w-full text-left px-4 py-2 text-xs uppercase tracking-widest ${filterStatus === 'completed' ? 'text-royal bg-mist' : 'text-ink hover:bg-mist'} transition-colors`}>Terminées</button>
                  <button onClick={() => { setFilterStatus('cancelled'); setIsFilterOpen(false); }} className={`w-full text-left px-4 py-2 text-xs uppercase tracking-widest ${filterStatus === 'cancelled' ? 'text-royal bg-mist' : 'text-ink hover:bg-mist'} transition-colors`}>Annulées</button>
                </div>
              )}
            </div>
          </div>

          <div className="overflow-x-auto mt-8 border-t border-ink/10">
            {isLoadingBookings ? (
              <div className="py-12 flex flex-col items-center justify-center text-ink-muted">
                <Loader2 className="animate-spin h-8 w-8 mb-4 text-royal" />
                <p>Chargement de vos séjours...</p>
              </div>
            ) : bookingsError ? (
              <div className="py-12 flex flex-col items-center justify-center text-ink-muted">
                <AlertCircle className="h-8 w-8 mb-4 text-red-500" />
                <p className="mb-4">{bookingsError}</p>
                <Button onClick={() => setRetryCount(c => c + 1)} variant="outline" className="text-xs uppercase tracking-widest px-6 py-2">
                  Réessayer
                </Button>
              </div>
            ) : bookings.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-mist flex items-center justify-center mb-6">
                  <KeyRound className="h-6 w-6 text-gold" />
                </div>
                <h3 className="font-serif text-2xl text-ink mb-2">Votre carnet de séjours est vide</h3>
                <p className="text-ink-muted mb-8 max-w-sm">Découvrez nos résidences d'exception et réservez votre prochain séjour privé.</p>
                <Link to="/collection">
                  <Button variant="royal" className="uppercase tracking-widest text-xs px-8 py-3">
                    Découvrir nos résidences
                  </Button>
                </Link>
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-mist flex items-center justify-center mb-6">
                  <AlertCircle className="h-6 w-6 text-ink-muted" />
                </div>
                <h3 className="font-serif text-2xl text-ink mb-2">{getFilterEmptyMessage()}</h3>
                <Button variant="outline" onClick={() => setFilterStatus('all')} className="mt-4 text-xs uppercase tracking-widest px-6 py-2">
                  Voir toutes les réservations
                </Button>
              </div>
            ) : (
              <div>
                <table className="w-full min-w-[900px] text-left">
                  <caption className="sr-only">Historique de vos réservations</caption>
                  <thead>
                    <tr className="border-b border-gray-200/60">
                      <th scope="col" className="font-mono text-[9px] uppercase tracking-[0.25em] text-ink-muted py-6 font-normal">Résidence</th>
                      <th scope="col" className="font-mono text-[9px] uppercase tracking-[0.25em] text-ink-muted py-6 font-normal">Période & Nuits</th>
                      <th scope="col" className="font-mono text-[9px] uppercase tracking-[0.25em] text-ink-muted py-6 font-normal">Hôtes</th>
                      <th scope="col" className="font-mono text-[9px] uppercase tracking-[0.25em] text-ink-muted py-6 font-normal">Montant Total</th>
                      <th scope="col" className="font-mono text-[9px] uppercase tracking-[0.25em] text-ink-muted py-6 font-normal">Statut</th>
                      <th scope="col" className="font-mono text-[9px] uppercase tracking-[0.25em] text-ink-muted py-6 font-normal text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedBookings.map((b) => {
                      const checkIn = new Date(b.check_in_date);
                      const checkOut = new Date(b.check_out_date);
                      const nights = differenceInDays(checkOut, checkIn);
                      const period = `${format(checkIn, 'd MMM', { locale: fr })} — ${format(checkOut, 'd MMM yyyy', { locale: fr })}`;
                      const statusDisplay = getStatusDisplay(b.status);

                      return (
                        <tr key={b.id} className="border-b border-gray-200/60 group hover:bg-neutral-50/50 transition-colors">
                          <td className="py-6 pr-4">
                            <div className="flex items-center gap-4">
                              <img
                                src={getImageUrl(b.residence?.image)}
                                alt={b.residence?.name || 'Aperçu résidence'}
                                onError={(e) => { e.target.onerror = null; e.target.src = getImageUrl(null); }}
                                className="w-16 h-12 rounded-sm object-cover shrink-0"
                              />
                              <div>
                                <div className="font-serif text-base text-ink">{b.residence?.name || 'Résidence inconnue'}</div>
                                <div className="text-sm text-ink-muted">{b.residence?.district || ''}</div>
                                <div className="font-mono text-[10px] uppercase text-ink-muted mt-1">Réf. {b.reference || b.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-6 pr-4">
                            <div className="text-sm text-ink">{period}</div>
                            <div className="text-xs text-ink-muted mt-1">
                              {nights <= 0 ? '—' : `${nights} nuit${nights > 1 ? 's' : ''}`}
                            </div>
                          </td>
                          <td className="py-6 pr-4 text-sm text-ink">
                            {b.guests_count} Voyageur{b.guests_count > 1 ? 's' : ''}
                          </td>
                          <td className="py-6 pr-4">
                            <div className="font-serif text-ink">{Number(b.total_price || b.amount || 0).toLocaleString('fr-FR')} FCFA</div>
                          </td>
                          <td className="py-6 pr-4">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${statusDisplay.color}`} aria-hidden="true"></span>
                                <span className="text-sm text-ink">
                                  {statusDisplay.text}
                                </span>
                              </div>
                              {b.status === 'pending' && (
                                <div className="text-[10px] text-amber-700 mt-1 italic max-w-[200px] leading-tight">
                                  {b.created_at && differenceInHours(new Date(), new Date(b.created_at)) > SLA_HOURS_MAX
                                    ? "Votre demande est toujours en cours de traitement, notre équipe vous contactera très prochainement."
                                    : `Votre demande est en cours de traitement par notre conciergerie. Réponse sous ${SLA_HOURS_MAX}h.`}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-6 text-right">
                            {b.status === 'pending' && (
                              <button
                                type="button"
                                onClick={() => setCancellationModal({ isOpen: true, booking: b, type: 'cancellation', reason: '', isSubmitting: false, error: null })}
                                className="inline-block font-serif italic text-sm text-ink hover:text-royal transition-colors whitespace-nowrap"
                              >
                                Modifier / Annuler
                              </button>
                            )}
                            {(b.status === 'cancellation_requested' || b.status === 'modification_requested') && (
                              <span className="inline-block font-serif italic text-sm text-ink-muted whitespace-nowrap">
                                Demande en cours...
                              </span>
                            )}
                            {b.status === 'validated' && (
                              <button
                                type="button"
                                disabled={isDownloading === b.id}
                                aria-busy={isDownloading === b.id}
                                onClick={() => handleDownload(b.id, b.reference, 'validated')}
                                className="inline-flex items-center gap-1 font-serif italic text-sm text-royal hover:text-royal-dark transition-colors disabled:opacity-50"
                              >
                                {isDownloading === b.id ? (
                                  <>Téléchargement... <Loader2 className="h-3 w-3 animate-spin" /></>
                                ) : (
                                  <>Télécharger la confirmation <Download className="h-3 w-3" /></>
                                )}
                              </button>
                            )}
                            {b.status === 'completed' && (
                              <button
                                type="button"
                                disabled={isDownloading === b.id}
                                aria-busy={isDownloading === b.id}
                                onClick={() => handleDownload(b.id, b.reference, 'completed')}
                                className="inline-flex items-center gap-1 font-serif italic text-sm text-royal hover:text-royal-dark transition-colors disabled:opacity-50"
                              >
                                {isDownloading === b.id ? (
                                  <>Téléchargement... <Loader2 className="h-3 w-3 animate-spin" /></>
                                ) : (
                                  <>Télécharger la facture <FileText className="h-3 w-3" /></>
                                )}
                              </button>
                            )}
                            {b.status === 'cancelled' && (
                              <span className="inline-block font-serif italic text-sm text-ink-muted whitespace-nowrap">
                                Réservation annulée
                              </span>
                            )}
                            {b.status === 'rejected' && (
                              <span className="inline-block font-serif italic text-sm text-ink-muted whitespace-nowrap">
                                Demande non retenue
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {filteredBookings.length > ITEMS_PER_PAGE && (
                  <div className="flex items-center justify-between border-t border-ink/10 pt-6 mt-6">
                    <div className="text-xs text-ink-muted font-mono uppercase tracking-widest">
                      Page {currentPage} sur {Math.ceil(filteredBookings.length / ITEMS_PER_PAGE)}
                    </div>
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="text-xs uppercase tracking-widest text-ink hover:text-royal disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                      >
                        <ChevronLeft className="h-4 w-4" /> Précédent
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredBookings.length / ITEMS_PER_PAGE), p + 1))}
                        disabled={currentPage === Math.ceil(filteredBookings.length / ITEMS_PER_PAGE)}
                        className="text-xs uppercase tracking-widest text-ink hover:text-royal disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                      >
                        Suivant <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.section>

        {/* TASK 4: Two-column lower area */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 mt-24 items-start gap-12 lg:gap-16">

          {/* Left: Profile form */}
          <div className="lg:pr-16 pb-12 lg:pb-0">
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold">Profil Acquéreur</div>
            <h2 className="font-serif text-3xl md:text-4xl text-ink mt-1">Informations Personnelles & Coordonnées</h2>
            <p className="text-sm text-ink-muted mt-2 mb-10">Mettez à jour vos informations de facturation et contacts prioritaires.</p>

            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="block font-mono text-[10px] uppercase tracking-[0.2em] text-ink-muted mb-2">Prénom</label>
                  <input
                    id="firstName"
                    type="text"
                    autoComplete="given-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-white border-0 border-b border-ink/30 px-4 py-3 text-ink focus:outline-none focus:border-royal focus-visible:ring-1 ring-royal/30"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block font-mono text-[10px] uppercase tracking-[0.2em] text-ink-muted mb-2">Nom</label>
                  <input
                    id="lastName"
                    type="text"
                    autoComplete="family-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-white border-0 border-b border-ink/30 px-4 py-3 text-ink focus:outline-none focus:border-royal focus-visible:ring-1 ring-royal/30"
                  />
                </div>
              </div>

              <div className="relative">
                <label htmlFor="email" className="block font-mono text-[10px] uppercase tracking-[0.2em] text-ink-muted mb-2">Email Professionnel & Sécurisé</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  readOnly
                  aria-readonly="true"
                  aria-describedby="email-help"
                  className="w-full bg-gray-50 border-0 border-b border-ink/30 px-4 py-3 text-gray-500 cursor-not-allowed focus:ring-0 focus:outline-none focus:border-ink/30"
                />
                <Check className="absolute right-4 top-9 h-4 w-4 text-green-500" aria-hidden="true" />
                <p id="email-help" className="text-xs text-gray-500 mt-1">L'adresse email ne peut pas être modifiée.</p>
              </div>

              <div>
                <label htmlFor="phone" className="block font-mono text-[10px] uppercase tracking-[0.2em] text-ink-muted mb-2">Ligne Directe / Téléphone</label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  placeholder="Non renseigné"
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white border-0 border-b border-ink/30 px-4 py-3 text-ink font-mono focus:outline-none focus:border-royal focus-visible:ring-1 ring-royal/30"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 mt-10">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmittingProfile}
                  className="uppercase tracking-widest px-8 py-4 text-[10px] lg:text-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmittingProfile ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Enregistrement...</>
                  ) : (
                    "Enregistrer les modifications"
                  )}
                </Button>
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(true)}
                  className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink transition-colors"
                >
                  <KeyRound className="h-4 w-4" />
                  Changer mon mot de passe
                </button>
              </div>
            </form>

            <div className="border-t border-ink/10 mt-12 pt-6 flex items-start gap-3">
              <ShieldCheck className="h-4 w-4 text-ink-muted shrink-0" />
              <p className="text-xs text-ink-muted">Canal chiffré AES-256. Vos coordonnées restent sous la confidentialité du protocole Rayonne Kelly.</p>
            </div>
          </div>

          {/* Right: Concierge panel */}
          <div className="lg:pl-16 lg:border-l border-ink/10 pt-12 lg:pt-0 border-t lg:border-t-0">
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-royal font-bold">Exclusivité Membre</div>
            <h2 className="font-serif text-3xl md:text-4xl text-ink mt-1">Service Conciergerie Rayonne Kelly</h2>
            <p className="text-sm text-ink-muted mt-2 mb-10">Une intendance sur-mesure pour vos transferts, chefs privés et exigences protocolaires.</p>

            <div className="flex items-center gap-4 py-8 border-b border-ink/10">
              <div className="relative">
                <img
                  src={conciergeData?.photo_path ? getImageUrl(conciergeData.photo_path) : avatarUrl}
                  alt="Concierge"
                  className="h-14 w-14 rounded-full object-cover grayscale"
                  onError={(e) => { e.currentTarget.src = avatarUrl; }}
                />
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 ring-2 ring-ivory" aria-hidden="true"></span>
              </div>
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">Votre Concierge Attitré</div>
                <div className="font-serif text-xl text-ink">Département Conciergerie</div>
                <div className="text-sm text-ink-muted">Abidjan</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-ink/10">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 shrink-0 border border-ink/15 rounded-full flex items-center justify-center">
                  <Phone className="h-4 w-4 text-ink" />
                </div>
                <div>
                  <div className="font-mono text-[10px] uppercase text-ink-muted">Hotline 24/7</div>
                  {isLoadingConcierge ? (
                    <div className="h-5 w-32 bg-gray-200 animate-pulse rounded mt-1"></div>
                  ) : (
                    <a href={telLink} className="text-sm text-ink hover:text-royal transition-colors">{displayPhone}</a>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 shrink-0 border border-ink/15 rounded-full flex items-center justify-center">
                  <Mail className="h-4 w-4 text-ink" />
                </div>
                <div>
                  <div className="font-mono text-[10px] uppercase text-ink-muted">Courriel Dédié</div>
                  {isLoadingConcierge ? (
                    <div className="h-5 w-48 bg-gray-200 animate-pulse rounded mt-1"></div>
                  ) : (
                    <a href={mailLink} className="text-sm text-ink hover:text-royal transition-colors">{displayEmail}</a>
                  )}
                </div>
              </div>
            </div>
          </div>

        </motion.div>
      </motion.div>

      {/* Cancellation/Modification Modal */}
      {cancellationModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => !cancellationModal.isSubmitting && setCancellationModal(prev => ({ ...prev, isOpen: false }))}></div>
          <div className="relative bg-white p-8 max-w-md w-full shadow-2xl">
            <button
              onClick={() => setCancellationModal(prev => ({ ...prev, isOpen: false }))}
              disabled={cancellationModal.isSubmitting}
              className="absolute top-4 right-4 text-ink-muted hover:text-ink disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="font-mono text-[10px] uppercase tracking-widest text-gold mb-2">
              Réf. {cancellationModal.booking?.reference}
            </div>
            <h3 className="font-serif text-2xl text-ink mb-6">Gérer votre réservation</h3>

            {cancellationModal.error && (
              <div className="bg-red-50 text-red-600 p-4 text-sm mb-6 border border-red-100 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <p>{cancellationModal.error}</p>
              </div>
            )}

            <div className="space-y-4 mb-8">
              <label className="flex items-center gap-3 p-4 border border-ink/10 hover:bg-mist transition-colors cursor-pointer">
                <input
                  type="radio"
                  name="request_type"
                  value="modification"
                  checked={cancellationModal.type === 'modification'}
                  onChange={() => setCancellationModal(prev => ({ ...prev, type: 'modification' }))}
                  className="text-royal focus:ring-royal"
                />
                <span className="text-sm font-medium text-ink">Demander une modification</span>
              </label>

              <label className="flex items-center gap-3 p-4 border border-ink/10 hover:bg-mist transition-colors cursor-pointer">
                <input
                  type="radio"
                  name="request_type"
                  value="cancellation"
                  checked={cancellationModal.type === 'cancellation'}
                  onChange={() => setCancellationModal(prev => ({ ...prev, type: 'cancellation' }))}
                  className="text-royal focus:ring-royal"
                />
                <span className="text-sm font-medium text-ink">Demander une annulation</span>
              </label>
            </div>

            <div className="mb-8">
              <label htmlFor="reason" className="block text-xs uppercase tracking-widest text-ink-muted font-mono mb-3">
                Pourquoi souhaitez-vous {cancellationModal.type === 'modification' ? 'modifier' : 'annuler'} ? (Optionnel)
              </label>
              <textarea
                id="reason"
                value={cancellationModal.reason}
                onChange={(e) => setCancellationModal(prev => ({ ...prev, reason: e.target.value }))}
                className="w-full h-24 border border-ink/15 p-3 text-sm text-ink focus:border-royal focus:outline-none resize-none"
                placeholder="Précisez votre demande..."
              ></textarea>
            </div>

            <div className="flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={() => setCancellationModal(prev => ({ ...prev, isOpen: false }))}
                disabled={cancellationModal.isSubmitting}
                className="uppercase tracking-widest text-xs px-6 py-2"
              >
                Retour
              </Button>
              <Button
                variant="royal"
                onClick={submitCancellationRequest}
                disabled={cancellationModal.isSubmitting}
                className="uppercase tracking-widest text-xs px-6 py-2"
              >
                {cancellationModal.isSubmitting ? (
                  <span className="flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /> Envoi...</span>
                ) : (
                  'Confirmer la demande'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {isPasswordModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="password-modal-title"
        >
          <div
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) closePasswordModal();
            }}
          ></div>
          <div className="relative bg-white p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={closePasswordModal}
              disabled={isSubmittingPassword}
              className="absolute top-4 right-4 text-ink-muted hover:text-ink disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 id="password-modal-title" className="font-serif text-2xl text-ink mb-6">Modifier votre mot de passe</h3>

            <form onSubmit={handlePasswordSubmit} className="space-y-5">
              <div>
                <label htmlFor="oldPassword" className="block text-xs uppercase tracking-widest text-ink-muted font-mono mb-2">
                  Ancien mot de passe
                </label>
                <input
                  id="oldPassword"
                  type="password"
                  autoComplete="current-password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  disabled={isSubmittingPassword}
                  autoFocus
                  className="w-full bg-white border border-ink/30 px-4 py-3 text-ink focus:outline-none focus:border-royal focus-visible:ring-1 ring-royal/30 disabled:bg-gray-50 disabled:text-gray-400"
                />
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-xs uppercase tracking-widest text-ink-muted font-mono mb-2">
                  Nouveau mot de passe
                </label>
                <input
                  id="newPassword"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isSubmittingPassword}
                  className="w-full bg-white border border-ink/30 px-4 py-3 text-ink focus:outline-none focus:border-royal focus-visible:ring-1 ring-royal/30 disabled:bg-gray-50 disabled:text-gray-400"
                />
                <p className="text-[10px] text-ink-muted mt-1 italic">8 caractères minimum</p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-xs uppercase tracking-widest text-ink-muted font-mono mb-2">
                  Confirmer le mot de passe
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isSubmittingPassword}
                  className="w-full bg-white border border-ink/30 px-4 py-3 text-ink focus:outline-none focus:border-royal focus-visible:ring-1 ring-royal/30 disabled:bg-gray-50 disabled:text-gray-400"
                />
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closePasswordModal}
                  disabled={isSubmittingPassword}
                  className="uppercase tracking-widest text-xs px-6 py-2"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmittingPassword}
                  className="uppercase tracking-widest text-xs px-6 py-2 flex items-center justify-center gap-2"
                >
                  {isSubmittingPassword ? (
                    <><Loader2 className="h-3 w-3 animate-spin" /> Mise à jour...</>
                  ) : (
                    "Mettre à jour"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
