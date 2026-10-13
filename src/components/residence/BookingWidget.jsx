import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Star, MessageCircle, Phone } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import BookingModal from './BookingModal';

export default function BookingWidget({ residence }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useAuthStore(state => !!state.accessToken);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const txType = residence?.transaction_type || localStorage.getItem(`rk_tx_type_${residence?.id}`) || 'meuble';
  const status = residence?.status || localStorage.getItem(`rk_status_${residence?.id}`) || (residence?.is_active === 0 ? 'reserve' : 'disponible');
  const isAvailable = status === 'disponible';

  const rawPrice = residence?.price_sale || residence?.price_per_night || residence?.price;
  const priceDisplay = residence?.price_display || localStorage.getItem(`rk_price_display_${residence?.id}`) || (residence?.is_price_displayed !== undefined ? (residence?.is_price_displayed ? 'public' : 'on_demand') : (rawPrice ? 'public' : 'on_demand'));
  const isPriceMasked = priceDisplay === 'on_demand' || !rawPrice;

  // Effet d'auto-ouverture (Ultra-Luxe)
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('action') === 'booking' && isAuthenticated && isAvailable) {
      setIsModalOpen(true);
      // Nettoyage discret de l'URL pour éviter la réouverture si on rafraîchit la page
      searchParams.delete('action');
      const newUrl = searchParams.toString() 
        ? `${location.pathname}?${searchParams.toString()}`
        : location.pathname;
      navigate(newUrl, { replace: true });
    }
  }, [location.search, location.pathname, isAuthenticated, isAvailable, navigate]);

  const handleBookingClick = () => {
    if (!isAvailable) return;
    if (!isAuthenticated) {
      // On embarque l'intention dans la redirection
      navigate(`/connexion?redirect=${encodeURIComponent(location.pathname + '?action=booking')}`);
    } else {
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <div className="sticky top-32 self-start bg-royal text-white shadow-2xl p-10 rounded-sm relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.3em] text-white/80 mb-6">
            <Star size={12} className="text-white fill-white/50" />
            Service Privilège &bull; {txType === 'vente' ? 'Acquisition' : txType === 'location' ? 'Location' : isPriceMasked ? 'Cotation Sur-Mesure' : 'Séjour d\'Exception'}
          </div>
          <h3 className="font-serif text-2xl font-light tracking-wide text-white mb-3">
            {txType === 'vente' ? 'Acquérir ce bien de prestige' : isPriceMasked ? 'Demander un devis' : 'Intéressé par ce bien ?'}
          </h3>
          <p className="text-xs text-white/80 font-medium tracking-wide mb-8">
            {status === 'vendu'
              ? 'Ce bien a trouvé preneur et n\'est plus disponible à l\'achat.'
              : status === 'loue'
              ? 'Ce bien fait actuellement l\'objet d\'un bail résidentiel.'
              : status === 'reserve'
              ? 'Une option est actuellement posée sur cette résidence.'
              : txType === 'vente'
              ? '✓ Accompagnement notarié • Dossier d\'acquisition et visite sur rendez-vous'
              : txType === 'location'
              ? '✓ Bail résidentiel • Garanties d\'usage'
              : isPriceMasked
              ? '✓ Tarif sur devis • Proposition chiffrée selon vos dates et exigences'
              : '✓ Formule tout inclus • Tarifs ajustables selon la durée'}
          </p>

          <div className="space-y-4">
            {status === 'vendu' ? (
              <a
                href={`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER || '2250710101052'}?text=Bonjour, j'ai vu la résidence ${residence?.name} (Réf: ${residence?.reference}) marquée comme vendue. Avez-vous un bien similaire disponible ?`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center bg-black/60 border border-gold/70 text-gold px-6 py-4 text-[10px] font-bold uppercase tracking-widest rounded-sm hover:bg-gold hover:text-night transition-colors gap-2"
              >
                <MessageCircle size={14} />
                Demander un bien similaire
              </a>
            ) : status === 'loue' ? (
              <a
                href={`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER || '2250710101052'}?text=Bonjour, j'ai vu que la résidence ${residence?.name} (Réf: ${residence?.reference}) est actuellement louée. Quand sera-t-elle disponible ou avez-vous un bien similaire ?`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center bg-white/10 border border-white/30 text-white px-6 py-4 text-[10px] font-bold uppercase tracking-widest rounded-sm hover:bg-white hover:text-royal transition-colors gap-2"
              >
                <MessageCircle size={14} />
                Se renseigner sur la disponibilité
              </a>
            ) : status === 'reserve' ? (
              <button 
                type="button"
                onClick={handleBookingClick}
                className="w-full flex items-center justify-center bg-amber-400 text-night px-6 py-4 text-[10px] font-bold uppercase tracking-widest transition-all duration-300 hover:bg-white rounded-sm"
              >
                Option en cours &bull; Se renseigner
              </button>
            ) : txType === 'vente' ? (
              <button 
                type="button"
                onClick={handleBookingClick}
                className="w-full flex items-center justify-center bg-gold px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-night transition-all duration-300 hover:bg-white hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] rounded-sm font-semibold"
              >
                Planifier une visite privée
              </button>
            ) : txType === 'location' ? (
              <button 
                type="button"
                onClick={handleBookingClick}
                className="w-full flex items-center justify-center bg-white px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-royal transition-all duration-300 hover:bg-gray-100 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] rounded-sm font-semibold"
              >
                Demande de location &bull; Visite
              </button>
            ) : isPriceMasked ? (
              <button 
                type="button" 
                onClick={handleBookingClick}
                className="w-full flex items-center justify-center bg-gold px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-night transition-all duration-300 hover:bg-white hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] rounded-sm font-semibold"
              >
                Demander un devis personnalisé
              </button>
            ) : (
              <button 
                type="button" 
                onClick={handleBookingClick}
                className="w-full flex items-center justify-center bg-white px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-royal transition-all duration-300 hover:bg-gray-100 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] rounded-sm"
              >
                Vérifier la disponibilité • Réserver
              </button>
            )}

            <a
              href={`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER || '2250710101052'}?text=${encodeURIComponent(
                isPriceMasked
                  ? `Bonjour Rayonne Kelly, je souhaite obtenir un devis personnalisé pour la résidence ${residence?.name} (Réf: ${residence?.reference}). Pouvez-vous me communiquer vos disponibilités et proposition tarifaire ?`
                  : `Bonjour, je souhaite me renseigner sur la résidence ${residence?.name} (Réf: ${residence?.reference})`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center bg-[#25D366] px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white transition-all duration-300 hover:bg-[#128C7E] hover:shadow-[0_0_20px_rgba(37,211,102,0.4)] rounded-sm gap-3"
            >
              <MessageCircle size={16} />
              {isPriceMasked ? 'Devis via WhatsApp' : 'Échanger sur WhatsApp'}
            </a>

            <a
              href={`tel:+${import.meta.env.VITE_WHATSAPP_NUMBER || '2250710101052'}`}
              className="w-full flex items-center justify-center border border-white/40 text-white px-6 py-4 text-[10px] font-bold uppercase tracking-widest transition-all duration-300 hover:bg-white hover:text-royal rounded-sm gap-3"
            >
              <Phone size={14} />
              Appeler Rayonne Kelly
            </a>
          </div>
        </div>
      </div>

      <BookingModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        residence={residence} 
      />
    </>
  );
}
