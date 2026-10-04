import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2, Briefcase, CalendarClock } from 'lucide-react';
import Input from '../common/Input';
import api from '../../services/api';
import { toast } from 'sonner';

export default function CorporateRequestModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    company_name: '',
    contact_name: '',
    email: '',
    phone: '',
    employee_count: '1-5 collaborateurs',
    duration: '',
    specific_needs: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // En attendant que l'API soit prête, on garde Axios prêt
      await api.post('/corporate-requests', formData);
      toast.success("Votre demande entreprise a été transmise. Un Account Manager vous contactera sous 24h.");
      onClose();
      setFormData({
        company_name: '',
        contact_name: '',
        email: '',
        phone: '',
        employee_count: '1-5 collaborateurs',
        duration: '',
        specific_needs: ''
      });
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || err.response?.data?.message || "Une erreur est survenue lors de l'envoi de la demande.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-night/80 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="absolute top-4 right-4 text-ink-muted hover:text-ink disabled:opacity-50 z-10"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Header */}
          <div className="p-6 md:p-8 bg-gray-50 border-b border-gray-100 flex flex-col items-center text-center shrink-0">
            <Building2 className="w-8 h-8 text-gold mb-3" />
            <div className="font-mono text-[10px] uppercase tracking-widest text-gold mb-2">
              Solutions B2B
            </div>
            <h3 className="font-serif text-2xl text-ink">Offre Entreprise</h3>
            <p className="text-sm text-ink-muted mt-2 max-w-md">
              Hébergement de cadres, séjours d'affaires et expatriation. Notre équipe s'occupe de toute votre logistique.
            </p>
          </div>

          {/* Form */}
          <div className="p-6 md:p-8 overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input
                  id="corp_company"
                  label="Nom de l'entreprise *"
                  placeholder="Ex: Société Minière SA"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  required
                />
                <Input
                  id="corp_contact"
                  label="Nom du contact *"
                  placeholder="Ex: M. Dupont (RH)"
                  value={formData.contact_name}
                  onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input
                  id="corp_email"
                  label="Email professionnel *"
                  type="email"
                  placeholder="Ex: rh@entreprise.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
                <Input
                  id="corp_phone"
                  label="Téléphone *"
                  type="tel"
                  placeholder="Ex: +225 07 00 00 00"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="corp_employees" className="block text-xs uppercase tracking-widest text-ink-muted mb-2">
                    Collaborateurs à loger
                  </label>
                  <select
                    id="corp_employees"
                    className="w-full bg-transparent border border-gray-200 rounded-md px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-gold"
                    value={formData.employee_count}
                    onChange={(e) => setFormData({ ...formData, employee_count: e.target.value })}
                  >
                    <option value="1 collaborateur">1 collaborateur</option>
                    <option value="2-5 collaborateurs">2 à 5 collaborateurs</option>
                    <option value="5-10 collaborateurs">5 à 10 collaborateurs</option>
                    <option value="10+ collaborateurs">Plus de 10 collaborateurs</option>
                  </select>
                </div>
                <Input
                  id="corp_duration"
                  label="Durée estimée"
                  placeholder="Ex: 6 mois à partir de Janvier"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="corp_needs" className="flex items-center justify-between mb-2 text-xs uppercase tracking-widest text-ink-muted">
                  <span>Besoins Spécifiques</span>
                  <span className="text-[9px] text-ink-muted/50 tracking-normal">Optionnel</span>
                </label>
                <textarea
                  id="corp_needs"
                  rows="3"
                  placeholder="Sécurité renforcée, navette aéroport, chauffeur privé, facturation centralisée..."
                  className="w-full bg-transparent border border-gray-200 rounded-md px-4 py-3 text-sm text-ink placeholder:text-ink-muted/50 outline-none transition-colors focus:border-gold resize-none"
                  value={formData.specific_needs}
                  onChange={(e) => setFormData({ ...formData, specific_needs: e.target.value })}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-night text-white font-medium text-xs tracking-[0.2em] uppercase py-4 rounded-md hover:bg-night-light transition-colors duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {isSubmitting ? 'Transmission en cours...' : 'Solliciter un Account Manager'}
                {!isSubmitting && <Briefcase className="w-4 h-4" />}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
