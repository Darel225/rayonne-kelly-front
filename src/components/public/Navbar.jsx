import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import logo from '../../assets/images/logo.png';
import useAuthStore from '../../store/authStore';
import api from '../../services/api';
import { toast } from 'sonner';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  const location = useLocation();
  const isHome = location.pathname === '/';
  
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => !!state.accessToken);
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);

  const handleLogout = async () => {
    try {
      // Invalidation côté serveur du cookie HttpOnly
      await api.post('/auth/logout');
    } catch (error) {
      // L'échec réseau ne doit pas empêcher la déconnexion locale
      console.warn("Échec de l'invalidation serveur, déconnexion locale forcée.", error);
    } finally {
      clearSession();
      toast.success("Vous avez été déconnecté avec succès.");
      navigate('/');
    }
  };

  const getDashboardRoute = () => {
    return user?.role === 'admin' ? '/admin' : '/client';
  };

  const navClasses = `fixed top-0 left-0 w-full z-50 transition-all duration-500 border-b ${
    (isScrolled || !isHome) 
      ? 'bg-night/95 backdrop-blur-md border-white/10 py-3 shadow-2xl' 
      : 'bg-transparent border-transparent py-5'
  }`;

  return (
    <header className={navClasses}>
      <div className="mx-auto max-w-7xl px-6 flex items-center justify-between">
        {/* Left */}
        <Link aria-label="Rayonne Kelly, accueil" className="shrink-0" to="/">
          <div className="bg-white rounded-full h-12 w-12 flex items-center justify-center p-1 shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-transform duration-500 hover:scale-105">
            <img src={logo} alt="Rayonne Kelly" className="w-full h-full object-contain" />
          </div>
        </Link>

        {/* Center */}
        <nav className="hidden md:flex gap-10 items-center">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `group relative text-xs uppercase tracking-widest transition-colors py-2 ${isActive ? 'text-white' : 'text-white/80 hover:text-white'}`
            }
          >
            Accueil
            <span className="absolute bottom-0 left-1/2 w-0 h-[1px] bg-white transition-all duration-300 ease-out group-hover:w-full group-hover:left-0"></span>
          </NavLink>
          <NavLink
            to="/collection"
            className={({ isActive }) =>
              `group relative text-xs uppercase tracking-widest transition-colors py-2 ${isActive ? 'text-white' : 'text-white/80 hover:text-white'}`
            }
          >
            Nos résidences
            <span className="absolute bottom-0 left-1/2 w-0 h-[1px] bg-white transition-all duration-300 ease-out group-hover:w-full group-hover:left-0"></span>
          </NavLink>
          
          {isAuthenticated && (
            <NavLink
              to={getDashboardRoute()}
              className={({ isActive }) =>
                `group relative text-xs uppercase tracking-widest transition-colors py-2 ${isActive ? 'text-white' : 'text-white/80 hover:text-white'}`
              }
            >
              Mon espace
              <span className="absolute bottom-0 left-1/2 w-0 h-[1px] bg-white transition-all duration-300 ease-out group-hover:w-full group-hover:left-0"></span>
            </NavLink>
          )}
        </nav>

        {/* Right */}
        <div className="hidden md:flex items-center gap-6">
          {!isAuthenticated ? (
            <>
              <Link
                to="/connexion"
                state={{ isLogin: true }}
                className="group relative text-white/60 hover:text-white text-xs uppercase tracking-widest transition-colors py-2"
              >
                Connexion
                <span className="absolute bottom-0 left-1/2 w-0 h-[1px] bg-white transition-all duration-300 ease-out group-hover:w-full group-hover:left-0"></span>
              </Link>
              <Link
                to="/connexion"
                state={{ isLogin: false }}
                className="bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs uppercase tracking-widest px-6 py-2.5 hover:bg-white hover:text-night transition-all duration-500"
              >
                Inscription
              </Link>
            </>
          ) : (
            <button
              onClick={handleLogout}
              className="group relative text-white/60 hover:text-white text-xs uppercase tracking-widest transition-colors py-2"
            >
              Déconnexion
              <span className="absolute bottom-0 left-1/2 w-0 h-[1px] bg-white transition-all duration-300 ease-out group-hover:w-full group-hover:left-0"></span>
            </button>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          className="md:hidden text-white"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-expanded={isMenuOpen}
          aria-label="Menu"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-night px-6 py-4 flex flex-col gap-4 border-b border-white/10">
          <Link to="/" onClick={() => setIsMenuOpen(false)} className="text-xs uppercase tracking-[0.2em] text-white/60 hover:text-white">
            Accueil
          </Link>
          <Link to="/collection" onClick={() => setIsMenuOpen(false)} className="text-xs uppercase tracking-[0.2em] text-white/60 hover:text-white">
            Nos résidences
          </Link>
          {isAuthenticated && (
            <Link to={getDashboardRoute()} onClick={() => setIsMenuOpen(false)} className="text-xs uppercase tracking-[0.2em] text-white/60 hover:text-white">
              Mon espace
            </Link>
          )}
          <div className="h-px w-full bg-white/10 my-2"></div>
          
          {!isAuthenticated ? (
            <>
              <Link to="/connexion" state={{ isLogin: true }} onClick={() => setIsMenuOpen(false)} className="text-xs uppercase tracking-[0.2em] text-white/60 hover:text-white">
                Connexion
              </Link>
              <Link to="/connexion" state={{ isLogin: false }} onClick={() => setIsMenuOpen(false)} className="bg-royal hover:bg-royal-dark text-white text-xs uppercase tracking-[0.2em] px-5 py-2.5 rounded-sm transition-colors text-center inline-block">
                Inscription
              </Link>
            </>
          ) : (
            <button 
              onClick={() => {
                setIsMenuOpen(false);
                handleLogout();
              }} 
              className="text-left text-xs uppercase tracking-[0.2em] text-white/60 hover:text-white"
            >
              Déconnexion
            </button>
          )}
        </div>
      )}
    </header>
  );
}
