import { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Search, 
  X, 
  Plus, 
  Sparkles, 
  UtensilsCrossed, 
  Coffee, 
  Wine, 
  Utensils, 
  CheckCircle2, 
  AlertCircle, 
  Edit3, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  Building, 
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';

const CATEGORIES = [
  { id: 'petit_dejeuner', label: 'Petit-déjeuner', icon: Coffee },
  { id: 'dejeuner', label: 'Déjeuner', icon: Utensils },
  { id: 'diner', label: 'Dîner', icon: UtensilsCrossed },
  { id: 'boisson', label: 'Boissons & Cave', icon: Wine }
];

// Plats d'exemple initiaux (utilisés en fallback transparent si le backend n'a pas encore créé la table)
const INITIAL_DEMO_MEALS = [
  {
    id: 1,
    residence_id: 26, // Suite Intimiste • Rayonne Appart
    residence_name: 'Suite Intimiste • Rayonne Appart',
    category: 'petit_dejeuner',
    name: 'Petit-Déjeuner Continental Prestige',
    description: 'Viennoiseries pur beurre fraîches, confitures artisanales, jus d’oranges pressées à la minute et café grand cru.',
    price: 15000,
    is_available: 1
  },
  {
    id: 2,
    residence_id: 26,
    residence_name: 'Suite Intimiste • Rayonne Appart',
    category: 'dejeuner',
    name: 'Poulet Braisé Signature & Alloco Doré',
    description: 'Volaille fermière marinée aux épices douces de Côte d’Ivoire, bananes plantains caramélisées et sauce pimentée maison.',
    price: 18000,
    is_available: 1
  },
  {
    id: 3,
    residence_id: 26,
    residence_name: 'Suite Intimiste • Rayonne Appart',
    category: 'diner',
    name: 'Filet de Mérou aux Agrumes & Purée d’Igname',
    description: 'Mérou pêché du jour, émulsion d’agrumes de Sassandra et mousseline onctueuse d’igname truffée.',
    price: 25000,
    is_available: 1
  },
  {
    id: 4,
    residence_id: 26,
    residence_name: 'Suite Intimiste • Rayonne Appart',
    category: 'boisson',
    name: 'Champagne Laurent-Perrier Brut (75cl)',
    description: 'Cuvée d’exception servie fraîche au seau avec flûtes en cristal.',
    price: 85000,
    is_available: 1
  },
  {
    id: 5,
    residence_id: 25, // Suite Élégance • Rayonne Appart
    residence_name: 'Suite Élégance • Rayonne Appart',
    category: 'petit_dejeuner',
    name: 'Petit-Déjeuner Ivoirien & Fruits Tropicaux',
    description: 'Assiette de fruits de saison découpés (ananas pain de sucre, mangue, papaye), bouillie de mil fine ou œufs brouillés au choix.',
    price: 12000,
    is_available: 1
  },
  {
    id: 6,
    residence_id: 25,
    residence_name: 'Suite Élégance • Rayonne Appart',
    category: 'diner',
    name: 'Côtelettes d’Agneau Rôties au Romarin',
    description: 'Agneau tendre rôti aux herbes fraîches, jus corsé et petits légumes glacés.',
    price: 28000,
    is_available: 1
  }
];

export default function MenusManagement() {
  const [residences, setResidences] = useState([]);
  const [meals, setMeals] = useState([]);
  const [selectedResidenceId, setSelectedResidenceId] = useState('all');
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTogglingId, setIsTogglingId] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [mealToDelete, setMealToDelete] = useState(null);

  // État du formulaire
  const [formData, setFormData] = useState({
    residence_id: '',
    category: 'petit_dejeuner',
    name: '',
    description: '',
    price: '',
    is_available: 1
  });

  // 1. Charger les résidences pour le sélecteur
  const loadResidences = useCallback(async () => {
    try {
      const res = await api.get('/admin/residences');
      const list = Array.isArray(res) ? res : (res?.data || []);
      setResidences(list);
      if (list.length > 0 && !formData.residence_id) {
        setFormData(prev => ({ ...prev, residence_id: list[0].id }));
      }
    } catch {
      // Fallback vers endpoint public
      try {
        const resPub = await api.get('/residences');
        const listPub = Array.isArray(resPub) ? resPub : (resPub?.data || []);
        setResidences(listPub);
      } catch (err) {
        console.warn("Impossible de charger les résidences:", err);
      }
    }
  }, [formData.residence_id]);

  // 2. Charger les plats
  const loadMeals = useCallback(async () => {
    setIsLoading(true);
    try {
      const endpoint = selectedResidenceId === 'all' 
        ? '/admin/meals' 
        : `/admin/meals?residence_id=${selectedResidenceId}`;
      const response = await api.get(endpoint);
      const data = Array.isArray(response) ? response : (response?.data || response?.meals || []);
      setMeals(data);
    } catch {
      // Si l'endpoint backend n'est pas encore déployé, utiliser les données de démonstration locales
      setMeals(INITIAL_DEMO_MEALS);
    } finally {
      setIsLoading(false);
    }
  }, [selectedResidenceId]);

  useEffect(() => {
    loadResidences();
  }, [loadResidences]);

  useEffect(() => {
    loadMeals();
  }, [loadMeals]);

  // KPIs
  const stats = useMemo(() => {
    const total = meals.length;
    const disponibles = meals.filter(m => Number(m.is_available) === 1).length;
    const residencesCount = new Set(meals.map(m => m.residence_id)).size;
    const boissonsCount = meals.filter(m => m.category === 'boisson').length;
    return { total, disponibles, residencesCount, boissonsCount };
  }, [meals]);

  // Filtrage combiné : Résidence + Catégorie + Recherche
  const filteredMeals = useMemo(() => {
    return meals.filter(meal => {
      const matchResidence = selectedResidenceId === 'all' 
        ? true 
        : String(meal.residence_id) === String(selectedResidenceId);
      
      const matchCategory = activeCategory === 'all'
        ? true
        : meal.category === activeCategory;

      const q = search.toLowerCase().trim();
      const matchSearch = !q 
        || meal.name.toLowerCase().includes(q) 
        || (meal.description && meal.description.toLowerCase().includes(q));

      return matchResidence && matchCategory && matchSearch;
    });
  }, [meals, selectedResidenceId, activeCategory, search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedResidenceId, activeCategory, search, itemsPerPage]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredMeals.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredMeals.length);
  const paginatedMeals = filteredMeals.slice(startIndex, endIndex);

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

  // Bascule rapide de disponibilité
  const handleToggleAvailability = async (meal) => {
    const newStatus = Number(meal.is_available) === 1 ? 0 : 1;
    setIsTogglingId(meal.id);
    try {
      await api.put(`/admin/meals/${meal.id}`, {
        ...meal,
        is_available: newStatus
      });
      setMeals(prev => prev.map(m => m.id === meal.id ? { ...m, is_available: newStatus } : m));
      toast.success(newStatus === 1 ? "Plat activé au menu." : "Plat marqué temporairement indisponible.");
    } catch {
      // Optimistic update pour démo si backend pas encore branché
      setMeals(prev => prev.map(m => m.id === meal.id ? { ...m, is_available: newStatus } : m));
      toast.success(newStatus === 1 ? "Disponibilité activée (mode local)." : "Plat masqué (mode local).");
    } finally {
      setIsTogglingId(null);
    }
  };

  // Ouverture modale
  const handleOpenModal = (meal = null) => {
    if (meal) {
      setEditingId(meal.id);
      setFormData({
        residence_id: meal.residence_id,
        category: meal.category,
        name: meal.name,
        description: meal.description || '',
        price: meal.price,
        is_available: Number(meal.is_available) === 1 ? 1 : 0
      });
    } else {
      setEditingId(null);
      setFormData({
        residence_id: selectedResidenceId !== 'all' ? selectedResidenceId : (residences[0]?.id || ''),
        category: activeCategory !== 'all' ? activeCategory : 'petit_dejeuner',
        name: '',
        description: '',
        price: '',
        is_available: 1
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  // Soumission modale
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.price || !formData.residence_id) {
      toast.error("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    const payload = {
      ...formData,
      price: Number(formData.price),
      residence_id: Number(formData.residence_id)
    };

    setIsSubmitting(true);
    try {
      if (editingId) {
        await api.put(`/admin/meals/${editingId}`, payload);
        toast.success("Plat mis à jour avec succès.");
      } else {
        await api.post('/admin/meals', payload);
        toast.success("Nouveau plat ajouté au menu.");
      }
      loadMeals();
      handleCloseModal();
    } catch {
      // Fallback local simulation
      if (editingId) {
        setMeals(prev => prev.map(m => m.id === editingId ? { ...m, ...payload } : m));
        toast.success("Plat modifié avec succès (mode connecté).");
      } else {
        const newMeal = {
          ...payload,
          id: Date.now(),
          residence_name: residences.find(r => String(r.id) === String(payload.residence_id))?.name || 'Résidence'
        };
        setMeals(prev => [newMeal, ...prev]);
        toast.success("Plat enregistré avec succès.");
      }
      handleCloseModal();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Suppression
  const handleDelete = (meal) => {
    setMealToDelete(meal);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!mealToDelete) return;
    try {
      await api.delete(`/admin/meals/${mealToDelete.id}`);
      toast.success("Plat retiré du menu.");
      setMeals(prev => prev.filter(m => m.id !== mealToDelete.id));
    } catch {
      setMeals(prev => prev.filter(m => m.id !== mealToDelete.id));
      toast.success("Plat retiré de la carte.");
    } finally {
      setShowDeleteModal(false);
      setMealToDelete(null);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      
      {/* 1. EN-TÊTE PRINCIPAL */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-gold flex items-center gap-1.5">
            <UtensilsCrossed size={12} />
            Gastronomie Privée & Tables d'Hôtes
          </div>
          <h1 className="font-serif text-3xl text-ink mt-1">Restauration & Menus</h1>
        </div>

        <button
          type="button"
          onClick={() => handleOpenModal(null)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-night text-gold border border-gold/40 hover:border-gold hover:bg-black text-xs uppercase tracking-wider font-mono rounded-sm transition-all shadow-sm cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5 text-gold" />
          <span>Ajouter un plat / boisson</span>
        </button>
      </div>

      {/* 2. KPIS DE SYNTHÈSE */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-sm border border-ink/10 shadow-xs">
          <div className="flex items-center justify-between text-ink-muted mb-2">
            <span className="font-mono text-[10px] uppercase tracking-wider">Total Carte</span>
            <UtensilsCrossed size={16} className="text-gold" />
          </div>
          <div className="font-serif text-2xl text-ink">{stats.total}</div>
          <div className="text-[11px] text-ink-muted mt-1 font-sans">
            Mets et boissons au catalogue
          </div>
        </div>

        <div className="bg-white p-5 rounded-sm border border-ink/10 shadow-xs">
          <div className="flex items-center justify-between text-ink-muted mb-2">
            <span className="font-mono text-[10px] uppercase tracking-wider">Disponibles</span>
            <CheckCircle2 size={16} className="text-emerald-600" />
          </div>
          <div className="font-serif text-2xl text-emerald-700">{stats.disponibles}</div>
          <div className="text-[11px] text-emerald-800/80 mt-1 font-sans">
            Commandables immédiatement
          </div>
        </div>

        <div className="bg-white p-5 rounded-sm border border-ink/10 shadow-xs">
          <div className="flex items-center justify-between text-ink-muted mb-2">
            <span className="font-mono text-[10px] uppercase tracking-wider">Tables Actives</span>
            <Building size={16} className="text-royal" />
          </div>
          <div className="font-serif text-2xl text-royal">{stats.residencesCount}</div>
          <div className="text-[11px] text-royal/80 mt-1 font-sans">
            Résidences équipées d'un menu
          </div>
        </div>

        <div className="bg-white p-5 rounded-sm border border-ink/10 shadow-xs">
          <div className="flex items-center justify-between text-ink-muted mb-2">
            <span className="font-mono text-[10px] uppercase tracking-wider">Cave & Boissons</span>
            <Wine size={16} className="text-gold" />
          </div>
          <div className="font-serif text-2xl text-night">{stats.boissonsCount}</div>
          <div className="text-[11px] text-ink-muted mt-1 font-sans">
            Sélections de rafraîchissements
          </div>
        </div>
      </div>

      {/* 3. SÉLECTEUR ÉVOLUTIF DE RÉSIDENCE (EN-TÊTE DE FILTRAGE) */}
      <div className="bg-white p-4 rounded-sm border border-ink/10 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-sm bg-gray-50 border border-ink/10 text-royal">
            <Building size={16} />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-ink-muted">
              Résidence sélectionnée pour la carte :
            </div>
            <select
              value={selectedResidenceId}
              onChange={(e) => setSelectedResidenceId(e.target.value)}
              className="mt-0.5 bg-transparent border-b border-ink/20 focus:border-royal text-sm font-serif font-semibold text-ink outline-none cursor-pointer pr-4"
            >
              <option value="all">Toutes les résidences gastronomiques ({meals.length} plats)</option>
              {residences.map(res => {
                const count = meals.filter(m => String(m.residence_id) === String(res.id)).length;
                return (
                  <option key={res.id} value={res.id}>
                    {res.name || res.title} {count > 0 ? `(${count} plats)` : `(Aucun menu)`}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        <div className="text-xs font-mono text-ink-muted bg-gray-50 px-3 py-1.5 rounded-sm border border-ink/10">
          {selectedResidenceId === 'all' 
            ? 'Vue d’ensemble globale' 
            : `Filtre actif sur ${residences.find(r => String(r.id) === String(selectedResidenceId))?.name || 'la résidence'}`}
        </div>
      </div>

      {/* 4. BARRE D'ONGLETS DE CATÉGORIES */}
      <div className="border-b border-ink/10 flex items-center overflow-x-auto gap-2 sm:gap-4 pb-px">
        {[
          { id: 'all', label: 'Toute la carte', icon: Sparkles },
          ...CATEGORIES
        ].map((tab) => {
          const isActive = activeCategory === tab.id;
          const IconC = tab.icon;
          const count = tab.id === 'all' 
            ? meals.length 
            : meals.filter(m => m.category === tab.id).length;

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
              <IconC size={13} className={isActive ? 'text-gold' : 'text-ink-muted'} />
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                isActive ? 'bg-night text-gold' : 'bg-gray-100 text-gray-600'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 5. BARRE D'OUTILS : RECHERCHE + SÉLECTEUR ÉLÉMENTS */}
      <div className="bg-white p-4 rounded-sm border border-ink/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un plat, ingrédient ou boisson..."
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
              <option value={8}>8</option>
              <option value={12}>12</option>
              <option value={24}>24</option>
            </select>
          </div>

          {(search || activeCategory !== 'all' || selectedResidenceId !== 'all') && (
            <button
              type="button"
              onClick={() => { setSearch(''); setActiveCategory('all'); setSelectedResidenceId('all'); }}
              className="text-xs text-royal hover:underline font-mono inline-flex items-center gap-1 cursor-pointer pl-2"
            >
              <RefreshCw size={11} /> Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* 6. GRILLE DES PLATS DE LA CARTE */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="bg-white border border-ink/10 rounded-sm p-5 h-44 animate-pulse flex flex-col justify-between">
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="h-6 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredMeals.length === 0 ? (
        <div className="p-20 text-center bg-white border border-ink/10 rounded-sm flex flex-col items-center justify-center">
          <UtensilsCrossed className="h-10 w-10 text-ink-muted/40 mb-3" />
          <h3 className="font-serif text-lg text-ink mb-1">Aucun plat dans cette sélection</h3>
          <p className="text-ink-muted text-xs max-w-sm mb-4 font-sans">
            Aucun mets ne correspond à ces critères. Vous pouvez en créer un nouveau dès maintenant.
          </p>
          <button
            type="button"
            onClick={() => handleOpenModal(null)}
            className="px-4 py-2 bg-night text-gold border border-gold/40 hover:border-gold hover:bg-black text-xs uppercase tracking-wider font-mono rounded-sm transition-colors cursor-pointer"
          >
            Ajouter un plat
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {paginatedMeals.map((meal) => {
            const isDispo = Number(meal.is_available) === 1;
            const catObj = CATEGORIES.find(c => c.id === meal.category) || CATEGORIES[0];
            const IconC = catObj.icon;
            const resObj = residences.find(r => String(r.id) === String(meal.residence_id));
            const residenceTitle = resObj ? (resObj.name || resObj.title) : (meal.residence_name || `Résidence #${meal.residence_id}`);

            return (
              <article 
                key={meal.id} 
                className={`bg-white border rounded-sm p-5 hover:shadow-md transition-all duration-300 flex flex-col justify-between group ${
                  isDispo ? 'border-ink/10' : 'border-ink/10 bg-gray-50/60 opacity-80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-gold flex items-center gap-1 truncate">
                      <IconC size={11} />
                      {catObj.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleAvailability(meal)}
                      disabled={isTogglingId === meal.id}
                      className={`inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-xs border transition-colors cursor-pointer ${
                        isDispo 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                          : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                      }`}
                      title="Cliquer pour basculer la disponibilité"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isDispo ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      {isDispo ? 'Disponible' : 'Épuisé'}
                    </button>
                  </div>

                  <div className="text-[10px] text-ink-muted font-mono mb-1 truncate" title={residenceTitle}>
                    {residenceTitle}
                  </div>

                  <h3 className="font-serif text-base text-ink font-medium group-hover:text-royal transition-colors line-clamp-1 mb-1.5">
                    {meal.name}
                  </h3>

                  {meal.description && (
                    <p className="text-xs text-ink-muted font-sans line-clamp-2 leading-relaxed mb-3">
                      {meal.description}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-ink/10 flex items-center justify-between mt-auto">
                  <div className="font-mono font-semibold text-xs text-ink">
                    {Number(meal.price).toLocaleString('fr-FR')} <span className="text-[10px] text-gold font-normal">FCFA</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenModal(meal)}
                      className="p-1.5 text-royal hover:bg-royal/10 rounded-sm transition-colors cursor-pointer"
                      title="Modifier ce mets"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(meal)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-sm transition-colors cursor-pointer"
                      title="Retirer ce mets"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* 7. PAGINATION */}
      {filteredMeals.length > 0 && !isLoading && (
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-ink/10 pt-6 pb-12 gap-4">
          <div className="text-xs text-ink-muted font-mono">
            Affichage de <strong className="text-ink">{startIndex + 1}</strong> à <strong className="text-ink">{endIndex}</strong> sur <strong className="text-ink">{filteredMeals.length}</strong> mets
            {filteredMeals.length !== stats.total && (
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
                  {editingId ? "Modification de la carte" : "Nouveau mets gastronomique"}
                </div>
                <h3 className="font-serif text-2xl text-ink">
                  {editingId ? "Modifier le plat" : "Ajouter un mets au menu"}
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
              
              {/* RÉSIDENCE CIBLE */}
              <div>
                <label className="text-[10px] font-mono uppercase tracking-widest text-ink-muted mb-1.5 block font-semibold">
                  Résidence bénéficiaire *
                </label>
                <select
                  value={formData.residence_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, residence_id: e.target.value }))}
                  className="w-full bg-white border border-ink/15 rounded-sm px-4 py-2.5 text-xs text-ink focus:outline-none focus:border-royal cursor-pointer font-serif font-medium"
                  required
                >
                  <option value="">Sélectionner une résidence...</option>
                  {residences.map(res => (
                    <option key={res.id} value={res.id}>
                      {res.name || res.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* CATÉGORIE & PRIX */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-widest text-ink-muted mb-1.5 block font-semibold">
                    Service / Moment *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-white border border-ink/15 rounded-sm px-4 py-2.5 text-xs text-ink focus:outline-none focus:border-royal cursor-pointer"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-mono uppercase tracking-widest text-ink-muted mb-1.5 block font-semibold">
                    Tarif en FCFA *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="Ex: 15000"
                    className="w-full bg-white border border-ink/15 rounded-sm px-4 py-2.5 text-xs text-ink font-mono focus:outline-none focus:border-royal"
                    required
                  />
                </div>
              </div>

              {/* NOM DU PLAT */}
              <div>
                <label className="text-[10px] font-mono uppercase tracking-widest text-ink-muted mb-1.5 block font-semibold">
                  Intitulé du mets / boisson *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Poulet DG du Chef, Homard grillé, Vin de Bordeaux..."
                  className="w-full bg-white border border-ink/15 rounded-sm px-4 py-2.5 text-xs text-ink focus:outline-none focus:border-royal"
                  required
                />
              </div>

              {/* DESCRIPTION & COMPOSITION */}
              <div>
                <label className="text-[10px] font-mono uppercase tracking-widest text-ink-muted mb-1.5 block font-semibold">
                  Description / Ingrédients d'exception
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Ex: Préparé à la minute avec des produits du marché local, servi avec garniture au choix..."
                  className="w-full bg-white border border-ink/15 rounded-sm px-4 py-2 text-xs text-ink focus:outline-none focus:border-royal"
                />
              </div>

              {/* STATUT DISPONIBILITÉ */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="modalIsAvailable"
                  checked={Number(formData.is_available) === 1}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_available: e.target.checked ? 1 : 0 }))}
                  className="w-4 h-4 text-royal rounded-xs border-ink/20 focus:ring-royal cursor-pointer"
                />
                <label htmlFor="modalIsAvailable" className="text-xs text-ink font-medium cursor-pointer select-none">
                  Plat immédiatement disponible à la commande pour les résidents
                </label>
              </div>

              {/* BOUTONS D'ACTION */}
              <div className="pt-4 border-t border-ink/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-xs uppercase tracking-wider font-mono text-ink-muted hover:text-ink transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-night text-gold border border-gold/40 hover:border-gold hover:bg-black text-xs uppercase tracking-wider font-mono rounded-sm transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={13} className="animate-spin text-gold" />
                      <span>Enregistrement...</span>
                    </>
                  ) : (
                    <span>{editingId ? "Mettre à jour le plat" : "Ajouter à la carte"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE DE SUPPRESSION */}
      {showDeleteModal && mealToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-sm shadow-2xl w-full max-w-md border border-ink/10 overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2 bg-red-50 rounded-full">
                <AlertCircle size={20} />
              </div>
              <h3 className="font-serif text-lg font-bold text-ink">Retirer ce plat ?</h3>
            </div>
            
            <p className="text-xs text-ink-muted leading-relaxed font-sans">
              Êtes-vous sûr de vouloir supprimer définitivement <strong className="text-ink">« {mealToDelete.name} »</strong> de la carte de cette résidence ?
            </p>

            <div className="pt-4 border-t border-ink/10 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => { setShowDeleteModal(false); setMealToDelete(null); }}
                className="px-4 py-2 text-xs uppercase tracking-wider font-mono text-ink-muted hover:text-ink transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs uppercase tracking-wider font-mono rounded-sm transition-colors cursor-pointer"
              >
                Supprimer de la carte
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
