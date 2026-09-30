import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Image as ImageIcon, Trash2, CheckCircle, AlertTriangle } from 'lucide-react';
import Button from '../../components/common/Button';
import api from '../../services/api';

const STATUS_OPTIONS = ['Disponible', 'Réservée', 'En révision', 'Maintenance'];
const CATEGORY_OPTIONS = ['Prestige', 'Penthouse', 'Villa de luxe', 'Appartement'];
const CITY_OPTIONS = ['ABIDJAN', 'ASSINIE', 'Autre'];

export default function CreateResidence() {
  const [formData, setFormData] = useState({
    name: '', category: CATEGORY_OPTIONS[0], city: CITY_OPTIONS[0], description: '',
    capacity: 1, rooms: 1, amenities: [], price: 0,
    status: 'Disponible', address: '', images: [],
    min_stay: 1, check_in_time: '15:00', check_out_time: '11:00'
  });

  const [availableAmenities, setAvailableAmenities] = useState({});
  const [amenitiesError, setAmenitiesError] = useState(null);
  
  const [submissionResult, setSubmissionResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageError, setImageError] = useState('');
  
  const fileInputRef = useRef(null);
  const imagesRef = useRef(formData.images);

  useEffect(() => {
    imagesRef.current = formData.images;
  }, [formData.images]);

  // Cleanup object URLs to avoid memory leaks on unmount
  useEffect(() => {
    return () => {
      imagesRef.current.forEach(imgObj => {
        if (imgObj && imgObj.preview) URL.revokeObjectURL(imgObj.preview);
      });
    };
  }, []);

  // Fetch amenities
  useEffect(() => {
    let isMounted = true;
    const fetchAmenities = async () => {
      try {
        const response = await api.get('/amenities');
        const data = Array.isArray(response) ? response : (response.data || []);
        
        if (isMounted) {
          // Group by category
          const grouped = {};
          data.forEach(item => {
            const cat = item.category || 'Autres';
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(item);
          });
          setAvailableAmenities(grouped);
        }
      } catch (err) {
        if (isMounted) setAmenitiesError("Impossible de charger les équipements. Vous pouvez continuer sans.");
      }
    };
    fetchAmenities();
    return () => { isMounted = false; };
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox' && name === 'amenities') {
      const numericId = Number(value);
      setFormData(prev => ({
        ...prev,
        amenities: checked 
          ? [...prev.amenities, numericId]
          : prev.amenities.filter(id => id !== numericId)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? Number(value) : value
      }));
    }
  };

  const handleFileSelect = (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setImageError('');
    const newImages = [];
    
    Array.from(e.target.files).forEach(file => {
      if (!file.type.startsWith('image/')) {
        setImageError("Seules les images sont acceptées.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setImageError("Chaque image doit faire moins de 5 Mo.");
        return;
      }
      newImages.push({
        file,
        preview: URL.createObjectURL(file)
      });
    });
    
    if (newImages.length > 0) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...newImages]
      }));
    }
    
    e.target.value = '';
  };

  const handleRemoveImage = (indexToRemove) => {
    const imgObj = formData.images[indexToRemove];
    if (imgObj && imgObj.preview) URL.revokeObjectURL(imgObj.preview);

    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    // 1. Validation locale
    if (!formData.name || !formData.description || !formData.city || !formData.address || formData.price < 0 || !formData.category || formData.min_stay < 1) {
      setSubmissionResult({ type: 'error', message: "Veuillez remplir tous les champs obligatoires correctement." });
      return;
    }

    setIsSubmitting(true);
    setSubmissionResult({ type: 'loading', message: "Création de la résidence..." });
    let newResidenceId = null;

    // 2. Appel 1 : Création de la résidence
    try {
      const slug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const payload = {
        name: formData.name,
        slug: slug,
        description: formData.description,
        district: formData.city,
        address: formData.address,
        property_type: formData.category,
        price_per_night: Number(formData.price),
        max_guests: Number(formData.capacity),
        rooms_count: Number(formData.rooms),
        min_stay: Number(formData.min_stay),
        check_in_time: formData.check_in_time || '15:00',
        check_out_time: formData.check_out_time || '11:00'
      };

      const resResponse = await api.post('/residences', payload);
      const createdRes = resResponse.data ? resResponse.data : resResponse; 
      newResidenceId = createdRes.id;
      
    } catch (err) {
      console.error(err);
      setSubmissionResult({ type: 'error', message: "Erreur lors de la création de la résidence." });
      setIsSubmitting(false);
      return;
    }

    // 3. Appel 2 : Upload des images (s'il y en a)
    let imageFailed = false;
    let coverFailed = false;
    let imagesSuccessCount = 0;
    let imageErrorMsg = '';
    const totalImages = formData.images.length;

    if (totalImages > 0) {
      setSubmissionResult({ type: 'loading', message: "Upload des images en cours..." });
      
      const uploadResults = await Promise.allSettled(
        formData.images.map((imgObj, index) => {
          const uploadData = new FormData();
          uploadData.append('image', imgObj.file);
          uploadData.append('is_cover', index === 0 ? '1' : '0');
          
          return api.post(`/residences/${newResidenceId}/images`, uploadData, {
            headers: {
              'Content-Type': undefined
            }
          }).then(res => ({ index, data: res })).catch(err => Promise.reject({ index, err }));
        })
      );

      const failed = uploadResults.filter(r => r.status === 'rejected');
      imagesSuccessCount = totalImages - failed.length;
      
      if (failed.length > 0) {
        imageFailed = true;
        coverFailed = failed.some(f => f.reason.index === 0);
        
        console.error("Erreurs images:", failed.map(f => f.reason.err));
        
        const firstErr = failed[0].reason.err;
        const rawMsg = firstErr.response?.data?.message || firstErr.message || "";
        const isTechnical = /Exception|Stack trace|SQL|Syntax error|PDO|php/i.test(rawMsg);
        imageErrorMsg = isTechnical ? "Format ou taille de fichier invalide" : rawMsg;
      }
    }

    // 4. Appel 3 : Attachement des commodités
    let amenitiesFailed = false;
    if (formData.amenities.length > 0) {
      try {
        setSubmissionResult({ type: 'loading', message: "Attachement des équipements..." });
        await api.post(`/residences/${newResidenceId}/amenities`, {
          amenity_ids: formData.amenities
        });
      } catch (err) {
        console.error("Erreur amenities", err);
        amenitiesFailed = true;
      }
    }

    // 5. Finalisation
    if (imageFailed || amenitiesFailed) {
      let failureDetail = "";
      
      if (imageFailed) {
        if (imagesSuccessCount === 0) {
          failureDetail += `toutes les images ont échoué (${imageErrorMsg})`;
        } else {
          failureDetail += `${imagesSuccessCount}/${totalImages} images uploadées (${imageErrorMsg})`;
        }
        if (coverFailed) {
          failureDetail += ` (⚠️ Image de couverture non définie)`;
        }
      }

      if (imageFailed && amenitiesFailed) failureDetail += " et ";
      if (amenitiesFailed) failureDetail += "les équipements ont échoué";
      
      setSubmissionResult({ type: 'partial', message: `Résidence créée, mais ${failureDetail}. Vous pouvez finaliser sur la page d'édition.` });
    } else {
      setSubmissionResult({ type: 'success', message: "La résidence a été publiée avec succès." });
      // Réinitialiser le formulaire et nettoyer les blobs
      formData.images.forEach(imgObj => {
        if (imgObj && imgObj.preview) URL.revokeObjectURL(imgObj.preview);
      });
      setFormData({
        name: '', category: CATEGORY_OPTIONS[0], city: CITY_OPTIONS[0], description: '',
        capacity: 1, rooms: 1, amenities: [], price: 0,
        status: 'Disponible', address: '', images: [],
        min_stay: 1, check_in_time: '15:00', check_out_time: '11:00'
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
    }

    setIsSubmitting(false);
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
        NOUVEAU DOMAINE
      </div>
      
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mt-1 pb-6 border-b border-ink/10">
        <div>
          <h1 className="font-serif text-4xl text-ink mt-1">Enregistrer une nouvelle résidence</h1>
        </div>
        <div className="flex flex-wrap gap-3 mt-4 sm:mt-0 items-center">
          {submissionResult && (
            <div 
              role="status" 
              aria-live="polite" 
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${
                submissionResult.type === 'success' 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : submissionResult.type === 'partial'
                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                    : submissionResult.type === 'error'
                      ? 'bg-red-50 text-red-800 border border-red-200'
                      : 'text-royal'
              }`}
            >
              {submissionResult.type === 'success' && <CheckCircle size={16} />}
              {submissionResult.type === 'partial' && <AlertTriangle size={16} />}
              <span>{submissionResult.message}</span>
            </div>
          )}
        </div>
      </div>

      <form id="create-residence-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-12 mt-10">
        
        {/* Left column */}
        <div className="lg:col-span-2 space-y-10">
          
          {/* Galerie Média */}
          <section>
            <h2 className="font-mono text-[10px] uppercase tracking-widest text-gold mb-4">Galerie Média</h2>
            {imageError && <p className="text-red-500 text-xs mb-4">{imageError}</p>}
            <div className="max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {formData.images.map((imgObj, idx) => (
                  <div key={idx} className="relative h-32 rounded-sm overflow-hidden group">
                    <img src={imgObj.preview} alt={`Preview ${idx + 1}`} className="object-cover w-full h-full" />
                    
                    <button 
                      type="button" 
                      onClick={() => handleRemoveImage(idx)}
                      aria-label="Supprimer l'image" 
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
              <div className="sm:col-span-3">
                <label htmlFor="name" className={labelClass}>Nom de la résidence</label>
                <input id="name" name="name" type="text" required value={formData.name} onChange={handleChange} className={inputClass} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="category" className={labelClass}>Catégorie</label>
                <select id="category" name="category" required value={formData.category} onChange={handleChange} className={inputClass}>
                  {CATEGORY_OPTIONS.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-1">
                <label htmlFor="city" className={labelClass}>Ville</label>
                <select id="city" name="city" required value={formData.city} onChange={handleChange} className={inputClass}>
                  {CITY_OPTIONS.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="description" className={labelClass}>Description Éditoriale</label>
              <textarea id="description" name="description" rows={6} required value={formData.description} onChange={handleChange} className={inputClass}></textarea>
            </div>
          </section>

          {/* Caractéristiques & Équipements */}
          <section>
            <h2 className="font-mono text-[10px] uppercase tracking-widest text-gold mb-4">Caractéristiques & Équipements</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="capacity" className={labelClass}>Capacité d'accueil</label>
                <input id="capacity" name="capacity" type="number" min="1" required value={formData.capacity} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label htmlFor="rooms" className={labelClass}>Pièces</label>
                <input id="rooms" name="rooms" type="number" min="1" required value={formData.rooms} onChange={handleChange} className={inputClass} />
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
                              checked={formData.amenities.includes(item.id)} 
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

        </div>

        {/* Right column - Control Panel */}
        <div>
          <div className="bg-white p-6 sm:p-8 border border-ink/10 rounded-sm space-y-8 sticky top-6">
            <h2 className="font-mono text-[10px] uppercase tracking-widest text-gold">Paramètres Exécutifs</h2>
            
            <div>
              <label htmlFor="status" className={labelClass}>Statut Initial</label>
              <select id="status" name="status" required value={formData.status} onChange={handleChange} className={inputClass}>
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="price" className={labelClass}>Tarif / Nuitée</label>
              <div className="relative">
                <input id="price" name="price" type="number" min="0" required value={formData.price} onChange={handleChange} className={`${inputClass} pr-16`} />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-widest text-ink-muted pointer-events-none">
                  FCFA
                </div>
              </div>
            </div>

            <div className="border-t border-ink/10 pt-8 mt-8">
              <h3 className="font-mono text-[10px] uppercase tracking-widest text-gold mb-6">Conditions de Séjour</h3>
              
              <div className="space-y-6">
                <div>
                  <label htmlFor="min_stay" className={labelClass}>Séjour minimum (nuits)</label>
                  <input id="min_stay" name="min_stay" type="number" min="1" step="1" required value={formData.min_stay} onChange={handleChange} className={inputClass} />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="check_in_time" className={labelClass}>Arrivée (Check-in)</label>
                    <input id="check_in_time" name="check_in_time" type="time" required value={formData.check_in_time} onChange={handleChange} className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="check_out_time" className={labelClass}>Départ (Check-out)</label>
                    <input id="check_out_time" name="check_out_time" type="time" required value={formData.check_out_time} onChange={handleChange} className={inputClass} />
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <label htmlFor="address" className={labelClass}>Adresse</label>
              <input id="address" name="address" type="text" required value={formData.address} onChange={handleChange} className={inputClass} />
              <p className="text-xs text-ink-muted mt-2">La géolocalisation précise sera calculée automatiquement à l'enregistrement.</p>
            </div>

            <div className="pt-2">
              <Button type="submit" variant="royal" disabled={isSubmitting} className="w-full disabled:opacity-50">
                {isSubmitting ? 'Publication...' : 'Publier la résidence'}
              </Button>
              <p className="text-[10px] text-ink-muted mt-3">Lors de la publication, le système va créer la résidence, uploader sa photo de couverture et lui attacher ses équipements.</p>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
}
