import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { User } from "lucide-react";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import api from "../../services/api";
import useAuthStore from "../../store/authStore";

const BACKEND_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1').replace('/api/v1', '');
const getImageUrl = (path) => {
  if (!path) return '';
  return path.startsWith('/') ? `${BACKEND_URL}${path}` : path;
};

const credentialsSchema = z.object({
  email: z.string().email("Adresse e-mail invalide"),
  currentPassword: z.string().min(1, "Mot de passe actuel requis"),
  newPassword: z.string().min(8, "8 caractères minimum"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

const conciergeSchema = z.object({
  photo: z.any().optional(),
  hotline: z.string().min(8, "Numéro trop court"),
  email: z.string().email("Adresse e-mail invalide"),
});

export default function Settings() {
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
      
      toast.success("Coordonnées enregistrées.");
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

  return (
    <div className="mx-auto max-w-7xl w-full px-6 py-10 flex flex-col gap-10">
      <div>
        <h1 className="font-serif text-4xl text-ink mb-2">Paramètres du Portail</h1>
        <p className="text-sm text-ink-muted">Gérez vos accès et les informations affichées à vos clients.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="rounded-sm border border-ink/10 bg-white p-8 shadow-xl shadow-night/5">
        <h2 className="font-serif text-xl text-ink mb-1">Sécurité & Identifiants</h2>
        <p className="text-xs text-ink-muted mb-6">Mettez à jour vos informations de connexion pour l'administration.</p>
        
        <form onSubmit={credentialsForm.handleSubmit(onCredentialsSubmit)} className="flex flex-col gap-5">
          <Input 
            id="email" 
            label="Adresse e-mail administrateur" 
            type="email" 
            {...credentialsForm.register("email")} 
            error={credentialsForm.formState.errors.email?.message} 
          />
          <Input 
            id="currentPassword" 
            label="Mot de passe actuel" 
            type="password" 
            {...credentialsForm.register("currentPassword")} 
            error={credentialsForm.formState.errors.currentPassword?.message} 
          />
          <Input 
            id="newPassword" 
            label="Nouveau mot de passe" 
            type="password" 
            {...credentialsForm.register("newPassword")} 
            error={credentialsForm.formState.errors.newPassword?.message} 
          />
          <Input 
            id="confirmPassword" 
            label="Confirmer le nouveau mot de passe" 
            type="password" 
            {...credentialsForm.register("confirmPassword")} 
            error={credentialsForm.formState.errors.confirmPassword?.message} 
          />
          
          <div className="mt-2">
            <Button type="submit" variant="royal" isLoading={credentialsForm.formState.isSubmitting}>
              {credentialsForm.formState.isSubmitting ? "Enregistrement..." : "Mettre à jour les accès"}
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-sm border border-ink/10 bg-white p-8 shadow-xl shadow-night/5">
        <h2 className="font-serif text-xl text-ink mb-1">Coordonnées de la Conciergerie</h2>
        <p className="text-xs text-ink-muted mb-6">Ces informations s'afficheront dans l'espace privé de vos clients.</p>
        
        <form onSubmit={conciergeForm.handleSubmit(onConciergeSubmit)} className={`flex flex-col gap-5 ${isLoadingSettings ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="flex items-end gap-4">
            {previewUrl || existingPhoto ? (
              <img 
                src={previewUrl || existingPhoto} 
                alt="Aperçu du concierge" 
                className="h-16 w-16 rounded-full object-cover shrink-0 border border-ink/10" 
                onError={(e) => { e.currentTarget.style.display = "none"; }} 
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-mist flex items-center justify-center text-ink-muted shrink-0 border border-ink/10">
                <User className="h-6 w-6" />
              </div>
            )}
            <div className="flex-1">
              <Input 
                id="photo" 
                label="Photo du Concierge" 
                type="file" 
                accept="image/*"
                {...conciergeForm.register("photo")} 
                error={conciergeForm.formState.errors.photo?.message} 
              />
            </div>
          </div>

          <Input 
            id="hotline" 
            label="Numéro Hotline 24/7" 
            type="tel" 
            placeholder="+225 07 00 00 01" 
            {...conciergeForm.register("hotline")} 
            error={conciergeForm.formState.errors.hotline?.message} 
          />
          <Input 
            id="conciergeEmail" 
            label="Courriel Dédié" 
            type="email" 
            placeholder="vip@rayonnekelly.ci" 
            {...conciergeForm.register("email")} 
            error={conciergeForm.formState.errors.email?.message} 
          />
          
          <div className="mt-2">
            <Button type="submit" variant="royal" isLoading={conciergeForm.formState.isSubmitting} disabled={isLoadingSettings}>
              {conciergeForm.formState.isSubmitting ? "Enregistrement..." : "Enregistrer les coordonnées"}
            </Button>
          </div>
        </form>
      </section>
      </div>
    </div>
  );
}
