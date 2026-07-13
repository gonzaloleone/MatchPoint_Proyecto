import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, MapPin, Star, Heart, Filter,
  Zap, ChevronRight, RefreshCw, X
} from 'lucide-react';
import api from '../services/api';

// ─── Minimalist Sport Icons ──────────────────────────────────────────────────
const FutbolIcon = ({ size = 16, className = '' }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className={`inline-block text-green-400 ${className}`}>
    <circle cx="12" cy="12" r="10" />
    <path d="m12 2 3.5 5h-7Z" />
    <path d="m15.5 7 2.5 5.5-5 3.5" />
    <path d="m13 16-1 6" />
    <path d="m8.5 7-2.5 5.5 5 3.5" />
    <path d="m6 12.5-4-.5" />
    <path d="m18 12.5 4-.5" />
  </svg>
);

const TenisIcon = ({ size = 16, className = '' }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className={`inline-block text-green-400 ${className}`}>
    <ellipse cx="12" cy="9" rx="5" ry="7" />
    <path d="M12 2v14M9 9h6M10 6h4M10 12h4" />
    <path d="M12 16v5M10 21h4" />
  </svg>
);

const PadelIcon = ({ size = 16, className = '' }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className={`inline-block text-green-500 ${className}`}>
    <circle cx="12" cy="9" r="6" />
    <path d="M12 15v6M10 21h4" />
    <circle cx="10" cy="8" r="0.75" fill="currentColor" />
    <circle cx="12" cy="8" r="0.75" fill="currentColor" />
    <circle cx="14" cy="8" r="0.75" fill="currentColor" />
    <circle cx="11" cy="10" r="0.75" fill="currentColor" />
    <circle cx="13" cy="10" r="0.75" fill="currentColor" />
  </svg>
);

// ─── Sport filter config ────────────────────────────────────────────────────
const SPORTS = [
  { key: 'FUTBOL', label: 'Fútbol', icon: <FutbolIcon size={15} /> },
  { key: 'PADEL',  label: 'Pádel',  icon: <PadelIcon size={15} /> },
  { key: 'TENIS',  label: 'Tenis',  icon: <TenisIcon size={15} /> },
];

function avgPrice(canchas) {
  if (!canchas?.length) return null;
  const avg = canchas.reduce((s, c) => s + Number(c.precio_hora), 0) / canchas.length;
  return Math.round(avg);
}
function parseCaracteristicas(str) {
  if (!str) return [];
  return str.split(',').map(s => s.trim()).filter(Boolean).slice(0, 4);
}
function uniqueSports(canchas) {
  return [...new Set(canchas?.map(c => c.deporte) ?? [])];
}
const SPORT_BADGE = { FUTBOL: 'badge-blue', PADEL: 'badge-green', TENIS: 'badge-yellow' };

function StarRating({ value }) {
  const v = Number(value) || 5;
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={13}
          fill={i <= Math.round(v) ? 'currentColor' : 'none'}
          className={i <= Math.round(v) ? 'text-yellow-400' : 'text-slate-600'} />
      ))}
      <span className="text-yellow-400 text-xs font-semibold ml-0.5">{v.toFixed(1)}</span>
    </div>
  );
}

// ─── Favourite button ──────────────────────────────────────────────────────
function FavBtn({ complejoId, initialFav, onToggle }) {
  const [fav,     setFav]     = useState(initialFav);
  const [loading, setLoading] = useState(false);

  useEffect(() => setFav(initialFav), [initialFav]);

  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;
    setLoading(true);
    const next = !fav;
    try {
      if (next) {
        await api.post(`/favoritos/${complejoId}`);
      } else {
        await api.delete(`/favoritos/${complejoId}`);
      }
      setFav(next);
      onToggle?.(complejoId, next);
    } catch {
      setFav(next); // flip optimistically anyway
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleClick} disabled={loading} aria-label={fav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
      style={fav ? { backgroundColor: '#ef4444', padding: '0.65rem' } : { padding: '0.65rem' }}
      className={`rounded-full backdrop-blur-sm transition-all duration-200 ${
        fav ? 'text-white shadow-lg shadow-red-500/50 hover:scale-105' : 'bg-black/40 text-white hover:bg-black/60 hover:scale-105'
      } ${loading ? 'opacity-60' : ''}`}>
      <Heart size={15} fill={fav ? 'currentColor' : 'none'} />
    </button>
  );
}

