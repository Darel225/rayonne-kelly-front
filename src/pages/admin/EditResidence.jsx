import { useState, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Image as ImageIcon, Trash2, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import Button from '../../components/common/Button';
import api from '../../services/api';

const BACKEND_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1').replace('/api/v1', '');


const STATUS_OPTIONS = ['Disponible', 'Réservée', 'En révision', 'Maintenance'];
const CATEGORY_OPTIONS = ['Prestige', 'Penthouse', 'Villa de luxe', 'Appartement'];

export default function EditResidence() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [initialDataId, setInitialDataId] = useState(id);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const initialFormRef = useRef(null);

  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [deletedImageIds, setDeletedImageIds] = useState([]);

  const [formData, setFormData] = useState({
    name: '', category: '', description: '', location: '',
    capacity: 1, rooms: 1, amenities: [], price: 0,
    status: 'Disponible', address: ''
  });

  const [availableAmenities, setAvailableAmenities] = useState({});
  const [amenitiesError, setAmenitiesError] = useState(null);

  // Fetch amenities
  useEffect(() => {
    let isMounted = true;
    const fetchAmenities = async () => {
      try {
        const response = await api.get('/amenities');
        const data = Array.isArray(response) ? response : (response.data || []);
        
        if (isMounted) {
          const grouped = {};
          data.forEach(item => {
            const cat = item.category || 'Autres';
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(item);
          });
          setAvailableAmenities(grouped);
        }
      } catch (err) {
        if (isMounted) setAmenitiesError("Impossible de charger les équipements.");
      }
    };
    fetchAmenities();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchResidence = async () => {
      try {
        const response = await api.get(`/admin/residences/${id}`);
        if (cancelled) return;
        
        const row = response;
        
        if (!row || typeof row !== 'object' || !row.id) {
          setFetchError(true);
          return;
        }
        
        let imgUrl = row.cover_image_url || 
          (Array.isArray(row.images) && row.images.find(img => img.is_cover)?.image_url) || 
          (Array.isArray(row.images) && row.images[0]?.image_url) || 
          '';
          
        if (typeof imgUrl === 'string' && imgUrl.startsWith('/')) {
          imgUrl = `${BACKEND_URL}${imgUrl}`;
        }
        
        let parsedAmenities = [];
        if (Array.isArray(row.amenities)) {
          parsedAmenities = row.amenities.map(am => typeof am === 'object' ? Number(am.id) : Number(am)).filter(id => !isNaN(id));
        } else if (typeof row.amenities === 'string') {
          try {
            const temp = JSON.parse(row.amenities);
            if (Array.isArray(temp)) {
              parsedAmenities = temp.map(am => typeof am === 'object' ? Number(am.id) : Number(am)).filter(id => !isNaN(id));
            }
          } catch (e) {
            parsedAmenities = [];
          }
        }
        
        let existingImgs = [];
        if (Array.isArray(row.images) && row.images.length > 0) {
          existingImgs = [...row.images]
            .sort((a, b) => Number(b?.is_cover ?? 0) - Number(a?.is_cover ?? 0))
            .map((img) => {
              if (!img) return null;
              const raw = typeof img === 'string' ? img : img?.image_url;
              if (typeof raw !== 'string') return null;
              const url = raw.trim();
              const finalUrl = url.startsWith('/') ? `${BACKEND_URL}${url}` : url;
              return {
                id: typeof img === 'object' ? img.id : null,
                image_url: finalUrl
              };
            })
            .filter(img => img && img.image_url);
        } else if (imgUrl) {
          existingImgs = [{ id: null, image_url: imgUrl }];
        }
        setExistingImages(existingImgs);

        const newFormData = {
          name: row.name ?? '',
          category: row.property_type ?? row.category ?? 'Prestige',
          description: row.description ?? '',
          location: row.district || row.city || row.address || '',
          capacity: Number(row.max_guests ?? row.guests_capacity) || 1,
          rooms: Number(row.rooms_count) || 1,
          amenities: parsedAmenities,
          price: Number(row.price_per_night) || 0,
          status: Number(row.is_active) === 1 ? 'Disponible' : 'En révision',
          address: row.address ?? ''
        };
        setFormData(newFormData);
        initialFormRef.current = newFormData;
        setInitialDataId(String(row.id ?? id));
        setIsLoading(false);
      } catch (err) {
        if (!cancelled) {
          setFetchError(true);
          setIsLoading(false);
        }
      }
    };
    fetchResidence();
    return () => { cancelled = true; };
  }, [id]);

  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const filesArray = Array.from(e.target.files).map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    setNewImages(prev => [...prev, ...filesArray]);
    
    // Reset the input value so the same file can be uploaded again if needed
    e.target.value = '';
  };

  const handleRemoveExistingImage = (idToRemove, index) => {
    if (idToRemove) {
      setDeletedImageIds(prev => [...prev, idToRemove]);
    }
    setExistingImages(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleRemoveNewImage = (indexToRemove) => {
    setNewImages(prev => {
      const copy = [...prev];
      const removed = copy.splice(indexToRemove, 1)[0];
      if (removed && removed.preview) URL.revokeObjectURL(removed.preview);
      return copy;
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[50vh] text-center">
        <p className="text-lg text-ink font-medium mb-4">Chargement des données...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[50vh] text-center">
        <p className="text-lg text-ink font-medium mb-4">Résidence introuvable.</p>
        <Link to="/admin/residences" className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-ink-muted hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Retour au portfolio
        </Link>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox' && name === 'amenities') {
      const numericId = Number(value);
      setFormData(prev => ({
        ...prev,
        amenities: checked 
          ? [...prev.amenities, numericId]
          : prev.amenities.filter(item => item !== numericId)
      }));
    } else if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? Number(value) : value
      }));
    }
  };

  const toApiPayload = (f) => ({
    name: (f.name ?? '').trim(),
    property_type: f.category,
    description: f.description,
    price_per_night: Number(f.price),
    max_guests: Number(f.capacity),
    rooms_count: Number(f.rooms),
    district: f.location,
    address: f.address,
    is_active: f.status === 'Disponible' ? 1 : 0,
  });

  const handleSave = async () => {
    if (isSubmitting) return;
    if (!initialFormRef.current) return;

    const currentPayload = toApiPayload(formData);
    const initialPayload = toApiPayload(initialFormRef.current);

    const payload = {};
    Object.keys(currentPayload).forEach(key => {
      if (currentPayload[key] !== initialPayload[key]) {
        payload[key] = currentPayload[key];
      }
    });

    const amenitiesChanged = JSON.stringify([...formData.amenities].sort()) !== JSON.stringify([...(initialFormRef.current.amenities || [])].sort());
    const imagesChanged = deletedImageIds.length > 0 || newImages.length > 0;

    if (Object.keys(payload).length === 0 && !amenitiesChanged && !imagesChanged) {
      toast.info("Aucune modification à enregistrer.");
      return;
    }

    if ('name' in payload && !payload.name) {
      toast.error("Le nom de la résidence ne peut pas être vide.");
      return;
    }
    if ('price_per_night' in payload && (!Number.isFinite(payload.price_per_night) || payload.price_per_night <= 0)) {
      toast.error("Le tarif par nuitée doit être supérieur à 0.");
      return;
    }
    if ('max_guests' in payload && (!Number.isInteger(payload.max_guests) || payload.max_guests < 1)) {
      toast.error("La capacité d'accueil doit être au moins de 1.");
      return;
    }
    if ('rooms_count' in payload && (!Number.isInteger(payload.rooms_count) || payload.rooms_count < 1)) {
      toast.error("Le nombre de pièces doit être au moins de 1.");
      return;
    }

    try {
      setIsSubmitting(true);
      
      if (Object.keys(payload).length > 0) {
        await api.put(`/residences/${id}`, payload);
      }
      
      if (amenitiesChanged) {
        try {
          await api.post(`/residences/${id}/amenities`, { amenity_ids: formData.amenities });
        } catch (err) {
          console.error("Erreur amenities", err);
          toast.error("Résidence mise à jour, mais erreur sur les équipements.");
          setIsSubmitting(false);
          return;
        }
      }
      
      let imageUpdateFailed = false;
      if (deletedImageIds.length > 0) {
        await Promise.allSettled(
          deletedImageIds.map(imageId => 
            api.delete(`/residences/${id}/images/${imageId}`).catch(e => {
              console.error("Error deleting image", e);
              imageUpdateFailed = true;
            })
          )
        );
      }

      if (newImages.length > 0) {
        await Promise.allSettled(
          newImages.map(imgObj => {
            const uploadData = new FormData();
            uploadData.append('image', imgObj.file);
            return api.post(`/residences/${id}/images`, uploadData, {
              headers: { 'Content-Type': undefined } // Laisse Axios mettre le boundary
            }).catch(e => {
              console.error("Error uploading image", e);
              imageUpdateFailed = true;
            });
          })
        );
      }

      if (imageUpdateFailed) {
        toast.warning("Résidence mise à jour, mais certaines images n'ont pas pu être traitées.");
      } else {
        toast.success("Résidence mise à jour avec succès.");
      }

      setNewImages([]);
      setDeletedImageIds([]);
      initialFormRef.current = { ...formData };
      navigate('/admin/residences');
    } catch (error) {
      const msg = error.response?.data?.error || error.response?.data?.message;
      if (error.response?.status === 409) {
        toast.error(msg || "Ce nom ou cette référence existe déjà.");
      } else if (error.response?.status === 404) {
        toast.error("Résidence introuvable.");
      } else {
        toast.error(msg || "Connexion impossible au serveur.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (isDeleting) return;

    try {
      setIsDeleting(true);
      await api.delete(`/residences/${id}`);
      toast.success("Résidence supprimée.");
      navigate('/admin/residences');
    } catch (error) {
      const msg = error.response?.data?.error || error.response?.data?.message;
      toast.error(msg || "Impossible de supprimer la résidence.");
      setIsDeleting(false);
    }
  };

  const inputClass = "w-full bg-white border border-ink/15 rounded-[1px] px-4 py-2 text-sm focus:outline-none focus:border-royal";
  const labelClass = "text-[10px] uppercase tracking-widest text-ink-muted mb-2 block";

  return (
    <div className="max-w-7xl mx-auto pb-16">
      {/* Top back link */}
      <Link to="/admin/residences" className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-ink-muted hover:text-ink mb-6">
        <ArrowLeft className="h-4 w-4" /> Retour au portfolio
      </Link>

      {/* Header section */}
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-royal">
        <span className="w-1.5 h-1.5 bg-royal rounded-full" aria-hidden="true"></span>
        Administration du domaine
      </div>
      
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mt-1 pb-6 border-b border-ink/10">
        <div>
          <h1 className="font-serif text-4xl text-ink">Édition : {formData.name}</h1>
          <div className="font-mono text-[10px] uppercase tracking-widest text-ink-muted mt-2">RÉF. {initialDataId}</div>
        </div>
        <div className="flex flex-wrap gap-3 mt-4 sm:mt-0">
          {/* TODO: persist changes */}
          <Button 
            variant="royal" 
            className="uppercase tracking-widest text-xs whitespace-nowrap px-4 py-2.5"
            onClick={handleSave}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mt-10">
        
        {/* Left column */}
        <div className="lg:col-span-2 space-y-10">
          
          {/* Galerie Média */}
          <section>
            <h2 className="font-mono text-[10px] uppercase tracking-widest text-gold mb-4">Galerie Média</h2>
            <div className="max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {existingImages.map((img, idx) => (
                  <div key={`exist-${idx}`} className="relative h-32 rounded-sm overflow-hidden group">
                    <img src={img.image_url} alt={`${formData.name} ${idx + 1}`} className="object-cover w-full h-full" />
                    
                    <button 
                      type="button" 
                      onClick={() => handleRemoveExistingImage(img.id, idx)}
                      aria-label="Supprimer l'image" 
                      className="absolute top-2 right-2 z-10 bg-red-600 text-white p-1.5 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 shadow-sm"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>

                    <button type="button" aria-label="Remplacer l'image" className="absolute inset-0 bg-night/0 hover:bg-night/50 transition-colors flex items-center justify-center opacity-0 hover:opacity-100 text-white text-xs uppercase tracking-widest pointer-events-none">
                      {/* Remplacer visuel */}
                    </button>
                  </div>
                ))}

                {newImages.map((imgObj, idx) => (
                  <div key={`new-${idx}`} className="relative h-32 rounded-sm overflow-hidden group border-2 border-royal/30">
                    <img src={imgObj.preview} alt={`Nouvelle image ${idx + 1}`} className="object-cover w-full h-full" />
                    
                    <button 
                      type="button" 
                      onClick={() => handleRemoveNewImage(idx)}
                      aria-label="Supprimer la nouvelle image" 
                      className="absolute top-2 right-2 z-10 bg-red-600 text-white p-1.5 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 shadow-sm"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}

                <button type="button" onClick={() => fileInputRef.current?.click()} className="relative h-32 rounded-sm overflow-hidden border-2 border-dashed border-ink/15 hover:border-royal hover:bg-royal/5 transition-colors flex flex-col items-center justify-center gap-2 text-ink-muted hover:text-royal">
                  <ImageIcon className="h-5 w-5" />
                  <span className="text-xs uppercase tracking-widest text-center px-2">Gérer les photos<br/>/ Ajouter</span>
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} multiple accept="image/*" className="hidden" />
              </div>
            </div>
          </section>

          {/* Informations Générales */}
          <section>
            <h2 className="font-mono text-[10px] uppercase tracking-widest text-gold mb-4">Informations Générales (L'Esprit du Lieu)</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="name" className={labelClass}>Nom de la résidence</label>
                <input id="name" name="name" type="text" value={formData.name} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label htmlFor="category" className={labelClass}>Catégorie</label>
                <select id="category" name="category" value={formData.category} onChange={handleChange} className={inputClass}>
                  {CATEGORY_OPTIONS.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="description" className={labelClass}>Description Éditoriale</label>
              <textarea id="description" name="description" rows={6} value={formData.description} onChange={handleChange} className={inputClass}></textarea>
            </div>
          </section>

          {/* Caractéristiques & Équipements */}
          <section>
            <h2 className="font-mono text-[10px] uppercase tracking-widest text-gold mb-4">Caractéristiques & Équipements</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
              <div>
                <label htmlFor="location" className={labelClass}>Localisation</label>
                <input id="location" name="location" type="text" value={formData.location} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label htmlFor="capacity" className={labelClass}>Capacité d'accueil</label>
                <input id="capacity" name="capacity" type="number" min="1" value={formData.capacity} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label htmlFor="rooms" className={labelClass}>Pièces</label>
                <input id="rooms" name="rooms" type="number" min="1" value={formData.rooms} onChange={handleChange} className={inputClass} />
              </div>
            </div>
            
            <fieldset>
              <legend className="text-xs uppercase tracking-widest text-ink-muted mb-4">Équipements</legend>
              {amenitiesError && <p className="text-red-500 text-xs mb-4">{amenitiesError}</p>}
              <div className="space-y-6">
                {Object.keys(availableAmenities).length === 0 && !amenitiesError ? (
                  <p className="text-xs text-ink-muted">Chargement des équipements...</p>
                ) : (
                  Object.entries(availableAmenities).map(([category, items]) => (
                    <fieldset key={category}>
                      <legend className="text-[10px] font-mono uppercase tracking-widest text-ink-muted mb-2">{category}</legend>
                      <div className="flex flex-wrap gap-3">
                        {items.map((item) => (
                          <label key={item.id} className="inline-flex items-center gap-2 border border-ink/15 rounded-full px-3 py-1.5 text-sm cursor-pointer has-[:checked]:border-royal has-[:checked]:text-royal hover:bg-white/50 transition-colors">
                            <input 
                              type="checkbox" 
                              name="amenities" 
                              value={item.id} 
                              checked={formData.amenities.includes(Number(item.id))} 
                              onChange={handleChange} 
                              className="accent-royal"
                            />
                            {item.name}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  ))
                )}
              </div>
            </fieldset>
          </section>

          {/* Localisation & Carte */}
          <section>
            <h2 className="font-mono text-[10px] uppercase tracking-widest text-gold mb-4">Localisation & Carte</h2>
            <div>
              <label htmlFor="address" className={labelClass}>Adresse</label>
              <input id="address" name="address" type="text" value={formData.address} onChange={handleChange} className={inputClass} />
              <p className="text-[11px] text-ink-muted mt-2">📍 La géolocalisation et la carte interactive s'actualiseront automatiquement à partir de cette adresse (via le service géospatial).</p>
            </div>
            <div className="w-full h-64 bg-gray-50 border border-ink/10 rounded-sm mt-4 flex flex-col items-center justify-center text-xs text-ink-muted gap-2">
              <MapPin className="h-5 w-5 text-ink-muted/50" />
              Aperçu de la carte interactive — Lié à l'adresse
            </div>
          </section>

        </div>

        {/* Right column - Control Panel */}
        <div>
          <div className="bg-white p-6 sm:p-8 border border-ink/10 rounded-sm space-y-8 sticky top-6">
            <h2 className="font-mono text-[10px] uppercase tracking-widest text-gold">Paramètres Exécutifs</h2>
            
            <div>
              <label htmlFor="status" className={labelClass}>Statut Opérationnel</label>
              <select id="status" name="status" value={formData.status} onChange={handleChange} className={inputClass}>
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="price" className={labelClass}>Tarif / Nuitée</label>
              <div className="relative">
                <input id="price" name="price" type="number" min="0" value={formData.price} onChange={handleChange} className={`${inputClass} pr-16`} />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-widest text-ink-muted pointer-events-none">
                  FCFA
                </div>
              </div>
            </div>
            

            <div className="border-t border-red-200 pt-6 mt-2">
              <div className="text-xs text-red-600 uppercase tracking-widest mb-3 font-medium">Zone de danger</div>
              <button 
                type="button" 
                onClick={() => setShowDeleteModal(true)}
                disabled={isDeleting}
                className="w-full text-[10px] sm:text-xs uppercase tracking-widest bg-red-50 text-red-600 border border-red-200 rounded-[1px] py-3 hover:bg-red-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="h-4 w-4" /> 
                {isDeleting ? 'Suppression...' : 'Supprimer définitivement'}
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* MODALE DE CONFIRMATION DE SUPPRESSION */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md shadow-2xl flex flex-col">
            {/* En-tête */}
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="text-sm font-medium uppercase tracking-widest text-red-600">
                Confirmation requise
              </h3>
            </div>
            
            {/* Corps */}
            <div className="px-6 py-6 text-gray-600 text-sm leading-relaxed">
              Êtes-vous sûr de vouloir supprimer <strong>DÉFINITIVEMENT</strong> cette résidence ?<br/><br/>
              Cette action est irréversible. Les données ainsi que toutes les photographies associées seront définitivement effacées du serveur.
            </div>
            
            {/* Pied / Actions */}
            <div className="px-6 py-5 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="px-5 py-2.5 text-xs uppercase tracking-widest text-gray-500 hover:text-gray-800 transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-5 py-2.5 text-xs uppercase tracking-widest bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? 'Suppression...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
