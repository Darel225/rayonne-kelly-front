import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Box, AtSign, Eye, EyeOff, ArrowRight, ShieldCheck, Phone } from 'lucide-react';
import Button from '../../components/common/Button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import bgImage from '../../assets/images/connexion-ins.jpeg';
import logo from '../../assets/images/logo.png';

const BG_IMAGE_URL = bgImage;

const loginSchema = z.object({
  email: z.string().email("Format d'e-mail invalide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
});

const registerSchema = z.object({
  lastName: z.string().min(2, "Requis"),
  firstName: z.string().min(2, "Requis"),
  email: z.string().email("Format d'e-mail invalide"),
  phone: z.string().regex(/^\+?[0-9\s-]{8,15}$/, "Numéro de téléphone invalide (chiffres uniquement)"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  confirmPassword: z.string(),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: "Veuillez accepter les conditions et la politique de confidentialité." }),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les clés d'accès ne correspondent pas",
  path: ["confirmPassword"],
});

export default function Auth() {
  const location = useLocation();
  const initialMode = location.state?.isLogin === false ? 'register' : 'login';
  const [mode, setMode] = useState(initialMode); // 'login' or 'register'
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const setSession = useAuthStore(state => state.setSession);

  useEffect(() => {
    if (location.state?.isLogin !== undefined) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMode(location.state.isLogin ? 'login' : 'register');
    }
  }, [location.state]);

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: { email: '', password: '' },
  });

  const registerForm = useForm({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
    defaultValues: { lastName: '', firstName: '', email: '', phone: '', password: '', confirmPassword: '', acceptTerms: false },
  });

  const handleModeSwitch = (newMode) => {
    setMode(newMode);
    setShowPassword(false);
  };

  const onLoginSubmit = async (data) => {
    try {
      // 1. Appel login
      const response = await api.post('/auth/login', {
        email: data.email,
        password: data.password
      });

      console.log("[Login] Réponse brute de /auth/login :", response);

      const accessToken = response?.access_token || response?.token;
      
      if (!accessToken) {
        console.error("[Login] Aucun access token trouvé dans la réponse du login !", response);
        toast.error("Erreur système : Token manquant.");
        return;
      }

      console.log("[Login] Access Token extrait :", accessToken);

      // 2. Récupération du profil explicite
      let user = null;
      try {
        const meResponse = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        
        console.log("[Login] Réponse brute de /auth/me :", meResponse);
        
        user = meResponse?.user || meResponse;
        
        if (!user) {
          throw new Error("L'objet utilisateur est vide ou indéfini après l'extraction.");
        }
        
        console.log("[Login] Profil utilisateur extrait :", user);
        
      } catch (meError) {
        console.error("[Login] Échec de l'appel à /auth/me :", meError);
        toast.error("Connexion réussie mais impossible de charger le profil.");
        return; // Stoppe le flux ici pour éviter de stocker un état corrompu
      }

      // 3. Stocker en mémoire
      setSession(accessToken, user);
      console.log("[Login] Session sauvegardée dans Zustand.");

      toast.success("Connexion réussie.");

      // 4. Redirection dynamique (ou par rôle par défaut)
      const redirectUrl = new URLSearchParams(location.search).get('redirect');

      if (user?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate(redirectUrl || '/client');
      }
    } catch (error) {
      console.error("[Login] Échec de la requête de login :", error);
      const message = error.response?.data?.message || "Une erreur est survenue lors de la connexion.";
      toast.error(message);
    }
  };

  const onRegisterSubmit = async (data) => {
    try {
      const payload = {
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone, // Inclus par sécurité même si non listé explicitement dans le prompt
        password: data.password
      };

      await api.post('/auth/register', payload);

      toast.success("Compte créé avec succès. Vous pouvez maintenant vous connecter.");
      
      // Bascule vers le login et pré-remplit l'email
      setMode('login');
      loginForm.setValue('email', data.email);
    } catch (error) {
      const message = error.response?.data?.message || "Une erreur est survenue lors de l'inscription.";
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 bg-ivory">
      {/* Left panel (Desktop luxury showcase) */}
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden p-12 text-white min-h-screen sticky top-0 h-screen">
        <img
          src={BG_IMAGE_URL}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-night/70 via-night/50 to-night/90"></div>

        {/* Top row */}
        <div className="relative z-10 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="h-11 w-11 rounded-full border border-white/30 bg-white/10 backdrop-blur-md p-1.5 flex items-center justify-center transition-transform group-hover:scale-105">
              <img src={logo} alt="Rayonne Kelly" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-gold font-bold">
                Habilitation Confidentielle
              </div>
              <div className="font-serif text-sm text-white">
                Rayonne Kelly
              </div>
            </div>
          </Link>
          <div className="border border-white/20 bg-white/10 backdrop-blur rounded-full px-4 py-1.5 text-[10px] uppercase tracking-widest">
            Off-Market Protocol
          </div>
        </div>

        {/* Center block */}
        <div className="relative z-10 flex flex-col justify-center h-full max-w-lg mt-20 mb-20">
          <div className="flex items-center gap-2 mb-6 text-[10px] uppercase tracking-[0.3em] text-gold font-bold">
            <span className="w-6 h-px bg-gold"></span>
            Sanctuaire d'Acquisitions & Résidences
          </div>
          <h1 className="font-serif text-4xl xl:text-5xl leading-tight text-white mb-8">
            « Le sanctuaire des résidences d'exception et des séjours souverains à Abidjan. »
          </h1>
          <div className="border-t border-white/20 pt-6">
            <div className="text-sm text-white/70">
              Cocody Ambassades &bull; Baie des Milliardaires &bull; Assinie-Mafia
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="relative z-10 flex justify-between items-center text-[10px] uppercase tracking-widest text-white/60">
          <div>&copy; 2026 RAYONNE KELLY GROUP</div>
          <div>DIVISION HAUTE PROPRIÉTÉ</div>
        </div>
      </aside>

      {/* Right panel */}
      <main className="w-full flex flex-col justify-center min-h-screen lg:min-h-0 lg:h-full lg:overflow-y-auto bg-ivory px-5 sm:px-12 md:px-16 lg:px-20 py-8 sm:py-12">
        <div className="w-full max-w-md mx-auto my-auto">
          {/* Mobile-only brand */}
          <div className="lg:hidden flex items-center justify-between gap-3 mb-8 pb-4 border-b border-ink/10">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="h-10 w-10 rounded-full border border-ink/15 bg-white p-1 flex items-center justify-center shadow-xs">
                <img src={logo} alt="Rayonne Kelly" className="w-full h-full object-contain" />
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-[0.25em] text-gold font-bold">
                  Habilitation Confidentielle
                </div>
                <div className="font-serif text-sm text-ink font-semibold group-hover:text-royal transition-colors">
                  Rayonne Kelly
                </div>
              </div>
            </Link>
            <Link to="/" className="text-[10px] uppercase tracking-widest text-ink-muted hover:text-royal font-semibold py-1 px-3 rounded-full border border-ink/10 bg-white/60">
              Accueil →
            </Link>
          </div>

          {/* Header */}
          <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-royal mb-2">
            Espace Sécurisé
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl text-ink">Authentification Privée</h2>
          <p className="text-xs sm:text-sm text-ink-muted mt-1.5 mb-6">
            Annuaire de résidences d'exception et locations de prestige.
          </p>

          {/* Tabs */}
          <div role="tablist" className="flex border-b border-ink/10 mb-6 gap-8 sm:gap-14">
            <button
              role="tab"
              aria-selected={mode === 'login'}
              onClick={() => handleModeSwitch('login')}
              className={`pb-3 text-xs uppercase tracking-[0.2em] -mb-px transition-colors cursor-pointer ${mode === 'login'
                  ? 'text-royal font-bold border-b-2 border-royal'
                  : 'text-ink-muted hover:text-ink'
                }`}
            >
              Connexion
            </button>
            <button
              role="tab"
              aria-selected={mode === 'register'}
              onClick={() => handleModeSwitch('register')}
              className={`pb-3 text-xs uppercase tracking-[0.2em] -mb-px transition-colors cursor-pointer ${mode === 'register'
                  ? 'text-royal font-bold border-b-2 border-royal'
                  : 'text-ink-muted hover:text-ink'
                }`}
            >
              Inscription
            </button>
          </div>

          {/* Forms */}
          {mode === 'login' ? (
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
              <div className="relative">
                <label htmlFor="login-email" className="block text-[10px] font-bold uppercase tracking-[0.2em] text-ink mb-1.5">
                  Identifiant Confidentiel / Email *
                </label>
                <div className="relative">
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    placeholder="votre.email@exemple.com"
                    {...loginForm.register("email")}
                    className={`w-full bg-transparent border-0 border-b py-2.5 sm:py-3 pr-10 text-sm text-ink placeholder:italic placeholder:text-ink-muted/50 focus:outline-none transition-colors ${loginForm.formState.errors.email ? 'border-red-500 focus:border-red-500' : 'border-ink/20 focus:border-royal'}`}
                  />
                  <AtSign className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted pointer-events-none" />
                </div>
                {loginForm.formState.errors.email && (
                  <p className="text-xs text-red-500 mt-1">{loginForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="relative">
                <label htmlFor="login-password" className="block text-[10px] font-bold uppercase tracking-[0.2em] text-ink mb-1.5">
                  Clé d'Accès Sécurisée *
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••••••••••"
                    {...loginForm.register("password")}
                    className={`w-full bg-transparent border-0 border-b py-2.5 sm:py-3 pr-10 text-sm text-ink placeholder:italic placeholder:text-ink-muted/50 focus:outline-none transition-colors ${loginForm.formState.errors.password ? 'border-red-500 focus:border-red-500' : 'border-ink/20 focus:border-royal'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Afficher le mot de passe"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-ink-muted hover:text-ink cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {loginForm.formState.errors.password && (
                  <p className="text-xs text-red-500 mt-1">{loginForm.formState.errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full py-4 mt-6 uppercase tracking-[0.25em] text-[10px] sm:text-xs rounded-full shadow-md cursor-pointer hover:bg-royal transition-colors"
                icon={ArrowRight}
                isLoading={loginForm.formState.isSubmitting}
              >
                Se Connecter
              </Button>
            </form>
          ) : (
            <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4 sm:space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                {/* Nom */}
                <div className="relative">
                  <label htmlFor="register-lastName" className="block text-[10px] font-bold uppercase tracking-[0.2em] text-ink mb-1.5">
                    Nom de famille *
                  </label>
                  <input
                    id="register-lastName"
                    type="text"
                    autoComplete="family-name"
                    placeholder="Ex: Koné"
                    {...registerForm.register("lastName")}
                    className={`w-full bg-transparent border-0 border-b py-2.5 sm:py-3 text-sm text-ink placeholder:italic placeholder:text-ink-muted/50 focus:outline-none transition-colors ${registerForm.formState.errors.lastName ? 'border-red-500 focus:border-red-500' : 'border-ink/20 focus:border-royal'}`}
                  />
                  {registerForm.formState.errors.lastName && (
                    <p className="text-xs text-red-500 mt-1">{registerForm.formState.errors.lastName.message}</p>
                  )}
                </div>

                {/* Prénoms */}
                <div className="relative">
                  <label htmlFor="register-firstName" className="block text-[10px] font-bold uppercase tracking-[0.2em] text-ink mb-1.5">
                    Prénoms *
                  </label>
                  <input
                    id="register-firstName"
                    type="text"
                    autoComplete="given-name"
                    placeholder="Ex: Sarah Marie"
                    {...registerForm.register("firstName")}
                    className={`w-full bg-transparent border-0 border-b py-2.5 sm:py-3 text-sm text-ink placeholder:italic placeholder:text-ink-muted/50 focus:outline-none transition-colors ${registerForm.formState.errors.firstName ? 'border-red-500 focus:border-red-500' : 'border-ink/20 focus:border-royal'}`}
                  />
                  {registerForm.formState.errors.firstName && (
                    <p className="text-xs text-red-500 mt-1">{registerForm.formState.errors.firstName.message}</p>
                  )}
                </div>

                {/* Email (Pleine largeur) */}
                <div className="relative sm:col-span-2">
                  <label htmlFor="register-email" className="block text-[10px] font-bold uppercase tracking-[0.2em] text-ink mb-1.5">
                    Adresse e-mail *
                  </label>
                  <div className="relative">
                    <input
                      id="register-email"
                      type="email"
                      autoComplete="email"
                      placeholder="votre.email@exemple.com"
                      {...registerForm.register("email")}
                      className={`w-full bg-transparent border-0 border-b py-2.5 sm:py-3 pr-10 text-sm text-ink placeholder:italic placeholder:text-ink-muted/50 focus:outline-none transition-colors ${registerForm.formState.errors.email ? 'border-red-500 focus:border-red-500' : 'border-ink/20 focus:border-royal'}`}
                    />
                    <AtSign className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted pointer-events-none" />
                  </div>
                  {registerForm.formState.errors.email && (
                    <p className="text-xs text-red-500 mt-1">{registerForm.formState.errors.email.message}</p>
                  )}
                </div>

                {/* Téléphone WhatsApp (Pleine largeur) */}
                <div className="relative sm:col-span-2">
                  <label htmlFor="register-phone" className="block text-[10px] font-bold uppercase tracking-[0.2em] text-ink mb-1.5">
                    Téléphone WhatsApp *
                  </label>
                  <div className="relative">
                    <input
                      id="register-phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="+225 07 00 00 00 00"
                      {...registerForm.register("phone")}
                      className={`w-full bg-transparent border-0 border-b py-2.5 sm:py-3 pr-10 text-sm text-ink placeholder:italic placeholder:text-ink-muted/50 focus:outline-none transition-colors ${registerForm.formState.errors.phone ? 'border-red-500 focus:border-red-500' : 'border-ink/20 focus:border-royal'}`}
                    />
                    <Phone className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted pointer-events-none" />
                  </div>
                  {registerForm.formState.errors.phone && (
                    <p className="text-xs text-red-500 mt-1">{registerForm.formState.errors.phone.message}</p>
                  )}
                </div>

                {/* Mot de passe */}
                <div className="relative">
                  <label htmlFor="register-password" className="block text-[10px] font-bold uppercase tracking-[0.2em] text-ink mb-1.5">
                    Mot de passe *
                  </label>
                  <div className="relative">
                    <input
                      id="register-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="••••••••••••••••"
                      {...registerForm.register("password")}
                      className={`w-full bg-transparent border-0 border-b py-2.5 sm:py-3 pr-10 text-sm text-ink placeholder:italic placeholder:text-ink-muted/50 focus:outline-none transition-colors ${registerForm.formState.errors.password ? 'border-red-500 focus:border-red-500' : 'border-ink/20 focus:border-royal'}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label="Afficher le mot de passe"
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-ink-muted hover:text-ink cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {registerForm.formState.errors.password && (
                    <p className="text-xs text-red-500 mt-1">{registerForm.formState.errors.password.message}</p>
                  )}
                </div>

                {/* Confirmer mot de passe */}
                <div className="relative">
                  <label htmlFor="register-confirmPassword" className="block text-[10px] font-bold uppercase tracking-[0.2em] text-ink mb-1.5">
                    Confirmer mot de passe *
                  </label>
                  <div className="relative">
                    <input
                      id="register-confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      placeholder="••••••••••••••••"
                      {...registerForm.register("confirmPassword")}
                      className={`w-full bg-transparent border-0 border-b py-2.5 sm:py-3 pr-10 text-sm text-ink placeholder:italic placeholder:text-ink-muted/50 focus:outline-none transition-colors ${registerForm.formState.errors.confirmPassword ? 'border-red-500 focus:border-red-500' : 'border-ink/20 focus:border-royal'}`}
                    />
                  </div>
                  {registerForm.formState.errors.confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">{registerForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>

              {/* Conditions & Confidentialité */}
              <div className="pt-2">
                <label className="flex items-start gap-3 cursor-pointer group select-none">
                  <input
                    type="checkbox"
                    id="register-acceptTerms"
                    {...registerForm.register("acceptTerms")}
                    className="mt-0.5 h-4 w-4 rounded-sm border border-ink/20 text-royal focus:ring-royal accent-royal cursor-pointer shrink-0"
                  />
                  <span className="text-xs text-ink-muted leading-relaxed group-hover:text-ink transition-colors">
                    J'accepte les{' '}
                    <Link to="/conditions" target="_blank" rel="noopener noreferrer" className="text-royal underline hover:text-gold transition-colors">
                      Conditions Générales
                    </Link>{' '}
                    et la{' '}
                    <Link to="/confidentialite" target="_blank" rel="noopener noreferrer" className="text-royal underline hover:text-gold transition-colors">
                      Politique de Confidentialité
                    </Link>{' '}
                    de Rayonne Kelly. *
                  </span>
                </label>
                {registerForm.formState.errors.acceptTerms && (
                  <p className="text-xs text-red-500 mt-1">{registerForm.formState.errors.acceptTerms.message}</p>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full py-4 uppercase tracking-[0.25em] text-[10px] sm:text-xs rounded-full shadow-md cursor-pointer hover:bg-royal transition-colors"
                icon={ArrowRight}
                isLoading={registerForm.formState.isSubmitting}
              >
                Créer mon accès
              </Button>
            </form>
          )}

          {/* Security note */}
          <div className="flex gap-3 items-start border-t border-ink/10 mt-8 pt-4 text-left">
            <ShieldCheck className="h-4 w-4 shrink-0 text-royal mt-0.5" />
            <p className="text-[11px] leading-relaxed text-ink-muted">
              Protocole chiffré SSL 256-bit &middot; Session protégée sous clause stricte de secret d'affaires et mandat de représentation.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
