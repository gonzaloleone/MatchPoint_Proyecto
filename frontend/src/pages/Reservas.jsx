import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, MessageCircle, CheckCircle2,
  XCircle, AlertCircle, RefreshCw, ChevronRight, ChevronUp, ChevronDown, X, Trash2
} from 'lucide-react';
import api from '../services/api';

const ESTADO_STYLE = {
  PENDIENTE:  { cls: 'badge-yellow', icon: AlertCircle,    label: 'Pendiente' },
  CONFIRMADA: { cls: 'badge-green',  icon: CheckCircle2,   label: 'Confirmada' },
  CANCELADA:  { cls: 'text-slate-500 bg-slate-700/40 badge', icon: XCircle, label: 'Cancelada' },
};
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

const DEPORTE_EMOJI = {
  FUTBOL: <FutbolIcon size={16} />,
  PADEL: <PadelIcon size={16} />,
  TENIS: <TenisIcon size={16} />,
};

const SPORT_EMOJI_TEXT = { FUTBOL: '⚽', PADEL: '🎾', TENIS: '🏸' };

function formatDate(str) {
  if (!str) return '';
  const [y, m, d] = str.split('-');
  return `${d}/${m}/${y}`;
}
function formatTime(str) {
  return str ? str.slice(0, 5) : '';
}

function buildWhatsAppLink(reserva) {
  const wa = reserva.complejo?.telefono_whatsapp;
  if (!wa) return null;
  const phone   = wa.replace(/\D/g, '');
  const cancha  = reserva.cancha?.nombre_numero  ?? 'cancha';
  const complejo = reserva.complejo?.nombre ?? 'el complejo';
  const deporte  = reserva.cancha?.deporte ?? '';
  const fecha    = formatDate(reserva.fecha);
  const desde    = formatTime(reserva.hora_inicio);
  const hasta    = formatTime(reserva.hora_fin);
  const total    = Number(reserva.total_pago).toFixed(0);

  const text = encodeURIComponent(
    `¡Hola! Realicé la reserva N°${reserva.id} en *${complejo}* para ${SPORT_EMOJI_TEXT[deporte] || ''} *${cancha}* el *${fecha}* de *${desde}* a *${hasta}*. Total: $${total}. ¿Me podrían confirmar el turno? ¡Gracias!`
  );
  return `https://wa.me/${phone}?text=${text}`;
}

