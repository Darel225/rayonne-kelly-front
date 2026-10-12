import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { 
  Search, 
  X, 
  Plus, 
  Sparkles, 
  ShieldCheck, 
  Heart, 
  CheckCircle2, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw, 
  Loader2, 
  AlertCircle, 
  Trash2, 
  Edit3 
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';
import { AMENITY_ICONS, getAmenityIcon } from '../../utils/iconMap';

const CATEGORIES = ['Bien-être & Loisirs', 'Sécurité & Autonomie Totale'];

const mapAmenity = (row) => ({
  id: row.id,
  name: row.name,
  category: row.category,
  status: Number(row.is_active) === 1 ? 'Actif' : 'En révision',
  assignedCount: Number(row.usage_count) || 0,
  iconName: row.icon_name,
});

export default function AmenitiesManagement() {
  const [amenities, setAmenities] = useState([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tous');
  
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [amenityToDelete, setAmenityToDelete] = useState(null);

  // Modal form state
  const [formData, setFormData] = useState({ 
    name: '', 
    category: CATEGORIES[0], 
    status: 'Actif', 
    icon_name: 'Check' 
  });

  const loadAmenities = useCallback(async (abortController) => {
    try {
      setIsLoading(true);
      setFetchError(null);
      const response = await api.get('/admin/amenities', { signal: abortController?.signal });
      const dataArray = Array.isArray(response) ? response : (response?.data || response || []);
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

  // KPIs
  const stats = useMemo(() => {
    const total = amenities.length;
    const bienEtre = amenities.filter(a => a.category === 'Bien-être & Loisirs').length;
    const securite = amenities.filter(a => a.category === 'Sécurité & Autonomie Totale').length;
    const actifs = amenities.filter(a => a.status === 'Actif').length;
    return { total, bienEtre, securite, actifs };
  }, [amenities]);

  // Filtrage combiné : Recherche + Catégorie
  const filteredAmenities = useMemo(() => {
    return amenities.filter(am => {
      const matchSearch = !search.trim() || am.name.toLowerCase().includes(search.toLowerCase().trim());
      const matchCategory = activeCategory === 'Tous' 
        ? true 
        : activeCategory === 'En révision' 
        ? am.status === 'En révision'
        : am.category === activeCategory;
      return matchSearch && matchCategory;
    });
  }, [amenities, search, activeCategory]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, activeCategory, itemsPerPage]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredAmenities.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredAmenities.length);
  const paginatedAmenities = filteredAmenities.slice(startIndex, endIndex);

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

  const handleOpenModal = (id = null) => {
    setEditingId(id);
    if (id) {
      const am = amenities.find(a => a.id === id);
      if (am) {
        setFormData({ 
          name: am.name, 
          category: am.category, 
          status: am.status, 
          icon_name: am.iconName || 'Check' 
        });
      }
    } else {
      setFormData({ 
        name: '', 
        category: CATEGORIES[0], 
        status: 'Actif', 
        icon_name: 'Check' 
      });
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
          is_active: formData.status === 'Actif' ? 1 : 0,
          icon_name: formData.icon_name
        });
        toast.success("Équipement modifié avec succès.");
      } else {
        await api.post('/amenities', {
          name: formData.name,
          category: formData.category,
          icon_name: formData.icon_name
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
      toast.success("Équipement supprimé avec succès.");
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

  const firstInputRef = useRef(null);
  useEffect(() => {
    if (isModalOpen && firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, [isModalOpen]);

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      
      {/* 1. EN-TÊTE PRINCIPAL */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-gold">Catalogue des Prestations & Confort</div>
          <h1 className="font-serif text-3xl text-ink mt-1">Équipements & Services</h1>
        </div>

        <button
          type="button"
          onClick={() => handleOpenModal(null)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-night text-gold border border-gold/40 hover:border-gold hover:bg-black text-xs uppercase tracking-wider font-mono rounded-sm transition-all shadow-sm cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5 text-gold" />
          <span>Ajouter une prestation</span>
        </button>
      </div>

      {/* 2. KPIS DE SYNTHÈSE */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-sm border border-ink/10 shadow-xs">
          <div className="flex items-center justify-between text-ink-muted mb-2">
            <span className="font-mono text-[10px] uppercase tracking-wider">Total Prestations</span>
            <Sparkles size={16} className="text-gold" />
          </div>
          <div className="font-serif text-2xl text-ink">{stats.total}</div>
          <div className="text-[11px] text-ink-muted mt-1 font-sans">
            Équipements répertoriés
          </div>
        </div>

        <div className="bg-white p-5 rounded-sm border border-ink/10 shadow-xs">
          <div className="flex items-center justify-between text-ink-muted mb-2">
            <span className="font-mono text-[10px] uppercase tracking-wider">Bien-être & Loisirs</span>
            <Heart size={16} className="text-royal" />
          </div>
          <div className="font-serif text-2xl text-royal">{stats.bienEtre}</div>
          <div className="text-[11px] text-royal/80 mt-1 font-sans">
            Prestations détente & confort
          </div>
        </div>

        <div className="bg-white p-5 rounded-sm border border-ink/10 shadow-xs">
          <div className="flex items-center justify-between text-ink-muted mb-2">
            <span className="font-mono text-[10px] uppercase tracking-wider">Sécurité & Autonomie</span>
            <ShieldCheck size={16} className="text-emerald-600" />
          </div>
          <div className="font-serif text-2xl text-emerald-700">{stats.securite}</div>
          <div className="text-[11px] text-emerald-800/80 mt-1 font-sans">
            Garanties techniques
          </div>
        </div>

        <div className="bg-white p-5 rounded-sm border border-ink/10 shadow-xs">
          <div className="flex items-center justify-between text-ink-muted mb-2">
            <span className="font-mono text-[10px] uppercase tracking-wider">Actifs au Catalogue</span>
            <CheckCircle2 size={16} className="text-emerald-600" />
          </div>
          <div className="font-serif text-2xl text-night">{stats.actifs}</div>
          <div className="text-[11px] text-ink-muted mt-1 font-sans">
            Visibles par les visiteurs
          </div>
        </div>
      </div>

      {/* 3. BARRE D'ONGLETS DE CATÉGORIES */}
      <div className="border-b border-ink/10 flex items-center overflow-x-auto gap-2 sm:gap-4 pb-px">
        {[
          { id: 'Tous', label: 'Toutes les prestations', count: stats.total },
          { id: 'Bien-être & Loisirs', label: 'Bien-être & Loisirs', count: stats.bienEtre },
          { id: 'Sécurité & Autonomie Totale', label: 'Sécurité & Autonomie', count: stats.securite },
          { id: 'En révision', label: 'En révision', count: stats.total - stats.actifs }
        ].map((tab) => {
          const isActive = activeCategory === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveCategory(tab.id)}
              className={`pb-3 px-1 text-xs font-medium whitespace-nowrap transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
                isActive 
                  ? 'border-gold text-ink font-semibold' 
                  : 'border-transparent text-ink-muted hover:text-ink hover:border-ink/20'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                isActive ? 'bg-night text-gold' : 'bg-gray-100 text-gray-600'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 4. BARRE D'OUTILS : RECHERCHE + SÉLECTEUR ÉLÉMENTS */}
      <div className="bg-white p-4 rounded-sm border border-ink/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un équipement ou service..."
            className="w-full bg-gray-50/70 border border-ink/10 rounded-sm pl-9 pr-8 py-2 text-xs text-ink placeholder:text-ink-muted focus:bg-white focus:outline-none focus:border-royal transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink p-0.5"
            >
              <X size={12} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-ink-muted font-mono uppercase">Afficher</span>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="bg-gray-50/70 border border-ink/10 rounded-sm px-2 py-1.5 text-xs text-ink focus:bg-white focus:outline-none focus:border-royal cursor-pointer"
            >
              <option value={6}>6</option>
              <option value={9}>9</option>
              <option value={12}>12</option>
              <option value={24}>24</option>
            </select>
          </div>

          {(search || activeCategory !== 'Tous') && (
            <button
              type="button"
              onClick={() => { setSearch(''); setActiveCategory('Tous'); }}
              className="text-xs text-royal hover:underline font-mono inline-flex items-center gap-1 cursor-pointer pl-2"
            >
              <RefreshCw size={11} /> Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* 5. GRILLE DES ÉQUIPEMENTS */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="bg-white border border-ink/10 rounded-sm p-5 h-36 animate-pulse flex flex-col justify-between">
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="h-6 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : fetchError ? (
        <div className="p-12 text-center bg-white border border-ink/10 rounded-sm">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-3" />
          <p className="text-sm text-red-600 mb-4">{fetchError}</p>
          <button 
            type="button"
            onClick={() => { const c = new AbortController(); loadAmenities(c); }}
            className="px-4 py-2 border border-ink/15 text-xs uppercase tracking-widest hover:border-royal hover:text-royal transition-colors rounded-sm"
          >
            Réessayer
          </button>
        </div>
      ) : filteredAmenities.length === 0 ? (
        <div className="p-20 text-center bg-white border border-ink/10 rounded-sm flex flex-col items-center justify-center">
          <Sparkles className="h-10 w-10 text-ink-muted/40 mb-3" />
          <h3 className="font-serif text-lg text-ink mb-1">Aucune prestation trouvée</h3>
          <p className="text-ink-muted text-xs max-w-sm mb-4">
            Aucun équipement ne correspond à votre filtre.
          </p>
          <button
            type="button"
            onClick={() => { setSearch(''); setActiveCategory('Tous'); }}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-ink text-xs uppercase tracking-wider font-mono rounded-sm transition-colors cursor-pointer"
          >
            Voir tout le catalogue
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginatedAmenities.map((amenity) => {
            const isActif = amenity.status === 'Actif';
            const IconComp = getAmenityIcon(amenity.iconName);

            return (
              <article 
                key={amenity.id} 
                className="bg-white border border-ink/10 rounded-sm p-5 hover:shadow-md transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-gold truncate">
                      {amenity.category}
                    </span>
                    <span className={`inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-xs border ${
                      isActif 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isActif ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      {amenity.status}
                    </span>
                  </div>
                  
                  <h3 className="font-serif text-base text-ink flex items-center gap-2.5 font-medium group-hover:text-royal transition-colors">
                    <span className="p-2 rounded-sm bg-gray-50 border border-ink/10 text-royal group-hover:border-gold transition-colors shrink-0">
                      <IconComp size={16} />
                    </span>
                    <span className="line-clamp-2">{amenity.name}</span>
                  </h3>
                </div>
                
                <div className="mt-5 pt-3.5 border-t border-ink/10 flex items-center justify-between">
                  <span className="text-[11px] text-ink-muted font-mono">
                    {amenity.assignedCount} résidence{amenity.assignedCount > 1 ? 's' : ''} équipée{amenity.assignedCount > 1 ? 's' : ''}
                  </span>

                  <div className="flex items-center gap-3">
                    <button 
                      type="button" 
                      onClick={() => handleOpenModal(amenity.id)} 
                      className="inline-flex items-center gap-1 text-xs uppercase tracking-wider font-mono text-royal hover:text-royal-dark transition-colors cursor-pointer"
                      title="Modifier cette prestation"
                    >
                      <Edit3 size={12} />
                      <span>Modifier</span>
                    </button>
                    <button 
                      type="button" 
                      onClick={() => handleDelete(amenity)} 
                      className="inline-flex items-center gap-1 text-xs uppercase tracking-wider font-mono text-red-600 hover:text-red-700 transition-colors cursor-pointer"
                      title="Supprimer cette prestation"
                    >
                      <Trash2 size={12} />
                      <span>Supprimer</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* 6. PAGINATION HAUTE PRÉCISION */}
      {filteredAmenities.length > 0 && !isLoading && (
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-ink/10 pt-6 pb-12 gap-4">
          <div className="text-xs text-ink-muted font-mono">
            Affichage de <strong className="text-ink">{startIndex + 1}</strong> à <strong className="text-ink">{endIndex}</strong> sur <strong className="text-ink">{filteredAmenities.length}</strong> prestation{filteredAmenities.length > 1 ? 's' : ''}
            {filteredAmenities.length !== stats.total && (
              <span className="text-[11px] text-gold ml-1">
                (filtré sur {stats.total} au total)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button 
              type="button"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-sm border border-ink/10 bg-white text-xs font-medium text-ink hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Précédent</span>
            </button>

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

            <button 
              type="button"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-sm border border-ink/10 bg-white text-xs font-medium text-ink hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <span>Suivant</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* MODALE D'AJOUT / ÉDITION */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-sm shadow-2xl w-full max-w-lg border border-ink/10 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-ink/10 bg-gray-50/50">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-gold">
                  {editingId ? "Modification" : "Nouvelle prestation"}
                </div>
                <h3 className="font-serif text-2xl text-ink">
                  {editingId ? "Modifier l'équipement" : "Ajouter un équipement"}
                </h3>
              </div>
              <button 
                type="button" 
                onClick={handleCloseModal} 
                className="text-ink-muted hover:text-ink p-1 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="text-[10px] font-mono uppercase tracking-widest text-ink-muted mb-1.5 block font-semibold">
                  Intitulé du service / équipement *
                </label>
                <input
                  ref={firstInputRef}
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Ex: Piscine à débordement, Groupe électrogène..."
                  className="w-full bg-white border border-ink/15 rounded-sm px-4 py-2.5 text-sm focus:outline-none focus:border-royal"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase tracking-widest text-ink-muted mb-1.5 block font-semibold">
                  Catégorie de prestation *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full bg-white border border-ink/15 rounded-sm px-4 py-2.5 text-sm focus:outline-none focus:border-royal cursor-pointer"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase tracking-widest text-ink-muted mb-1.5 block font-semibold">
                  Statut de disponibilité
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full bg-white border border-ink/15 rounded-sm px-4 py-2.5 text-sm focus:outline-none focus:border-royal cursor-pointer"
                >
                  <option value="Actif">Actif (Visible)</option>
                  <option value="En révision">En révision (Masqué)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase tracking-widest text-ink-muted mb-1.5 block font-semibold">
                  Icône représentative
                </label>
                <div className="grid grid-cols-6 gap-2 max-h-36 overflow-y-auto p-2 border border-ink/10 rounded-sm bg-gray-50/50 custom-scrollbar">
                  {Object.keys(AMENITY_ICONS).map(iconKey => {
                    const IconC = AMENITY_ICONS[iconKey];
                    const isSelected = formData.icon_name === iconKey;
                    return (
                      <button
                        key={iconKey}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, icon_name: iconKey }))}
                        className={`p-2 rounded-sm border flex items-center justify-center transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-night text-gold border-gold' 
                            : 'bg-white text-ink border-ink/10 hover:border-ink/30'
                        }`}
                        title={iconKey}
                      >
                        <IconC size={16} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-ink/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs uppercase tracking-widest font-mono text-ink-muted hover:text-ink cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.name.trim()}
                  className="px-5 py-2.5 bg-night text-gold hover:bg-black text-xs uppercase tracking-wider font-mono rounded-sm transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  <span>{editingId ? "Enregistrer les modifications" : "Créer la prestation"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE DE SUPPRESSION */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md shadow-2xl rounded-sm border border-ink/10 overflow-hidden">
            <div className="px-6 py-4 border-b border-ink/10 bg-gray-50/50">
              <h3 className="text-xs font-mono uppercase tracking-widest text-red-600 font-semibold flex items-center gap-2">
                <Trash2 size={14} /> Confirmation de suppression
              </h3>
            </div>
            <div className="p-6 text-ink text-sm leading-relaxed">
              Êtes-vous sûr de vouloir supprimer la prestation <strong>{amenityToDelete?.name}</strong> ?<br/><br/>
              Si elle est assignée à des résidences, vous devrez d'abord la dissocier.
            </div>
            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-ink/10">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeletingId !== null}
                className="px-4 py-2 text-xs uppercase tracking-widest text-ink-muted hover:text-ink transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeletingId !== null}
                className="px-4 py-2 text-xs uppercase tracking-widest bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2 rounded-sm cursor-pointer"
              >
                {isDeletingId === amenityToDelete?.id ? 'Suppression...' : 'Confirmer la suppression'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
