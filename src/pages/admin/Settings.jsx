import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { 
  User, 
  ShieldCheck, 
  Lock, 
  KeyRound, 
  PhoneCall, 
  Mail, 
  Sparkles, 
  Sliders, 
  CheckCircle2, 
  AlertCircle, 
  Camera, 
  Save, 
  Eye, 
  EyeOff, 
  Loader2,
  Shield,
  Clock,
  Layers,
  Check
} from "lucide-react";
import api from "../../services/api";
import useAuthStore from "../../store/authStore";

const BACKEND_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1').replace('/api/v1', '');
const getImageUrl = (path) => {
  if (!path) return '';
  return path.startsWith('/') ? `${BACKEND_URL}${path}` : path;
};

// Schéma Zod flexible pour les identifiants : permet de modifier seulement l'e-mail ou de renouveler le mot de passe
const credentialsSchema = z.object({
  email: z.string().email("Adresse e-mail invalide"),
  currentPassword: z.string().optional().or(z.literal("")),
  newPassword: z.string().optional().or(z.literal("")),
  confirmPassword: z.string().optional().or(z.literal("")),
}).superRefine((data, ctx) => {
  const hasPasswordInput = Boolean(data.currentPassword || data.newPassword || data.confirmPassword);
  if (hasPasswordInput) {
    if (!data.currentPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Mot de passe actuel requis",
        path: ["currentPassword"],
      });
    }
    if (!data.newPassword || data.newPassword.length < 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "8 caractères minimum",
        path: ["newPassword"],
      });
    }
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Les mots de passe ne correspondent pas",
        path: ["confirmPassword"],
      });
    }
  }
});

const conciergeSchema = z.object({
  photo: z.any().optional(),
  hotline: z.string().min(8, "Numéro trop court"),
  email: z.string().email("Adresse e-mail invalide"),
});

