import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import api from '../../services/api';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [subscriberEmail, setSubscriberEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (isSubscribing) return;

    try {
      setIsSubscribing(true);
      await api.post('/subscribers', { email: subscriberEmail.trim() });
      toast.success("Inscription confirmée. Merci !");
      setSubscriberEmail('');
    } catch (error) {
      const msg = error.response?.data?.error || error.response?.data?.message || "Impossible de vous inscrire pour le moment.";
      toast.error(msg);
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <motion.footer 
      className="bg-night text-white pt-16 pb-8"
      initial={{ opacity: 0, y: 30 }} 
      whileInView={{ opacity: 1, y: 0 }} 
      viewport={{ once: true }} 
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Col 1 */}
          <div>
            <div className="font-serif text-3xl mb-4">Rayonne Kelly</div>
            <p className="text-white/60 text-xs leading-relaxed mb-6">
              L'art de vivre avec une exigence hôtelière de luxe. Des espaces de vie uniques pour vos séjours d'affaires et de détente à Abidjan.
            </p>
            <div className="text-[10px] uppercase tracking-widest text-royal font-semibold">
              SERVICE CONCIERGERIE 24/7 <span className="text-gold mx-1">•</span> STANDING PREMIUM
            </div>
          </div>

          {/* Col 2 */}
          <div>
            <h3 className="text-xs uppercase tracking-[0.25em] text-gold mb-6 font-medium">CONTACT & ASSISTANCE</h3>
            <div className="space-y-3 text-xs leading-relaxed text-white/60">
              <p>Adresse: Cocody Ambassades, Abidjan, Côte d'Ivoire</p>
              <p>Téléphone: +225 XX XX XX XX XX</p>
              <p>Email: <a href="mailto:contact@rayonnekelly.ci" className="hover:text-white transition-colors">contact@rayonnekelly.ci</a></p>
            </div>
          </div>

          {/* Col 3 */}
          <div>
            <h3 className="text-xs uppercase tracking-[0.25em] text-gold mb-6 font-medium">RÉSIDENCES & SERVICES</h3>
            <ul className="space-y-3 flex flex-col text-xs leading-relaxed text-white/60">
              <li>
                <Link to="/collection" className="hover:text-white transition-colors">Toutes nos résidences</Link>
              </li>
              <li>
                <Link to="/client" className="hover:text-white transition-colors">Service de Conciergerie</Link>
              </li>
              <li>
                <Link to="/client" className="hover:text-white transition-colors">Mon Espace Client</Link>
              </li>
            </ul>
          </div>

          {/* Col 4 */}
          <div>
            <h3 className="text-xs uppercase tracking-[0.25em] text-gold mb-6 font-medium">LA GAZETTE PRIVÉE</h3>
            <p className="text-white/60 text-xs leading-relaxed mb-4">
              Recevez en avant-première nos nouvelles résidences et offres exclusives.
            </p>
            <form onSubmit={handleSubscribe} className="flex flex-col gap-3">
              <label htmlFor="newsletter-email" className="sr-only">Votre adresse e-mail</label>
              <input
                type="email"
                id="newsletter-email"
                value={subscriberEmail}
                onChange={(e) => setSubscriberEmail(e.target.value)}
                placeholder="Votre adresse e-mail"
                className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-xs px-4 py-3 rounded-none focus:outline-none focus:border-gold transition-colors"
                required
              />
              <button 
                type="submit" 
                className="w-full bg-white text-night hover:bg-gold hover:text-white text-xs uppercase tracking-[0.2em] px-6 py-3 rounded-none transition-all duration-500 font-medium"
                disabled={isSubscribing}
              >
                {isSubscribing ? 'INSCRIPTION...' : 'S\'ABONNER'}
              </button>
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-6 border-t border-white/10 flex flex-col md:flex-row md:justify-between gap-4 text-[11px] text-white/40">
          <div>
            Copyright © {currentYear} Rayonne Kelly. Tous droits réservés.
          </div>
          <div className="flex flex-col md:flex-row gap-4 md:gap-8">
            <Link to="/mentions-legales" className="hover:text-white transition-colors">Mentions Légales</Link>
            <Link to="/confidentialite" className="hover:text-white transition-colors">Politique de Confidentialité</Link>
            <Link to="/conditions" className="hover:text-white transition-colors">Conditions Générales (CGV/CGU)</Link>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}
