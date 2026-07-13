import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, MapPin, Star, ChevronRight, Trash2, RefreshCw, Zap } from 'lucide-react';
import api from '../services/api';

function parseCaracteristicas(str) {
  if (!str) return [];
  return str.split(',').map(s => s.trim()).filter(Boolean).slice(0, 3);
}

function StarRating({ value }) {
  const v = Number(value) || 5;
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={12}
          fill={i <= Math.round(v) ? 'currentColor' : 'none'}
          className={i <= Math.round(v) ? 'text-yellow-400' : 'text-slate-600'} />
      ))}
      <span className="text-yellow-400 text-xs font-semibold ml-0.5">{v.toFixed(1)}</span>
    </div>
  );
}

function FavoritoCard({ fav, onRemove }) {
  const complejo = fav.complejo;
  const images = (complejo?.imagen_url || '').split(',').map(s => s.trim()).filter(Boolean);
  const firstImage = images[0] || null;
  const badges = parseCaracteristicas(complejo?.caracteristicas);
  const [removing, setRemoving] = useState(false);

  const handleRemove = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setRemoving(true);
    try {
      await api.delete(`/favoritos/${complejo.id}`);
      onRemove(fav.id_complejo);
    } catch {
      setRemoving(false);
    }
  };

  return (
    <div className="card flex flex-col overflow-hidden group fade-in">
      <div className="relative h-48 bg-gradient-to-br from-slate-700 to-slate-800 overflow-hidden shrink-0">
        {firstImage ? (
          <img src={firstImage} alt={complejo?.nombre}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={e => { e.target.style.display = 'none'; }} />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-600">
            <MapPin size={36} /><span className="text-xs">Sin imagen</span>
          </div>
        )}
        
        {/* Remove button in the top-right corner */}
        <button onClick={handleRemove} disabled={removing} aria-label="Eliminar de favoritos"
          style={{ 
            backgroundColor: '#ef4444', 
            padding: '0.85rem',
            position: 'absolute',
            top: '0.75rem',
            right: '0.75rem'
          }}
          className="rounded-full text-white shadow-lg hover:bg-red-600 transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer">
          <Trash2 size={18} />
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: '1rem', paddingBottom: '0.6rem', gap: '0.75rem' }} className="flex flex-col flex-1">
        <div className="flex flex-col" style={{ gap: '0.25rem' }}>
          <Link to={`/complejos/${complejo?.id}`}
            className="font-bold text-lg text-white leading-snug group-hover:text-green-400 transition-colors line-clamp-2 hover:text-green-400">
            {complejo?.nombre}
          </Link>
          {complejo?.valoracion && <StarRating value={complejo.valoracion} />}
        </div>
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <MapPin size={15} className="shrink-0 text-green-500" />
          <span className="line-clamp-1">{complejo?.direccion}</span>
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
      <Link to={`/complejos/${complejo?.id}`} 
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
      <div className="h-44 bg-slate-700/50" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-slate-700/50 rounded w-3/4" />
        <div className="h-3 bg-slate-700/50 rounded w-1/2" />
        <div className="h-10 bg-slate-700/50 rounded-xl mt-4" />
      </div>
    </div>
  );
}

export default function Favoritos() {
  const [favs,    setFavs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const fetchFavs = () => {
    setLoading(true);
    api.get('/favoritos')
      .then(r => setFavs(r.data))
      .catch(() => setError('No se pudieron cargar tus favoritos.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchFavs(); }, []);

  const handleRemove = (id_complejo) => {
    setFavs(prev => prev.filter(f => f.id_complejo !== id_complejo));
  };

  return (
    <div className="page-container py-8">
      <div style={{ marginBottom: '2.5rem' }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white">
            Mis Favoritos
          </h1>
          <p className="text-slate-400 mt-1">
            {!loading && `${favs.length} complejo${favs.length !== 1 ? 's' : ''} guardado${favs.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button onClick={fetchFavs} className="btn-secondary text-sm gap-2">
          <RefreshCw size={14} /> Actualizar
        </button>
      </div>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {error && <p className="text-center text-red-400 py-12">{error}</p>}

      {!loading && !error && favs.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', padding: '5rem 0' }} className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-800 rounded-2xl">
            <Heart size={28} className="text-slate-600" />
          </div>
          <h3 className="text-white font-semibold text-lg">Sin favoritos aún</h3>
          <p className="text-slate-500">Marcá un complejo con el corazón ❤️ para guardarlo acá.</p>
          <Link to="/" className="btn-primary inline-flex">Explorar complejos</Link>
        </div>
      )}

      {!loading && !error && favs.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {favs.map(f => (
            <FavoritoCard key={f.id} fav={f} onRemove={handleRemove} />
          ))}
        </div>
      )}
    </div>
  );
}