// ─── Complex card ──────────────────────────────────────────────────────────
function ComplejoCard({ complejo, isFav, onFavToggle }) {
  const sports = uniqueSports(complejo.canchas);
  const badges = parseCaracteristicas(complejo.caracteristicas);
  const precio = avgPrice(complejo.canchas);
  // Support comma-separated image URLs (multi-image feature)
  const images = (complejo.imagen_url || '').split(',').map(s => s.trim()).filter(Boolean);
  const firstImage = images[0] || null;

  return (
    <div className="card flex flex-col overflow-hidden group fade-in">
      {/* Image — clickable link to detail */}
      <Link to={`/complejos/${complejo.id}`} className="relative h-48 bg-gradient-to-br from-slate-700 to-slate-800 overflow-hidden shrink-0 block">
        {firstImage ? (
          <img src={firstImage} alt={complejo.nombre}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={e => { e.target.style.display = 'none'; }} />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-600">
            <MapPin size={36} /><span className="text-xs">Sin imagen</span>
          </div>
        )}
        {images.length > 1 && (
          <div className="absolute top-3 left-3 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
            +{images.length - 1} fotos
          </div>
        )}
        <div className="absolute top-3 right-3" onClick={e => e.preventDefault()}>
          <FavBtn complejoId={complejo.id} initialFav={isFav} onToggle={onFavToggle} />
        </div>
        {precio && (
          <div 
            style={{ 
              padding: '0.2rem 0.45rem', 
              borderRadius: '0.5rem', 
              fontSize: '11px', 
              fontWeight: 'bold', 
              backgroundColor: 'rgba(0, 0, 0, 0.6)', 
              color: '#fff',
              position: 'absolute',
              bottom: '0.75rem',
              left: '0.75rem',
              lineHeight: '1.2',
              whiteSpace: 'nowrap'
            }}>
            Desde ${precio}/h
          </div>
        )}
        <div className="absolute bottom-3 right-3 flex gap-1 flex-wrap justify-end max-w-[60%]">
          {sports.map(s => (
            <span key={s} className={`badge ${SPORT_BADGE[s] || 'badge-green'} text-[10px] px-2 py-0.5`}>{s}</span>
          ))}
        </div>
      </Link>

      {/* Body */}
      <div style={{ padding: '1rem', paddingBottom: '0.6rem', gap: '0.75rem' }} className="flex flex-col flex-1">
        <div className="flex flex-col" style={{ gap: '0.25rem' }}>
          <Link to={`/complejos/${complejo.id}`}
            className="font-bold text-lg text-white leading-snug group-hover:text-green-400 transition-colors line-clamp-2 hover:text-green-400">
            {complejo.nombre}
          </Link>
          {complejo.valoracion && <StarRating value={complejo.valoracion} />}
        </div>
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <MapPin size={15} className="shrink-0 text-green-500" />
          <span className="line-clamp-1">{complejo.direccion}</span>
        </div>
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {badges.map(b => (
              <span key={b} style={{ padding: '0.4rem 0.8rem' }} className="flex items-center gap-1.5 rounded-full bg-slate-700/60 text-slate-300 border border-slate-600/40 text-xs">
                <Zap size={11} className="text-green-400" />{b}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Button at the bottom (edge-to-edge) */}
      <Link to={`/complejos/${complejo.id}`} 
        style={{ 
          display: 'flex', 
          width: '100%', 
          justifyContent: 'space-between', 
          borderRadius: '0 0 1rem 1rem',
          padding: '0.85rem 1rem',
          marginTop: '0.5rem'
        }} 
        className="btn-primary text-sm">
        <span>Reservar turno</span><ChevronRight size={16} />
      </Link>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="card overflow-hidden animate-pulse">
      <div className="h-48 bg-slate-700/50" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-slate-700/50 rounded w-3/4" />
        <div className="h-3 bg-slate-700/50 rounded w-1/2" />
        <div className="flex gap-2 mt-2"><div className="h-5 bg-slate-700/50 rounded-full w-20" /><div className="h-5 bg-slate-700/50 rounded-full w-24" /></div>
        <div className="h-10 bg-slate-700/50 rounded-xl mt-4" />
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────
export default function Home() {
  const [complejos, setComplejos] = useState([]);
  const [favIds,    setFavIds]    = useState(new Set());
  const [search,    setSearch]    = useState('');
  // Multi-select sports: Set of selected sport keys
  const [activeSports, setActiveSports] = useState(new Set());
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [complejosRes, favsRes] = await Promise.all([
        api.get('/complejos'),
        api.get('/favoritos').catch(() => ({ data: [] })),
      ]);
      setComplejos(complejosRes.data);
      setFavIds(new Set(favsRes.data.map(f => f.id_complejo)));
    } catch {
      setError('No se pudieron cargar los complejos. Verificá tu conexión.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleFavToggle = useCallback((id, isFav) => {
    setFavIds(prev => {
      const next = new Set(prev);
      if (isFav) next.add(id); else next.delete(id);
      return next;
    });
  }, []);

  // Toggle a sport filter (multi-select)
  const toggleSport = (key) => {
    setActiveSports(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const clearFilters = () => { setSearch(''); setActiveSports(new Set()); };
  const hasFilters   = search || activeSports.size > 0;

  const filtered = complejos.filter(c => {
    const matchSearch = !search ||
      c.nombre.toLowerCase().includes(search.toLowerCase()) ||
      c.direccion.toLowerCase().includes(search.toLowerCase());
    const matchSport = activeSports.size === 0 ||
      c.canchas?.some(ca => activeSports.has(ca.deporte));
    return matchSearch && matchSport;
  });

  return (
    <div className="page-container py-8 flex flex-col gap-5 md:gap-7">
      {/* Hero */}
      <div className="text-center flex flex-col items-center w-full" style={{ gap: '1rem' }}>
        <div className="inline-flex items-center gap-2 badge badge-green text-sm">
          <Zap size={13} />
          {complejos.length} complejos disponibles
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight text-center w-full">
          Encontrá tu <span className="gradient-text">cancha perfecta</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-xl mx-auto text-center w-full">
          Reservá canchas de pádel, fútbol y tenis en los mejores complejos de tu zona.
        </p>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        <input type="text" placeholder="Buscar por nombre o dirección…"
          value={search} onChange={e => setSearch(e.target.value)}
          className="input-field !pl-11 h-11 text-sm" />
        {search && (
          <button onClick={() => setSearch('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Multi-select sport chips */}
      <div className="flex items-center gap-3 flex-wrap">
        <Filter size={14} className="text-slate-500 shrink-0" />
        {SPORTS.map(s => {
          const active = activeSports.has(s.key);
          return (
            <button key={s.key} onClick={() => toggleSport(s.key)}
              style={{ padding: '0.4rem 0.8rem' }}
              className={`flex items-center gap-2 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] border ${
                active
                  ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/25 scale-105'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700 hover:border-slate-600'
              }`}>
              {s.icon}{s.label}
              {active && <X size={12} className="ml-0.5 opacity-80" />}
            </button>
          );
        })}
        {hasFilters && (
          <button onClick={clearFilters}
            style={{ padding: '0.4rem 0.8rem' }}
            className="flex items-center gap-1.5 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-700 transition-colors border border-dashed border-slate-700 ml-auto">
            <X size={12} /> Limpiar filtros
          </button>
        )}
      </div>

      {/* Results count */}
      {!loading && (
        <div className="flex items-center justify-between">
          <p className="text-slate-400 text-sm">
            {filtered.length === 0 ? 'Sin resultados' : `${filtered.length} complejo${filtered.length !== 1 ? 's' : ''} encontrado${filtered.length !== 1 ? 's' : ''}`}
          </p>
          <button onClick={fetchData} className="flex items-center gap-1.5 text-slate-500 hover:text-green-400 text-sm transition-colors">
            <RefreshCw size={13} /> Actualizar
          </button>
        </div>
      )}

      {error && <p className="text-center text-red-400 py-12">{error}</p>}

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="flex flex-col items-center text-center py-20">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-800 rounded-2xl mb-6">
            <MapPin size={28} className="text-slate-600" />
          </div>
          {complejos.length === 0 ? (
            <div className="flex flex-col gap-3">
              <h3 className="text-white font-semibold text-xl">No hay complejos disponibles</h3>
              <p className="text-slate-400 max-w-sm">Aún no se han creado complejos para explorar en la plataforma.</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-3 mb-6">
                <h3 className="text-white font-semibold text-xl">Sin resultados</h3>
                <p className="text-slate-400 max-w-sm">No encontramos complejos con esos criterios.</p>
              </div>
              <button onClick={clearFilters} className="btn-secondary text-sm">
                <X size={14} /> Limpiar filtros
              </button>
            </>
          )}
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(c => (
            <ComplejoCard key={c.id} complejo={c} isFav={favIds.has(c.id)} onFavToggle={handleFavToggle} />
          ))}
        </div>
      )}
    </div>
  );
}
