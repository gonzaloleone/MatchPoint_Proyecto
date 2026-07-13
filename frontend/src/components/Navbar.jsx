import { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Menu, X, MapPin, LogOut, User, Heart, Calendar, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, isAuthenticated, isDuenio, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
    setOpen(false);
  };

  const clientLinks = [
    { to: '/', label: 'Inicio', icon: MapPin },
    { to: '/favoritos', label: 'Favoritos', icon: Heart },
    { to: '/reservas', label: 'Reservas', icon: Calendar },
    { to: '/perfil', label: 'Mi Perfil', icon: User },
  ];

  const ownerLinks = [
    { to: '/', label: 'Explorar', icon: MapPin },
    { to: '/favoritos', label: 'Favoritos', icon: Heart },
    { to: '/mi-complejo', label: 'Mi Complejo', icon: Building2 },
    { to: '/reservas', label: 'Reservas', icon: Calendar },
    { to: '/perfil', label: 'Mi Perfil', icon: User },
  ];

  const ROL_LABEL = { DUENIO: 'Dueño', CLIENTE: 'Cliente' };
  const rolLabel = ROL_LABEL[user?.rol] ?? user?.rol;

  const links = isDuenio ? ownerLinks : clientLinks;

  return (
    <nav className="glass sticky top-0 z-50 border-b border-white/5">
      <div className="nav-container relative flex items-center justify-between md:justify-center h-16">

        {/* Logo */}
        <div className={`absolute left-4 ${isAuthenticated ? 'md:left-12' : 'md:left-8'} flex items-center`}>
          <Link to="/" className="flex items-center gap-2 font-bold text-xl" onClick={() => setOpen(false)}>
            <span className="bg-gradient-to-r from-green-400 to-green-600 p-1.5 rounded-lg">
              <MapPin size={18} className="text-white" />
            </span>
            <span className="gradient-text">MatchPoint</span>
          </Link>
        </div>

        {/* Desktop links */}
        {isAuthenticated && (
          <div className="hidden md:flex items-center h-full shrink-0">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                style={{ paddingLeft: '1.25rem', paddingRight: '1.25rem' }}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 h-full text-sm font-semibold transition-all border-b-2 ${isActive
                    ? 'text-green-400 border-green-500 bg-green-500/5'
                    : 'text-slate-300 hover:text-white hover:bg-white/5 border-transparent'
                  }`
                }
              >
                <Icon size={15} />
                {label}
              </NavLink>
            ))}
          </div>
        )}

        {/* Right actions */}
        <div className="absolute right-4 md:right-5 hidden md:flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span className="text-white font-medium">{user?.nombre?.split(' ')[0]}</span>
                <span className="badge badge-green text-[10px] ml-1">{rolLabel}</span>
              </div>
              <button onClick={handleLogout} title="Cerrar sesión" style={{ padding: '0.6rem' }} className="btn-secondary text-sm hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
                <LogOut size={15} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-secondary text-sm px-5 py-2.5 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">Iniciar sesión</Link>
              <Link to="/register" className="btn-primary  text-sm px-5 py-2.5 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">Registrarse</Link>
            </>
          )}
        </div>

        <button
          className="absolute right-4 md:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
          onClick={() => setOpen(v => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }} className="md:hidden border-t border-white/5 py-4 px-5 fade-in">
          {isAuthenticated ? (
            <>
              {links.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setOpen(false)}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1.25rem 1.5rem',
                    borderRadius: '0.75rem',
                    transition: 'all 0.2s',
                    backgroundColor: isActive ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
                    borderLeft: isActive ? '4px solid #22c55e' : '4px solid transparent',
                    paddingLeft: isActive ? '1.25rem' : '1.5rem',
                    color: isActive ? '#4ade80' : '#cbd5e1',
                  })}
                  className="hover:text-white hover:bg-white/5"
                >
                  <Icon size={22} />
                  <span className="font-semibold text-lg">{label}</span>
                </NavLink>
              ))}
              <div className="border-t border-white/5 pt-5 mt-4" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 flex items-center justify-center text-green-400 font-semibold text-sm">
                    {user?.nombre ? user.nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : <User size={18} />}
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-white font-medium text-sm truncate">{user?.nombre}</span>
                    <span className="text-xs text-slate-400 mt-0.5">{rolLabel}</span>
                  </div>
                  <span className="relative flex h-2 w-2 mr-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                </div>
                <button onClick={handleLogout}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.75rem',
                    transition: 'all 0.2s',
                    width: '100%',
                  }}
                  className="bg-red-500/5 text-red-400 border border-red-500/20 hover:bg-red-500/10 active:scale-[0.98] cursor-pointer font-medium text-sm">
                  <LogOut size={16} />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-2 pt-2">
              <Link to="/login" onClick={() => setOpen(false)} className="btn-secondary text-center">Iniciar sesión</Link>
              <Link to="/register" onClick={() => setOpen(false)} className="btn-primary  text-center">Registrarse</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
