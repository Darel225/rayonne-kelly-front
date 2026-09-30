import { useState } from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { LayoutDashboard, Building, Users, Mail, Settings, FileText, ArrowLeft, LogOut, Menu, X, Calendar } from 'lucide-react';

export default function AdminLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="min-h-screen flex bg-gray-50 text-ink overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-night text-white flex flex-col shrink-0 transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>

        {/* Mobile close button */}
        <button
          onClick={toggleMobileMenu}
          className="lg:hidden absolute top-4 right-4 text-white/70 hover:text-white"
          aria-label="Fermer le menu"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Logo block */}
        <div className="p-6 border-b border-white/10">
          <div className="font-serif text-xl">RAYONNE KELLY</div>
          <div className="font-mono text-[10px] text-white/50 tracking-widest uppercase mt-1">PORTAIL EXÉCUTIF & ASSET</div>
        </div>

        {/* Nav */}
        <nav className="flex-1 mt-6 px-4 space-y-1 overflow-y-auto">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 text-sm transition-colors rounded-sm relative ${isActive ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'}`
            }
          >
            {({ isActive }) => (
              <>
                <LayoutDashboard className="h-4 w-4" />
                Tableau de bord
                {isActive && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-gold rounded-full" aria-hidden="true"></span>
                )}
              </>
            )}
          </NavLink>

          <NavLink
            to="/admin/bookings"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 text-sm transition-colors rounded-sm relative ${isActive ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'}`
            }
          >
            {({ isActive }) => (
              <>
                <Calendar className="h-4 w-4" />
                Gestion des Réservations
                {isActive && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-gold rounded-full" aria-hidden="true"></span>
                )}
              </>
            )}
          </NavLink>

          {/* Non-navigating items */}
          <NavLink
            to="/admin/residences"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 text-sm transition-colors rounded-sm relative ${isActive ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'}`
            }
          >
            {({ isActive }) => (
              <>
                <Building className="h-4 w-4" />
                Portfolio Propriétés
                {isActive && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-gold rounded-full" aria-hidden="true"></span>
                )}
              </>
            )}
          </NavLink>

          <NavLink
            to="/admin/clients"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 text-sm transition-colors rounded-sm relative ${isActive ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'}`
            }
          >
            {({ isActive }) => (
              <>
                <Users className="h-4 w-4" />
                Gestion des Clients
                {isActive && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-gold rounded-full" aria-hidden="true"></span>
                )}
              </>
            )}
          </NavLink>

          <NavLink
            to="/admin/subscribers"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 text-sm transition-colors rounded-sm relative ${isActive ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'}`
            }
          >
            {({ isActive }) => (
              <>
                <Mail className="h-4 w-4" />
                Newsletter & Abonnés
                {isActive && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-gold rounded-full" aria-hidden="true"></span>
                )}
              </>
            )}
          </NavLink>

          <NavLink
            to="/admin/amenities"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 text-sm transition-colors rounded-sm relative ${isActive ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'}`
            }
          >
            {({ isActive }) => (
              <>
                <Settings className="h-4 w-4" />
                Équipements & Services
                {isActive && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-gold rounded-full" aria-hidden="true"></span>
                )}
              </>
            )}
          </NavLink>



          <NavLink
            to="/admin/settings"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 text-sm transition-colors rounded-sm relative ${isActive ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'}`
            }
          >
            {({ isActive }) => (
              <>
                <Settings className="h-4 w-4" />
                Paramètres
                {isActive && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-gold rounded-full" aria-hidden="true"></span>
                )}
              </>
            )}
          </NavLink>
        </nav>

        {/* Divider & Back Link */}
        <div className="border-t border-white/10 mx-4 mt-6 pt-4 mb-2">
          <Link to="/" className="flex items-center gap-3 px-3 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors rounded-sm">
            <ArrowLeft className="h-4 w-4" />
            Retour au Site Public
          </Link>
        </div>

        {/* Bottom block */}
        <div className="mt-auto p-4 m-4 bg-white/5 rounded-sm">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" aria-hidden="true"></span>
              <span className="text-sm font-medium">Direction Générale</span>
            </div>
          </div>
          <div className="text-[10px] text-white/50 tracking-wide">
            Accès Haute Direction Sécurisé
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">

        {/* Top header */}
        <header className="h-16 shrink-0 flex items-center justify-between px-4 lg:px-8 border-b border-ink/10 bg-white">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden text-ink-muted hover:text-ink"
              aria-label="Ouvrir le menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden sm:flex items-center gap-3">
              <span className="font-mono text-[10px] uppercase text-ink-muted">PORTAIL ADMINISTRATEUR — CÔTE D'IVOIRE</span>
              <span className="text-ink-muted/30">|</span>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" aria-hidden="true"></span>
                <span className="text-xs text-ink">Marché : Ouvert</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium text-ink">Rayonne Kelly Présidence</div>
              <div className="text-[10px] text-ink-muted uppercase tracking-widest">ABIDJAN, LAGUNES</div>
            </div>
            <div className="h-8 w-8 rounded-full border border-ink/20 bg-white flex items-center justify-center text-xs font-medium text-ink shrink-0">
              RK
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
