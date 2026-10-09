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

  // Effet d'auto-ouverture (Ultra-Luxe)
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('action') === 'booking' && isAuthenticated) {
      setIsModalOpen(true);
      // Nettoyage discret de l'URL pour éviter la réouverture si on rafraîchit la page
      searchParams.delete('action');
      const newUrl = searchParams.toString() 
        ? `${location.pathname}?${searchParams.toString()}`
        : location.pathname;
      navigate(newUrl, { replace: true });
    }
  }, [location.search, location.pathname, isAuthenticated, navigate]);

  const handleBookingClick = () => {
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
            Service Privilège
          </div>
          <h3 className="font-serif text-2xl font-light tracking-wide text-white mb-3">Intéressé par ce bien ?</h3>
          <p className="text-xs text-white/80 font-medium tracking-wide mb-8">
            ✓ Formule tout inclus &bull; Tarifs ajustables selon la durée du séjour
          </p>

          <div className="space-y-4">
            <button 
              type="button"
              onClick={handleBookingClick}
              className="w-full flex items-center justify-center bg-white px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-royal transition-all duration-300 hover:bg-gray-100 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] rounded-sm"
            >
              Vérifier la disponibilité
            </button>

            <a
              href={`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER || '2250710101052'}?text=Bonjour, je souhaite me renseigner sur la résidence ${residence?.name} (Réf: ${residence?.reference})`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center bg-[#25D366] px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white transition-all duration-300 hover:bg-[#128C7E] hover:shadow-[0_0_20px_rgba(37,211,102,0.4)] rounded-sm gap-3"
            >
              <MessageCircle size={16} />
              Réserver sur WhatsApp
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