function ReservaCard({ reserva, onCancelled }) {
  const estado = ESTADO_STYLE[reserva.estado] ?? ESTADO_STYLE.PENDIENTE;
  const EstadoIcon = estado.icon;
  const waLink = buildWhatsAppLink(reserva);
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    if (!window.confirm('¿Seguro que querés cancelar esta reserva?')) return;
    setCancelling(true);
    try {
      await api.patch(`/reservas/${reserva.id}/estado`, null, { params: { nuevo_estado: 'CANCELADA' } });
      if (onCancelled) onCancelled(reserva.id);
    } catch (err) {
      alert(err.response?.data?.detail || 'No se pudo cancelar la reserva.');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div style={{ padding: '1rem', gap: '1rem' }} className="card flex flex-col fade-in">
      {/* Header: complejo name + status */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-white font-bold text-base leading-snug">
            {reserva.complejo?.nombre ?? '—'}
          </p>
          <p className="text-slate-400 text-sm mt-0.5">
            {DEPORTE_EMOJI[reserva.cancha?.deporte]} {reserva.cancha?.nombre_numero}
          </p>
        </div>
        <div className={`badge ${estado.cls} flex items-center gap-1.5 shrink-0`}>
          <EstadoIcon size={12} />
          {estado.label}
        </div>
      </div>

      {/* Date / time / price row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-800/60 rounded-xl p-3 text-center">
          <Calendar size={14} className="mx-auto text-green-500 mb-1" />
          <p className="text-white text-sm font-semibold">{formatDate(reserva.fecha)}</p>
          <p className="text-slate-500 text-xs">Fecha</p>
        </div>
        <div className="bg-slate-800/60 rounded-xl p-3 text-center">
          <Clock size={14} className="mx-auto text-green-500 mb-1" />
          <p className="text-white text-sm font-semibold">
            {formatTime(reserva.hora_inicio)}–{formatTime(reserva.hora_fin)}
          </p>
          <p className="text-slate-500 text-xs">Horario</p>
        </div>
        <div className="bg-slate-800/60 rounded-xl p-3 text-center">
          <p className="text-green-400 font-bold text-base">${Number(reserva.total_pago).toFixed(0)}</p>
          <p className="text-slate-500 text-xs mt-0.5">Total</p>
        </div>
      </div>

      {/* WhatsApp button — show when PENDIENTE and phone is available */}
      {reserva.estado === 'PENDIENTE' && waLink && (
        <a href={waLink} target="_blank" rel="noopener noreferrer"
          style={{ padding: '0.75rem 1rem' }}
          className="flex items-center justify-center gap-2.5 w-full rounded-2xl font-bold text-base
            bg-[#25D366] hover:bg-[#20c05c] text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-green-500/25">
          <MessageCircle size={19} />
          Confirmar el pago por WhatsApp
        </a>
      )}

      {/* Footer actions */}
      <div className="flex items-center justify-between gap-3 pt-1">
        {reserva.complejo?.id && (
          <Link to={`/complejos/${reserva.complejo.id}`}
            style={{ fontSize: '0.85rem', fontWeight: '600', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '4px' }}
            className="hover:underline transition-colors">
            Ver complejo <ChevronRight size={14} />
          </Link>
        )}
        {reserva.estado === 'PENDIENTE' && (
          <button
            onClick={handleCancel}
            disabled={cancelling}
            style={{ 
              fontSize: '0.85rem', 
              fontWeight: '600', 
              color: '#f87171', 
              borderColor: 'rgba(239, 68, 68, 0.4)', 
              padding: '0.5rem 1rem', 
              borderRadius: '0.75rem',
              backgroundColor: 'rgba(239, 68, 68, 0.1)'
            }}
            className="flex items-center gap-1.5 border hover:bg-red-500/20 transition-all duration-200 cursor-pointer disabled:opacity-50 ml-auto"
          >
            <X size={14} />
            {cancelling ? 'Cancelando…' : 'Cancelar reserva'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function Reservas() {
  const [reservas,  setReservas]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [clearing,  setClearing]  = useState(false);
  const [showHistorial, setShowHistorial] = useState(false);

  const handleCancelled = (id) => {
    setReservas(prev => prev.map(r => r.id === id ? { ...r, estado: 'CANCELADA' } : r));
  };

  const fetchReservas = () => {
    setLoading(true);
    api.get('/reservas/')
      .then(r => setReservas(r.data))
      .catch(() => setError('No se pudieron cargar tus reservas.'))
      .finally(() => setLoading(false));
  };

  const handleClearHistorial = async () => {
    const canceladas = reservas.filter(r => r.estado === 'CANCELADA').length;
    if (canceladas === 0) return;
    if (!window.confirm(`¿Eliminar las ${canceladas} reserva${canceladas !== 1 ? 's' : ''} cancelada${canceladas !== 1 ? 's' : ''} del historial? Esta acción es permanente.`)) return;
    setClearing(true);
    try {
      await api.delete('/reservas/historial');
      setReservas(prev => prev.filter(r => r.estado !== 'CANCELADA'));
    } catch {
      alert('No se pudo limpiar el historial. Intentá de nuevo.');
    } finally {
      setClearing(false);
    }
  };

  useEffect(() => { fetchReservas(); }, []);

  const pendientes  = reservas.filter(r => r.estado === 'PENDIENTE');
  const otras       = reservas.filter(r => r.estado !== 'PENDIENTE');

  return (
    <div className="page-container py-8">

      {/* Page header */}
      <div style={{ marginBottom: '2.5rem', display: 'flex', gap: '1rem' }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Mis Reservas</h1>
          <p className="text-slate-400 mt-1">
            {!loading && `${reservas.length} reserva${reservas.length !== 1 ? 's' : ''} en total`}
          </p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button onClick={fetchReservas}
            style={{ display: 'inline-flex', flex: 1, justifyContent: 'center', alignItems: 'center', height: '2.75rem', border: '1px solid #334155', whiteSpace: 'nowrap' }}
            className="btn-secondary text-sm gap-2">
            <RefreshCw size={14} /> Actualizar
          </button>
          <Link to="/" 
            style={{ display: 'inline-flex', flex: 1, justifyContent: 'center', alignItems: 'center', height: '2.75rem', border: '1px solid transparent', whiteSpace: 'nowrap' }}
            className="btn-primary text-sm gap-2">
            Nueva reserva <ChevronRight size={14} />
          </Link>
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card h-56 animate-pulse bg-slate-800/50" />
          ))}
        </div>
      )}

      {/* Error */}
      {error && <p className="text-red-400 text-center py-12">{error}</p>}

      {/* Empty */}
      {!loading && !error && reservas.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', padding: '5rem 0' }} className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-800 rounded-2xl">
            <Calendar size={28} className="text-slate-600" />
          </div>
          <h3 className="text-white font-semibold text-lg">Sin reservas aún</h3>
          <p className="text-slate-500">Todavía no realizaste ninguna reserva.</p>
          <Link to="/" className="btn-primary inline-flex">Buscar canchas</Link>
        </div>
      )}

      {/* Pendientes first */}
      {!loading && pendientes.length > 0 && (
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ marginBottom: '1.5rem' }} className="text-lg font-bold text-white flex items-center gap-2">
            <span className="badge badge-yellow">⏳ Pendientes de pago</span>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {pendientes.map(r => <ReservaCard key={r.id} reserva={r} onCancelled={handleCancelled} />)}
          </div>
        </section>
      )}

      {/* Confirmed / cancelled — collapsible */}
      {!loading && otras.length > 0 && (
        <section>
          <div style={{ marginBottom: '1.5rem' }} className="flex items-center justify-between">
            <button
              onClick={() => setShowHistorial(v => !v)}
              className="flex items-center gap-2 group"
            >
              <h2 className="text-lg font-bold text-white group-hover:text-slate-300 transition-colors">Historial</h2>
              <span className="text-slate-400 group-hover:text-slate-200 transition-colors">
                {showHistorial ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </span>
              <span className="text-slate-500 text-sm font-normal">({otras.length})</span>
            </button>
            {showHistorial && reservas.some(r => r.estado === 'CANCELADA') && (
              <button
                onClick={handleClearHistorial}
                disabled={clearing}
                style={{ 
                  fontSize: '0.85rem', 
                  fontWeight: '600', 
                  padding: '0.5rem 1rem', 
                  borderRadius: '0.75rem',
                  borderColor: 'rgba(239, 68, 68, 0.4)',
                  color: '#f87171',
                  backgroundColor: 'rgba(239, 68, 68, 0.05)'
                }}
                className="flex items-center gap-1.5 border hover:bg-red-500/10 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Trash2 size={14} />
                {clearing ? 'Limpiando…' : 'Limpiar canceladas'}
              </button>
            )}
          </div>
          {showHistorial && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 fade-in">
              {otras.map(r => <ReservaCard key={r.id} reserva={r} onCancelled={handleCancelled} />)}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
