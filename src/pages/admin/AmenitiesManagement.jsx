import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Search } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';
import Button from '../../components/common/Button';

const CATEGORIES = ['Bien-être & Loisirs', 'Sécurité & Autonomie Totale'];
const STATUS_OPTIONS = ['Actif', 'En révision'];

const mapAmenity = (row) => ({
  id: row.id,
  name: row.name,
  category: row.category,
  status: Number(row.is_active) === 1 ? 'Actif' : 'En révision',
  assignedCount: Number(row.usage_count) || 0,
});

export default function AmenitiesManagement() {
  const [amenities, setAmenities] = useState([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tous');
  
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [amenityToDelete, setAmenityToDelete] = useState(null);

  // Modal form state
  const [formData, setFormData] = useState({ name: '', category: CATEGORIES[0], status: 'Actif' });

  const loadAmenities = useCallback(async (abortController) => {
    try {
      setIsLoading(true);
      setFetchError(null);
      const response = await api.get('/admin/amenities', { signal: abortController?.signal });
      const dataArray = Array.isArray(response) ? response : response.data;
      setAmenities(dataArray.map(mapAmenity));
    } catch (error) {
      if (error.name === 'CanceledError' || error.message === 'canceled') return;
      const msg = error.response?.data?.error || error.response?.data?.message || "Impossible de charger les équipements.";
      setFetchError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const abortController = new AbortController();
    loadAmenities(abortController);
    return () => abortController.abort();
  }, [loadAmenities]);

  // Escape to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  // Derived list
  const filteredAmenities = useMemo(() => {
    return amenities.filter(am => {
      const matchSearch = am.name.toLowerCase().includes(search.toLowerCase());
      const matchCategory = activeCategory === 'Tous' || am.category === activeCategory;
      return matchSearch && matchCategory;
    });
  }, [amenities, search, activeCategory]);

  const handleOpenModal = (id = null) => {
    setEditingId(id);
    if (id) {
      const am = amenities.find(a => a.id === id);
      if (am) {
        setFormData({ name: am.name, category: am.category, status: am.status });
      }
    } else {
      setFormData({ name: '', category: CATEGORIES[0], status: 'Actif' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      if (editingId) {
        await api.put(`/admin/amenities/${editingId}`, {
          name: formData.name,
          category: formData.category,
          is_active: formData.status === 'Actif' ? 1 : 0
        });
        toast.success("Équipement modifié avec succès.");
      } else {
        await api.post('/amenities', {
          name: formData.name,
          category: formData.category
        });
        toast.success("Équipement ajouté avec succès.");
      }
      handleCloseModal();
      loadAmenities();
    } catch (error) {
      const msg = error.response?.data?.error || error.response?.data?.message || "Erreur lors de l'enregistrement.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (amenity) => {
    setAmenityToDelete(amenity);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!amenityToDelete || isDeletingId) return;

    try {
      setIsDeletingId(amenityToDelete.id);
      await api.delete(`/admin/amenities/${amenityToDelete.id}`);
      toast.success("Équipement supprimé.");
      setAmenities(prev => prev.filter(am => am.id !== amenityToDelete.id));
      setShowDeleteModal(false);
      setAmenityToDelete(null);
    } catch (error) {
      const msg = error.response?.data?.error || error.response?.data?.message || "Impossible de supprimer l'équipement.";
      toast.error(msg);
      if (error.response?.status === 409) {
        setShowDeleteModal(false);
        setAmenityToDelete(null);
      }
    } finally {
      setIsDeletingId(null);
    }
  };

  const inputClass = "w-full bg-white border border-ink/15 rounded-[1px] px-4 py-2 text-sm focus:outline-none focus:border-royal";
  const labelClass = "text-[10px] uppercase tracking-widest text-ink-muted mb-2 block";

  const firstInputRef = useRef(null);
  useEffect(() => {
    if (isModalOpen && firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, [isModalOpen]);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-royal">
        <span className="w-1.5 h-1.5 bg-royal rounded-full" aria-hidden="true"></span>
        CATALOGUE DES PRESTATIONS
      </div>
      
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mt-2">
        <h1 className="font-serif text-4xl text-ink">Équipements & Services</h1>
        <Button variant="royal" onClick={() => handleOpenModal(null)} className="uppercase tracking-widest text-xs whitespace-nowrap">
          + Ajouter un service
        </Button>
      </div>

      {/* Filters & Search */}
      <div className="mt-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex flex-wrap gap-2">
          {['Tous', ...CATEGORIES].map(cat => (
            <button 
              key={cat} 
              type="button" 
              aria-pressed={activeCategory === cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 text-xs uppercase tracking-widest border rounded-[1px] transition-colors ${
                activeCategory === cat 
                  ? 'border-royal text-royal bg-royal/5' 
                  : 'border-ink/15 text-ink-muted hover:border-ink/30 hover:text-ink'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <label htmlFor="amenity-search" className="sr-only">Rechercher un équipement</label>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted h-4 w-4" />
          <input 
            id="amenity-search" 
            type="text" 
            placeholder="Rechercher un équipement..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-ink/15 rounded-[1px] pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-royal" 
          />
        </div>
      </div>

      {/* Card Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {[...Array(6)].map((_, idx) => (
            <div key={idx} className="bg-white border border-ink/10 rounded-sm p-5 h-40 animate-pulse flex flex-col justify-between">
              <div className="flex justify-between w-full">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="flex justify-between w-full items-center border-t border-ink/10 pt-4">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : fetchError ? (
        <div className="mt-8 text-center py-12 border border-ink/10 bg-white rounded-sm">
          <div className="text-red-600 mb-4">{fetchError}</div>
          <button onClick={() => loadAmenities()} className="px-4 py-2 border border-ink/15 text-xs uppercase tracking-widest hover:border-royal hover:text-royal transition-colors rounded-sm">Réessayer</button>
        </div>
      ) : filteredAmenities.length === 0 ? (
        <div className="mt-8 text-center text-ink-muted text-sm py-12 border border-ink/10 bg-white rounded-sm">
          Aucun équipement ne correspond à votre recherche.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8" role="list">
          {filteredAmenities.map((amenity) => {
            const isActif = amenity.status === 'Actif';
            return (
              <article key={amenity.id} role="listitem" className="bg-white border border-ink/10 rounded-sm p-5 hover:shadow-sm transition-all duration-300 flex flex-col justify-between">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-ink-muted truncate">
                    {amenity.category}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`w-1.5 h-1.5 rounded-full ${isActif ? 'bg-emerald-500' : 'bg-amber-500'}`} aria-hidden="true"></span>
                    <span className="text-xs text-ink">{amenity.status}</span>
                  </div>
                </div>
                
                <h2 className="font-serif text-base text-ink mt-1 line-clamp-2">{amenity.name}</h2>
                
                <div className="mt-auto pt-4 border-t border-ink/10 flex items-center justify-between">
                  <div className="text-xs text-ink-muted">
                    Utilisé dans {amenity.assignedCount} résidence{amenity.assignedCount > 1 ? 's' : ''}
                  </div>

                  <button 
                    type="button" 
                    onClick={() => handleDelete(amenity)} 
                    aria-label={`Supprimer ${amenity.name}`}
                    className="text-xs uppercase tracking-widest text-red-600 hover:text-red-700 transition-colors"
                  >
                    Supprimer
                  </button>
                  <button 
                    type="button" 
                    onClick={() => handleOpenModal(amenity.id)} 
                    aria-label={`Modifier ${amenity.name}`}
                    className="text-xs uppercase tracking-widest text-royal hover:text-royal/80 transition-colors"
                  >
                    Modifier
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-night/50" onClick={handleCloseModal} aria-hidden="true"></div>
          
          <div className="relative bg-white rounded-sm p-8 w-full max-w-md max-h-[90vh] overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="amenity-modal-title">
            <h2 id="amenity-modal-title" className="font-serif text-2xl text-ink">
              {editingId ? 'Modifier le service' : 'Ajouter un service'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6 mt-6">
              <div>
                <label htmlFor="name" className={labelClass}>NOM DU SERVICE</label>
                <input 
                  id="name" 
                  name="name" 
                  type="text" 
                  required 
                  value={formData.name} 
                  onChange={handleChange} 
                  ref={firstInputRef}
                  className={inputClass} 
                />
              </div>

              <div>
                <label htmlFor="category" className={labelClass}>CATÉGORIE</label>
                <select id="category" name="category" required value={formData.category} onChange={handleChange} className={inputClass}>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="status" className={labelClass}>STATUT</label>
                <select id="status" name="status" required value={formData.status} onChange={handleChange} className={inputClass}>
                  {STATUS_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-4 pt-4 border-t border-ink/10 justify-end">
                <Button type="button" variant="outline" onClick={handleCloseModal} className="uppercase tracking-widest text-xs px-4 py-2">
                  Annuler
                </Button>
                <Button type="submit" variant="royal" className="uppercase tracking-widest text-xs px-4 py-2" disabled={isSubmitting}>
                  {isSubmitting ? 'Enregistrement...' : (editingId ? 'Enregistrer' : 'Ajouter')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md shadow-2xl flex flex-col">
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="text-sm font-medium uppercase tracking-widest text-red-600">
                Confirmation requise
              </h3>
            </div>
            <div className="px-6 py-6 text-gray-600 text-sm leading-relaxed">
              Êtes-vous sûr de vouloir supprimer l'équipement <strong>{amenityToDelete?.name}</strong> ?<br/><br/>
              Cette action est irréversible.
            </div>
            <div className="px-6 py-5 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeletingId !== null}
                className="px-5 py-2.5 text-xs uppercase tracking-widest text-gray-500 hover:text-gray-800 transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeletingId !== null}
                className="px-5 py-2.5 text-xs uppercase tracking-widest bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isDeletingId === amenityToDelete?.id ? 'Suppression...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