export default function Settings() {
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'security', 'concierge', 'audit'

  // Affichage des mots de passe
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const credentialsForm = useForm({
    resolver: zodResolver(credentialsSchema),
    defaultValues: { email: "", currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const conciergeForm = useForm({
    resolver: zodResolver(conciergeSchema),
    defaultValues: { photo: "", hotline: "", email: "" },
  });

  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [existingPhoto, setExistingPhoto] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const fetchSettings = async () => {
      try {
        const response = await api.get('/settings');
        if (!cancelled) {
          conciergeForm.reset({
            hotline: response.concierge_phone || '',
            email: response.concierge_email || '',
            photo: ''
          });
          if (response.concierge_photo_path) {
            setExistingPhoto(getImageUrl(response.concierge_photo_path));
          }
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(error.response?.data?.error || error.response?.data?.message || "Impossible de charger les paramètres.");
        }
      } finally {
        if (!cancelled) setIsLoadingSettings(false);
      }
    };
    fetchSettings();
    return () => { cancelled = true; };
  }, [conciergeForm]);

  useEffect(() => {
    if (user?.email && !credentialsForm.formState.dirtyFields.email) {
      credentialsForm.reset({
        email: user.email,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    }
  }, [user?.email, credentialsForm]);

  const onCredentialsSubmit = async (data) => {
    const emailChanged = data.email.trim().toLowerCase() !== user?.email?.trim().toLowerCase();
    const passwordRequested = !!(data.currentPassword || data.newPassword || data.confirmPassword);

    if (!emailChanged && !passwordRequested) {
      toast.info("Aucune modification à enregistrer.");
      return;
    }

    if (passwordRequested) {
      if (!data.currentPassword || !data.newPassword || !data.confirmPassword) {
        toast.error("Veuillez remplir tous les champs de mot de passe.");
        return;
      }
      if (data.newPassword !== data.confirmPassword) {
        toast.error("Les nouveaux mots de passe ne correspondent pas.");
        return;
      }
      if (data.newPassword.length < 8) {
        toast.error("Le nouveau mot de passe doit contenir au moins 8 caractères.");
        return;
      }
      if (data.newPassword === data.currentPassword) {
        toast.error("Le nouveau mot de passe doit être différent de l'ancien.");
        return;
      }
    }

    let emailSuccess = true;

    if (emailChanged) {
      try {
        const normalizedEmail = data.email.trim().toLowerCase();
        await api.put('/admin/me', { email: normalizedEmail });
        toast.success("Adresse e-mail mise à jour.");
        setUser({ ...user, email: normalizedEmail });
        credentialsForm.reset({ ...credentialsForm.getValues(), email: normalizedEmail });
      } catch (error) {
        emailSuccess = false;
        console.error(error);
        if (error.response?.status === 409) {
          toast.error("Cet e-mail est déjà utilisé.");
        } else {
          toast.error(error.response?.data?.error || error.response?.data?.message || (error.response ? "Une erreur est survenue. Réessayez." : "Connexion impossible au serveur."));
        }
      }
    }

    if (passwordRequested && emailSuccess) {
      try {
        await api.put('/admin/password', {
          old_password: data.currentPassword,
          new_password: data.newPassword
        });
        toast.success("Mot de passe mis à jour avec succès.");
        credentialsForm.setValue('currentPassword', '');
        credentialsForm.setValue('newPassword', '');
        credentialsForm.setValue('confirmPassword', '');
      } catch (error) {
        console.error(error);
        const errorMsg = error.response?.data?.error || error.response?.data?.message || (error.response ? "Une erreur est survenue. Réessayez." : "Connexion impossible au serveur.");
        toast.error(errorMsg);
        if (error.response?.status === 422 && errorMsg.toLowerCase().includes('ancien')) {
          credentialsForm.setValue('currentPassword', '');
        }
      }
    }
  };

  const onConciergeSubmit = async (data) => {
    const dirtyFields = conciergeForm.formState.dirtyFields;
    const payload = {};
    if (dirtyFields.hotline) payload.concierge_phone = data.hotline;
    if (dirtyFields.email) payload.concierge_email = data.email;

    const hasPhoto = data.photo && data.photo.length > 0;

    if (Object.keys(payload).length === 0 && !hasPhoto) {
      toast.info("Aucune modification à enregistrer.");
      return;
    }

    try {
      if (hasPhoto) {
        const file = data.photo[0];
        if (!file.type.startsWith("image/")) {
          toast.error("Le fichier doit être une image.");
          return;
        }
        if (file.size > 2 * 1024 * 1024) {
          toast.error("L'image ne doit pas dépasser 2 Mo.");
          return;
        }

        const formData = new FormData();
        formData.append("photo", file);

        const res = await api.post('/settings/concierge-photo', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        if (res.data?.url) {
          setExistingPhoto(getImageUrl(res.data.url));
        }
      }

      if (Object.keys(payload).length > 0) {
        await api.put('/settings', payload);
      }
      
      toast.success("Coordonnées de conciergerie enregistrées.");
      conciergeForm.reset({ ...data, photo: '' });
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.error || error.response?.data?.message || (error.response ? "Une erreur est survenue. Réessayez." : "Connexion impossible au serveur."));
    }
  };

  const photo = conciergeForm.watch("photo");
  const previewUrl = photo && photo.length > 0 ? URL.createObjectURL(photo[0]) : null;
  
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Valeurs surveillées pour les KPIs
  const watchedHotline = conciergeForm.watch("hotline");
  const watchedConciergeEmail = conciergeForm.watch("email");

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      
      {/* 1. EN-TÊTE EXÉCUTIF */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-gold">Gouvernance Système & Privilèges Haute Direction</div>
          <h1 className="font-serif text-3xl text-ink mt-1">Paramètres & Conciergerie</h1>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono rounded-sm shadow-xs self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="uppercase tracking-wider font-semibold">Système Sécurisé • TLS/SSL Actif</span>
        </div>
      </div>

      {/* 2. KPIS DE SYNTHÈSE */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-sm border border-ink/10 shadow-xs">
          <div className="flex items-center justify-between text-ink-muted mb-2">
            <span className="font-mono text-[10px] uppercase tracking-wider">Compte Exécutif</span>
            <ShieldCheck size={16} className="text-gold" />
          </div>
          <div className="font-serif text-2xl text-ink">Direction Générale</div>
          <div className="text-[11px] text-ink-muted mt-1 font-mono truncate" title={user?.email}>
            {user?.email || "admin@rayonnekelly.ci"}
          </div>
        </div>

        <div className="bg-white p-5 rounded-sm border border-ink/10 shadow-xs">
          <div className="flex items-center justify-between text-ink-muted mb-2">
            <span className="font-mono text-[10px] uppercase tracking-wider">Sécurité des Accès</span>
            <Lock size={16} className="text-emerald-600" />
          </div>
          <div className="font-serif text-2xl text-emerald-700">Bcrypt & JWT</div>
          <div className="text-[11px] text-emerald-800/80 mt-1 font-sans">
            Sessions isolées & protégées
          </div>
        </div>

        <div className="bg-white p-5 rounded-sm border border-ink/10 shadow-xs">
          <div className="flex items-center justify-between text-ink-muted mb-2">
            <span className="font-mono text-[10px] uppercase tracking-wider">Hotline Conciergerie</span>
            <PhoneCall size={16} className="text-royal" />
          </div>
          <div className="font-serif text-2xl text-royal truncate" title={watchedHotline}>
            {watchedHotline || "24/7 Active"}
          </div>
          <div className="text-[11px] text-royal/80 mt-1 font-sans">
            Assistance directe résidents VIP
          </div>
        </div>

        <div className="bg-white p-5 rounded-sm border border-ink/10 shadow-xs">
          <div className="flex items-center justify-between text-ink-muted mb-2">
            <span className="font-mono text-[10px] uppercase tracking-wider">Desk VIP Privé</span>
            <Sparkles size={16} className="text-gold" />
          </div>
          <div className="font-serif text-2xl text-night truncate" title={watchedConciergeEmail}>
            {watchedConciergeEmail ? "Opérationnel" : "À configurer"}
          </div>
          <div className="text-[11px] text-ink-muted mt-1 font-mono truncate" title={watchedConciergeEmail}>
            {watchedConciergeEmail || "vip@rayonnekelly.ci"}
          </div>
        </div>
      </div>

      {/* 3. BARRE D'ONGLETS DE NAVIGATION */}
      <div className="border-b border-ink/10 flex items-center overflow-x-auto gap-2 sm:gap-4 pb-px">
        {[
          { id: 'all', label: 'Toutes les configurations', badge: '2 modules', icon: Sliders },
          { id: 'security', label: 'Sécurité & Identifiants', badge: 'Accès Maître', icon: KeyRound },
          { id: 'concierge', label: 'Conciergerie Privée 24/7', badge: 'Espace VIP', icon: Sparkles },
          { id: 'audit', label: 'Audit & Conformité', badge: 'Actif', icon: ShieldCheck }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          const IconComp = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-1 text-xs font-medium whitespace-nowrap transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                isActive 
                  ? 'border-gold text-ink font-semibold' 
                  : 'border-transparent text-ink-muted hover:text-ink hover:border-ink/20'
              }`}
            >
              <IconComp size={14} className={isActive ? 'text-gold' : 'text-ink-muted'} />
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                isActive ? 'bg-night text-gold' : 'bg-gray-100 text-gray-600'
              }`}>
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* 4. CONTENU PRINCIPAL PAR ONGLET */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* MODULE 1 : SÉCURITÉ & IDENTIFIANTS */}
        {(activeTab === 'all' || activeTab === 'security') && (
          <section className={`bg-white rounded-sm border border-ink/10 shadow-xs p-6 md:p-8 space-y-6 ${
            activeTab === 'security' ? 'lg:col-span-2 max-w-3xl mx-auto w-full' : ''
          }`}>
            <div className="border-b border-ink/10 pb-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-widest text-gold flex items-center gap-1.5">
                  <KeyRound size={12} />
                  Accès Haute Direction
                </span>
                <span className="inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-xs bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Privilège Maître
                </span>
              </div>
              <h2 className="font-serif text-xl text-ink mt-1">Sécurité & Identifiants</h2>
              <p className="text-xs text-ink-muted mt-1 font-sans">
                Mise à jour de l'adresse e-mail administrative et renouvellement de la clé d'authentification.
              </p>
            </div>

            <form onSubmit={credentialsForm.handleSubmit(onCredentialsSubmit)} className="space-y-5">
              
              {/* E-MAIL */}
              <div>
                <label className="text-[10px] font-mono uppercase tracking-widest text-ink-muted mb-1.5 block font-semibold">
                  Adresse e-mail administrateur *
                </label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                  <input
                    type="email"
                    {...credentialsForm.register("email")}
                    placeholder="direction@rayonnekelly.ci"
                    className="w-full bg-gray-50/70 border border-ink/15 rounded-sm pl-9 pr-4 py-2.5 text-xs text-ink placeholder:text-ink-muted focus:bg-white focus:outline-none focus:border-royal transition-colors font-mono"
                  />
                </div>
                {credentialsForm.formState.errors.email && (
                  <p className="mt-1 text-[11px] text-red-600 font-sans flex items-center gap-1">
                    <AlertCircle size={11} />
                    {credentialsForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              {/* ENCART D'AIDE RENOUVELLEMENT MOT DE PASSE */}
              <div className="p-3.5 bg-gray-50/70 border border-ink/10 rounded-sm">
                <div className="flex items-start gap-2.5">
                  <Lock size={14} className="text-gold shrink-0 mt-0.5" />
                  <div className="text-[11px] text-ink-muted leading-relaxed">
                    <strong className="text-ink font-medium">Renouvellement du mot de passe (optionnel) :</strong>
                    <br />
                    Laissez les champs ci-dessous vides si vous souhaitez uniquement modifier votre adresse e-mail.
                  </div>
                </div>
              </div>

              {/* MOT DE PASSE ACTUEL */}
              <div>
                <label className="text-[10px] font-mono uppercase tracking-widest text-ink-muted mb-1.5 block font-semibold">
                  Mot de passe actuel
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    {...credentialsForm.register("currentPassword")}
                    placeholder="Saisissez votre mot de passe actuel"
                    className="w-full bg-gray-50/70 border border-ink/15 rounded-sm pl-4 pr-10 py-2.5 text-xs text-ink placeholder:text-ink-muted focus:bg-white focus:outline-none focus:border-royal transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink cursor-pointer"
                    tabIndex={-1}
                  >
                    {showCurrentPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {credentialsForm.formState.errors.currentPassword && (
                  <p className="mt-1 text-[11px] text-red-600 font-sans flex items-center gap-1">
                    <AlertCircle size={11} />
                    {credentialsForm.formState.errors.currentPassword.message}
                  </p>
                )}
              </div>

              {/* NOUVEAU MOT DE PASSE & CONFIRMATION */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-widest text-ink-muted mb-1.5 block font-semibold">
                    Nouveau mot de passe
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      {...credentialsForm.register("newPassword")}
                      placeholder="8 caractères min."
                      className="w-full bg-gray-50/70 border border-ink/15 rounded-sm pl-4 pr-10 py-2.5 text-xs text-ink placeholder:text-ink-muted focus:bg-white focus:outline-none focus:border-royal transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink cursor-pointer"
                      tabIndex={-1}
                    >
                      {showNewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {credentialsForm.formState.errors.newPassword && (
                    <p className="mt-1 text-[11px] text-red-600 font-sans flex items-center gap-1">
                      <AlertCircle size={11} />
                      {credentialsForm.formState.errors.newPassword.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-mono uppercase tracking-widest text-ink-muted mb-1.5 block font-semibold">
                    Confirmer le mot de passe
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      {...credentialsForm.register("confirmPassword")}
                      placeholder="Confirmez à l'identique"
                      className="w-full bg-gray-50/70 border border-ink/15 rounded-sm pl-4 pr-10 py-2.5 text-xs text-ink placeholder:text-ink-muted focus:bg-white focus:outline-none focus:border-royal transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink cursor-pointer"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {credentialsForm.formState.errors.confirmPassword && (
                    <p className="mt-1 text-[11px] text-red-600 font-sans flex items-center gap-1">
                      <AlertCircle size={11} />
                      {credentialsForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>

              {/* RÈGLES DE SÉCURITÉ */}
              <div className="flex flex-wrap items-center gap-3 pt-1 text-[10px] font-mono text-ink-muted">
                <span className="inline-flex items-center gap-1 text-emerald-700">
                  <Check size={11} /> Min. 8 caractères
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1 text-emerald-700">
                  <Check size={11} /> Hachage Bcrypt
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1 text-emerald-700">
                  <Check size={11} /> Reconnexion sécurisée
                </span>
              </div>

              {/* BOUTON DE SOUMISSION */}
              <div className="pt-4 border-t border-ink/10 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={credentialsForm.formState.isSubmitting}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-night text-gold border border-gold/40 hover:border-gold hover:bg-black text-xs uppercase tracking-wider font-mono rounded-sm transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {credentialsForm.formState.isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin text-gold" />
                      <span>Enregistrement en cours...</span>
                    </>
                  ) : (
                    <>
                      <Save size={14} className="text-gold" />
                      <span>Mettre à jour les accès</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* MODULE 2 : CONCIERGERIE PRIVÉE */}
        {(activeTab === 'all' || activeTab === 'concierge') && (
          <section className={`bg-white rounded-sm border border-ink/10 shadow-xs p-6 md:p-8 space-y-6 ${
            activeTab === 'concierge' ? 'lg:col-span-2 max-w-3xl mx-auto w-full' : ''
          }`}>
            <div className="border-b border-ink/10 pb-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-widest text-gold flex items-center gap-1.5">
                  <Sparkles size={12} />
                  Expérience Client VIP
                </span>
                <span className="inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-xs bg-royal/10 text-royal border border-royal/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-royal" />
                  Espace Résident
                </span>
              </div>
              <h2 className="font-serif text-xl text-ink mt-1">Conciergerie Privée & Hotline</h2>
              <p className="text-xs text-ink-muted mt-1 font-sans">
                Coordonnées d'urgence et portrait officiel affichés dans l'espace privé de vos clients hébergés.
              </p>
            </div>

            <form 
              onSubmit={conciergeForm.handleSubmit(onConciergeSubmit)} 
              className={`space-y-5 ${isLoadingSettings ? 'opacity-50 pointer-events-none' : ''}`}
            >
              
              {/* PHOTO DU CONCIERGE */}
              <div>
                <label className="text-[10px] font-mono uppercase tracking-widest text-ink-muted mb-2 block font-semibold">
                  Portrait officiel du concierge
                </label>
                
                <div className="p-4 bg-gray-50/70 border border-ink/10 rounded-sm flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative group shrink-0">
                    {previewUrl || existingPhoto ? (
                      <img 
                        src={previewUrl || existingPhoto} 
                        alt="Aperçu du concierge" 
                        className="h-20 w-20 rounded-full object-cover border-2 border-gold shadow-sm" 
                        onError={(e) => { e.currentTarget.style.display = "none"; }} 
                      />
                    ) : (
                      <div className="h-20 w-20 rounded-full bg-mist flex items-center justify-center text-ink-muted border-2 border-dashed border-ink/20">
                        <User className="h-8 w-8 text-ink-muted" />
                      </div>
                    )}
                    <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <Camera size={16} className="text-white" />
                    </div>
                  </div>

                  <div className="flex-1 w-full text-center sm:text-left">
                    <div className="text-xs text-ink font-medium mb-1">
                      Fichier photo du concierge
                    </div>
                    <div className="text-[11px] text-ink-muted mb-3 font-mono">
                      JPG, PNG ou WEBP • 2 Mo maximum
                    </div>
                    <input 
                      id="conciergePhotoInput"
                      type="file" 
                      accept="image/*"
                      {...conciergeForm.register("photo")} 
                      className="block w-full text-xs text-ink-muted file:mr-3 file:py-1.5 file:px-3 file:rounded-sm file:border file:border-ink/15 file:text-xs file:font-mono file:bg-white file:text-ink hover:file:bg-gray-100 cursor-pointer"
                    />
                    {conciergeForm.formState.errors.photo && (
                      <p className="mt-1 text-[11px] text-red-600 font-sans flex items-center gap-1">
                        <AlertCircle size={11} />
                        {conciergeForm.formState.errors.photo.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* HOTLINE 24/7 */}
              <div>
                <label className="text-[10px] font-mono uppercase tracking-widest text-ink-muted mb-1.5 block font-semibold">
                  Numéro Hotline 24/7 *
                </label>
                <div className="relative">
                  <PhoneCall size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                  <input
                    type="tel"
                    {...conciergeForm.register("hotline")}
                    placeholder="+225 07 00 00 01"
                    className="w-full bg-gray-50/70 border border-ink/15 rounded-sm pl-9 pr-4 py-2.5 text-xs text-ink placeholder:text-ink-muted focus:bg-white focus:outline-none focus:border-royal transition-colors font-mono"
                  />
                </div>
                {conciergeForm.formState.errors.hotline && (
                  <p className="mt-1 text-[11px] text-red-600 font-sans flex items-center gap-1">
                    <AlertCircle size={11} />
                    {conciergeForm.formState.errors.hotline.message}
                  </p>
                )}
              </div>

              {/* COURRIEL DÉDIÉ CONCIERGERIE */}
              <div>
                <label className="text-[10px] font-mono uppercase tracking-widest text-ink-muted mb-1.5 block font-semibold">
                  Courriel dédié à la conciergerie *
                </label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                  <input
                    type="email"
                    {...conciergeForm.register("email")}
                    placeholder="vip@rayonnekelly.ci"
                    className="w-full bg-gray-50/70 border border-ink/15 rounded-sm pl-9 pr-4 py-2.5 text-xs text-ink placeholder:text-ink-muted focus:bg-white focus:outline-none focus:border-royal transition-colors font-mono"
                  />
                </div>
                {conciergeForm.formState.errors.email && (
                  <p className="mt-1 text-[11px] text-red-600 font-sans flex items-center gap-1">
                    <AlertCircle size={11} />
                    {conciergeForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              {/* AIDE VISIBILITÉ CLIENT */}
              <div className="text-[11px] text-ink-muted font-sans bg-gray-50/50 p-3 rounded-sm border border-ink/10 flex items-center gap-2">
                <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                <span>
                  Ces coordonnées sont synchronisées en temps réel sur les carnets de séjour des résidents.
                </span>
              </div>

              {/* BOUTON DE SOUMISSION */}
              <div className="pt-4 border-t border-ink/10 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={conciergeForm.formState.isSubmitting || isLoadingSettings}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-royal text-white hover:bg-royal-dark text-xs uppercase tracking-wider font-mono rounded-sm transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {conciergeForm.formState.isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin text-white" />
                      <span>Enregistrement en cours...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} className="text-gold" />
                      <span>Enregistrer les coordonnées</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        )}

      </div>

      {/* MODULE 3 : AUDIT & PROTOCOLES SYSTÈME (VISIBLE SUR "ALL" ET "AUDIT") */}
      {(activeTab === 'all' || activeTab === 'audit') && (
        <section className="bg-white rounded-sm border border-ink/10 shadow-xs p-6 md:p-8 space-y-6">
          <div className="border-b border-ink/10 pb-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-widest text-gold flex items-center gap-1.5">
                <Shield size={12} />
                Infrastructure & Conformité
              </span>
              <span className="inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-xs bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Environnement Conforme
              </span>
            </div>
            <h2 className="font-serif text-xl text-ink mt-1">Protocoles de Sécurité & Intégrité</h2>
            <p className="text-xs text-ink-muted mt-1 font-sans">
              Vue d'ensemble des garanties techniques et de la politique de sécurité des données du portail Rayonne Kelly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-sm bg-gray-50/70 border border-ink/10">
              <div className="flex items-center gap-2 text-ink font-serif text-sm mb-1.5">
                <ShieldCheck size={16} className="text-gold" />
                <span>Chiffrement en Transit</span>
              </div>
              <p className="text-xs text-ink-muted leading-relaxed font-sans">
                Toutes les requêtes administratives transitent par des canaux HTTPS chiffrés sous protocoles TLS 1.3 avec en-têtes de sécurité renforcés.
              </p>
            </div>

            <div className="p-4 rounded-sm bg-gray-50/70 border border-ink/10">
              <div className="flex items-center gap-2 text-ink font-serif text-sm mb-1.5">
                <Lock size={16} className="text-emerald-600" />
                <span>Ségrégation des Accès</span>
              </div>
              <p className="text-xs text-ink-muted leading-relaxed font-sans">
                Isolation stricte entre les rôles clients et direction générale. L'accès aux opérations sensibles exige des jetons JWT cryptographiquement signés.
              </p>
            </div>

            <div className="p-4 rounded-sm bg-gray-50/70 border border-ink/10">
              <div className="flex items-center gap-2 text-ink font-serif text-sm mb-1.5">
                <Clock size={16} className="text-royal" />
                <span>Sessions & Expiration</span>
              </div>
              <p className="text-xs text-ink-muted leading-relaxed font-sans">
                Déconnexion automatique à l'expiration des jetons. Les clés de session sont renouvelées lors de chaque mise à jour des identifiants maîtres.
              </p>
            </div>
          </div>
        </section>
      )}

    </div>
  );
}
