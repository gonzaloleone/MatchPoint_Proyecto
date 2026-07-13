import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createPortal } from 'react-dom';
import {
  MapPin, Phone, Star, ChevronLeft, Calendar, Clock,
  MessageCircle, CheckCircle, X, AlertCircle, Zap, CreditCard,
  ChevronLeft as ChevLeft, ChevronRight as ChevRight
} from 'lucide-react';
import api from '../services/api';

// ── Helpers ───────────────────────────────────────────────────────────────────
function StarRating({ value }) {
  const v = Number(value) || 5;
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={15}
          fill={i <= Math.round(v) ? 'currentColor' : 'none'}
          className={i <= Math.round(v) ? 'text-yellow-400' : 'text-slate-600'} />
      ))}
      <span className="text-yellow-400 text-sm font-semibold ml-1">{v.toFixed(1)}</span>
    </div>
  );
}

function InteractiveRating({ complejoId, onRated }) {
  const { user } = useAuth();
  const lsKey = `mp_rated_${user?.id}_${complejoId}`;
  const alreadyRated = Boolean(localStorage.getItem(lsKey));

  const [hoverIdx, setHoverIdx] = useState(0);
  const [rating,   setRating]   = useState(alreadyRated ? parseInt(localStorage.getItem(lsKey) || '0') : 0);
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(alreadyRated);

  const handleRate = async (val) => {
    if (loading || success) return;
    setLoading(true);
    try {
      const res = await api.patch(`/complejos/${complejoId}/valorar`, { valoracion: val });
      setRating(val);
      setSuccess(true);
      localStorage.setItem(lsKey, String(val));
      if (onRated) onRated(res.data.valoracion);
    } catch {
      // noop
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <span className="text-xs text-green-400 font-semibold flex items-center gap-1">
        <CheckCircle size={14} />
        {alreadyRated && !rating ? 'Ya valoraste este complejo' : '¡Gracias por valorar!'}
        &nbsp;{'★'.repeat(rating || parseInt(localStorage.getItem(lsKey) || '0'))}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1" onMouseLeave={() => setHoverIdx(0)}>
        {[1, 2, 3, 4, 5].map((star) => {
          const active = hoverIdx ? star <= hoverIdx : star <= rating;
          return (
            <button
              key={star}
              type="button"
              disabled={loading}
              onMouseEnter={() => setHoverIdx(star)}
              onClick={() => handleRate(star)}
              className={`transition-all duration-150 p-0.5 rounded focus:outline-none hover:scale-110 ${
                active ? 'text-yellow-400' : 'text-slate-600 hover:text-yellow-400'
              }`}
            >
              <Star size={18} fill={active ? 'currentColor' : 'none'} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function parseCaracteristicas(str) {
  if (!str) return [];
  return str.split(',').map(s => s.trim()).filter(Boolean);
}

// Start times: 09:00 – 22:00 (can start as late as 22:00 for a 22-23 slot)
const START_SLOTS = Array.from({ length: 14 }, (_, i) => {
  const h = 9 + i;
  return `${String(h).padStart(2,'0')}:00`;
});

// End times: 10:00 – 23:00
const END_SLOTS = Array.from({ length: 14 }, (_, i) => {
  const h = 10 + i;
  return `${String(h).padStart(2,'0')}:00`;
});

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
const DEPORTE_COLOR = { FUTBOL: 'badge-blue', PADEL: 'badge-green', TENIS: 'badge-yellow' };

// Check if a proposed slot overlaps with any booked slot
// Uses strict inequality: overlap only if start1 < end2 AND end1 > start2
function slotsOverlap(bookedSlots, propStart, propEnd) {
  return bookedSlots.some(slot => {
    const bs = slot.hora_inicio.slice(0, 5);
    const be = slot.hora_fin.slice(0, 5);
    return bs < propEnd && be > propStart;
  });
}

// ── Lightbox ──────────────────────────────────────────────────────────────────
function Lightbox({ images, startIdx, onClose }) {
  const [idx, setIdx] = useState(startIdx);
  const prev = () => setIdx(i => (i - 1 + images.length) % images.length);
  const next = () => setIdx(i => (i + 1) % images.length);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape')      onClose();
      if (e.key === 'ArrowLeft')   prev();
      if (e.key === 'ArrowRight')  next();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 fade-in"
      style={{ isolation: 'isolate' }}
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
      >
        <X size={22} />
      </button>

      {/* Counter */}
      {images.length > 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 text-white text-sm px-3 py-1 rounded-full">
          {idx + 1} / {images.length}
        </div>
      )}

      {/* Image */}
      <img
        src={images[idx]}
        alt={`Imagen ${idx + 1}`}
        className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl"
        onClick={e => e.stopPropagation()}
      />

      {/* Arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={e => { e.stopPropagation(); prev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors"
          >
            <ChevLeft size={24} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); next(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors"
          >
            <ChevRight size={24} />
          </button>

          {/* Dot strip */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={e => { e.stopPropagation(); setIdx(i); }}
                className={`w-2.5 h-2.5 rounded-full transition-all ${i === idx ? 'bg-white scale-110' : 'bg-white/40 hover:bg-white/70'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>,
    document.body
  );
}

// ── Image gallery (thumbnail strip + click to open lightbox) ──────────────────
function ImageGallery({ images, nombre }) {
  const [idx,      setIdx]      = useState(0);
  const [lightbox, setLightbox] = useState(false);

  if (!images.length) return (
    <div className="w-full h-64 md:h-80 flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-800 text-slate-600">
      <MapPin size={48} />
    </div>
  );

  return (
    <>
      {lightbox && <Lightbox images={images} startIdx={idx} onClose={() => setLightbox(false)} />}

      <div className="relative h-64 md:h-80 bg-slate-800 overflow-hidden">
        {/* Main image — click opens lightbox */}
        <img
          src={images[idx]}
          alt={nombre}
          className="w-full h-full object-cover transition-opacity duration-300 cursor-zoom-in"
          onClick={() => setLightbox(true)}
          onError={e => { e.currentTarget.style.opacity = '0'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent pointer-events-none" />

        {/* "Ver fotos" hint */}
        <div className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-black/50 text-white text-xs px-2.5 py-1.5 rounded-full backdrop-blur-sm pointer-events-none">
          🔍 {images.length > 1 ? `${images.length} fotos` : 'Ver foto'}
        </div>

        {images.length > 1 && (
          <>
            <button
              onClick={() => setIdx(i => (i - 1 + images.length) % images.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
            >
              <ChevLeft size={18} />
            </button>
            <button
              onClick={() => setIdx(i => (i + 1) % images.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
            >
              <ChevRight size={18} />
            </button>
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <button key={i} onClick={() => setIdx(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${i === idx ? 'bg-white' : 'bg-white/40'}`} />
              ))}
            </div>
            <div className="absolute top-3 left-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
              {idx + 1} / {images.length}
            </div>
          </>
        )}
      </div>
    </>
  );
}

// ── Confirmation Modal ────────────────────────────────────────────────────────
function ConfirmModal({ cancha, fecha, horaInicio, horaFin, total, onConfirm, onClose, loading, error }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" style={{ isolation: 'isolate' }}>
      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }} className="card w-full max-w-sm fade-in">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Confirmar reserva</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="flex justify-between text-sm"><span className="text-slate-400">Cancha</span><span className="text-white font-medium">{cancha.nombre_numero}</span></div>
          <div className="flex justify-between text-sm items-center">
            <span className="text-slate-400">Deporte</span>
            <span className={`badge ${DEPORTE_COLOR[cancha.deporte]}`}>{DEPORTE_EMOJI[cancha.deporte]} {cancha.deporte}</span>
          </div>
          <div className="flex justify-between text-sm"><span className="text-slate-400">Fecha</span><span className="text-white font-medium">{fecha}</span></div>
          <div className="flex justify-between text-sm"><span className="text-slate-400">Horario</span><span className="text-white font-medium">{horaInicio} – {horaFin}</span></div>
          <div style={{ borderTop: '1px solid #334155', paddingTop: '1rem' }} className="flex justify-between">
            <span className="text-slate-300 font-semibold">Total a pagar</span>
            <span className="text-green-400 text-xl font-bold">${Number(total).toFixed(0)}</span>
          </div>
        </div>
        {error && (
          <div style={{ padding: '0.75rem 1rem' }} className="bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex gap-2">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />{error}
          </div>
        )}
        <div className="flex" style={{ gap: '0.75rem' }}>
          <button onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
          <button onClick={onConfirm} disabled={loading} className="btn-primary flex-1 disabled:opacity-60">
            {loading ? 'Reservando…' : <><CheckCircle size={16} /> Confirmar</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Cancha selector card ──────────────────────────────────────────────────────
function CanchaCard({ cancha, selected, onSelect }) {
  return (
    <button onClick={() => onSelect(cancha)}
      style={{ padding: '1rem' }}
      className={`w-full text-left rounded-xl border transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] ${
        selected ? 'border-green-500 bg-green-500/10 shadow-lg shadow-green-500/10' : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
      }`}>
      <div className="flex items-center justify-between w-full">
        <div className="flex flex-col gap-1.5 items-start">
          <p className="text-white font-bold text-base">{cancha.nombre_numero}</p>
          <span className={`badge ${DEPORTE_COLOR[cancha.deporte]} text-xs`}>
            {DEPORTE_EMOJI[cancha.deporte]} {cancha.deporte}
          </span>
        </div>
        <div className="text-right">
          <p className="text-green-400 font-bold text-lg">${Number(cancha.precio_hora).toFixed(0)}</p>
          <p className="text-slate-500 text-xs">por hora</p>
        </div>
      </div>
    </button>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ComplejoDetalle() {
  const { id } = useParams();
  const [complejo,  setComplejo]  = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');

  // Booking state
  const [selectedCancha,  setSelectedCancha]  = useState(null);
  const [fecha,           setFecha]           = useState('');
  const [horaInicio,      setHoraInicio]      = useState('');
  const [horaFin,         setHoraFin]         = useState('');
  const [bookedSlots,     setBookedSlots]     = useState([]);
  const [loadingSlots,    setLoadingSlots]    = useState(false);
  const [showModal,       setShowModal]       = useState(false);
  const [bookingLoading,  setBookingLoading]  = useState(false);
  const [bookingError,    setBookingError]    = useState('');

  const today = new Date().toISOString().split('T')[0];
  const maxDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  })();

  useEffect(() => {
    api.get(`/complejos/${id}`)
      .then(r => setComplejo(r.data))
      .catch(() => setError('No se pudo cargar el complejo.'))
      .finally(() => setLoading(false));
  }, [id]);

  // Fetch booked slots when cancha + date change
  useEffect(() => {
    if (!selectedCancha || !fecha) { setBookedSlots([]); return; }
    setLoadingSlots(true);
    setHoraInicio('');
    setHoraFin('');
    api.get(`/canchas/${selectedCancha.id}/reservas`, { params: { fecha } })
      .then(r => setBookedSlots(r.data))
      .catch(() => setBookedSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [selectedCancha, fecha]);

  // Auto-set horaFin 1h after horaInicio
  useEffect(() => {
    if (!horaInicio) { setHoraFin(''); return; }
    const h = parseInt(horaInicio.split(':')[0]);
    const next = h + 1;
    if (next <= 23) {
      const proposed = `${String(next).padStart(2,'0')}:00`;
      // Only auto-set if the suggested end doesn't cause overlap with other bookings
      if (!slotsOverlap(bookedSlots, horaInicio, proposed)) {
        setHoraFin(proposed);
      }
    }
  }, [horaInicio, bookedSlots]);

  const total = useMemo(() => {
    if (!selectedCancha || !horaInicio || !horaFin) return null;
    const [sh, sm] = horaInicio.split(':').map(Number);
    const [eh, em] = horaFin.split(':').map(Number);
    const hours = (eh * 60 + em - sh * 60 - sm) / 60;
    return hours > 0 ? Number(selectedCancha.precio_hora) * hours : null;
  }, [selectedCancha, horaInicio, horaFin]);

  // Determine which start slots are fully blocked
  const isStartBlocked = (slot) => {
    // A start slot is blocked if ALL possible 1h+ extensions from it overlap a booking
    const slotEnd1h = `${String(parseInt(slot) + 1).padStart(2,'0')}:00`;
    return slotsOverlap(bookedSlots, slot, '23:00') &&
           slotsOverlap(bookedSlots, slot, slotEnd1h);
  };

  // End slots: after horaInicio, no overlap, and max 3 hours after start
  const validEndSlots = horaInicio
    ? END_SLOTS.filter(t => {
        if (t <= horaInicio) return false;
        if (slotsOverlap(bookedSlots, horaInicio, t)) return false;
        // Cap at 3 hours max
        const [sh] = horaInicio.split(':').map(Number);
        const [eh] = t.split(':').map(Number);
        return (eh - sh) <= 3;
      })
    : [];

  const canBook = selectedCancha && fecha && horaInicio && horaFin && total && total > 0;

  const handleConfirm = async () => {
    setBookingLoading(true);
    setBookingError('');
    try {
      await api.post('/reservas/', {
        id_cancha: selectedCancha.id,
        fecha,
        hora_inicio: horaInicio + ':00',
        hora_fin:    horaFin + ':00',
      });
      setShowModal(false);
      window.location.href = '/reservas';
    } catch (err) {
      setBookingError(err.response?.data?.detail || 'No se pudo completar la reserva.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) return (
    <div className="page-container py-12">
      <div className="animate-pulse space-y-4">
        <div className="h-64 bg-slate-800 rounded-2xl" />
        <div className="h-8 bg-slate-800 rounded w-1/2" />
        <div className="h-4 bg-slate-800 rounded w-1/3" />
      </div>
    </div>
  );

  if (error || !complejo) return (
    <div className="page-container py-20 text-center text-slate-400">
      <AlertCircle size={40} className="mx-auto mb-3 opacity-40" />
      <p>{error || 'Complejo no encontrado.'}</p>
      <Link to="/" className="btn-secondary inline-flex mt-4 text-sm"><ChevronLeft size={14} />Volver</Link>
    </div>
  );

  const images = (complejo.imagen_url || '').split(',').map(s => s.trim()).filter(Boolean);
  const badges = parseCaracteristicas(complejo.caracteristicas);

  return (
    <>
      {showModal && total && (
        <ConfirmModal
          cancha={selectedCancha} fecha={fecha} horaInicio={horaInicio} horaFin={horaFin} total={total}
          onConfirm={handleConfirm} onClose={() => { setShowModal(false); setBookingError(''); }}
          loading={bookingLoading} error={bookingError}
        />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }} className="page-container py-8">
        <div>
          <Link to="/" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm">
            <ChevronLeft size={16} /> Volver al catálogo
          </Link>
        </div>

        {/* ── Header card ────────────────────────────────────────────── */}
        <div className="card overflow-hidden">
          <ImageGallery images={images} nombre={complejo.nombre} />

          <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between" style={{ gap: '1rem' }}>
              <div>
                <h1 className="text-3xl font-extrabold text-white mb-1">{complejo.nombre}</h1>
                {complejo.valoracion && <StarRating value={complejo.valoracion} />}
              </div>
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.85rem', 
                  padding: '0.6rem 1.25rem', 
                  backgroundColor: 'rgba(30, 41, 59, 0.8)', 
                  borderColor: 'rgba(51, 65, 85, 0.6)',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderRadius: '1rem'
                }}
                className="shrink-0 self-start sm:self-auto">
                <span className="text-xs font-semibold text-slate-300">Valorar complejo:</span>
                <InteractiveRating complejoId={complejo.id} onRated={(newVal) => setComplejo(c => ({ ...c, valoracion: newVal }))} />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:flex-wrap" style={{ gap: '2rem' }}>
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-green-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">Dirección</p>
                  <p className="text-white">{complejo.direccion}</p>
                </div>
              </div>
              {complejo.telefono && (
                <div className="flex items-start gap-3">
                  <Phone size={18} className="text-green-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">Teléfono</p>
                    <p className="text-white">{complejo.telefono}</p>
                  </div>
                </div>
              )}
              {complejo.telefono_whatsapp && (
                <div className="flex items-start gap-3">
                  <MessageCircle size={18} className="text-green-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">WhatsApp</p>
                    <a href={`https://wa.me/${complejo.telefono_whatsapp.replace(/\D/g,'')}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-green-400 hover:text-green-300 transition-colors font-medium block">
                      Contactar por WhatsApp
                    </a>
                  </div>
                </div>
              )}
            </div>

            {badges.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {badges.map(b => (
                  <span key={b} style={{ padding: '0.5rem 1rem' }} className="flex items-center gap-1.5 rounded-full bg-slate-700/60 text-slate-300 border border-slate-600/40 text-sm">
                    <Zap size={11} className="text-green-400" />{b}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-2" style={{ gap: '2rem' }}>
          {/* Cancha list */}
          <div>
            <h2 style={{ marginBottom: '1.25rem' }} className="text-xl font-bold text-white">Canchas disponibles</h2>
            {!complejo.canchas?.length ? (
              <p className="text-slate-500 text-sm">Este complejo aún no tiene canchas registradas.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {complejo.canchas.map(c => (
                  <CanchaCard key={c.id} cancha={c}
                    selected={selectedCancha?.id === c.id}
                    onSelect={setSelectedCancha} />
                ))}
              </div>
            )}
          </div>
 
          {/* Date/time selector */}
          <div>
            <h2 style={{ marginBottom: '1.25rem' }} className="text-xl font-bold text-white">Seleccioná fecha y horario</h2>
            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }} className="card">
              {!selectedCancha && (
                <p className="text-slate-500 text-sm flex items-center gap-2">
                  <AlertCircle size={14} className="text-yellow-500" />
                  Primero seleccioná una cancha a la izquierda.
                </p>
              )}

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                  <Calendar size={14} className="text-green-500" /> Fecha
                </label>
                <input type="date" min={today} max={maxDate} value={fecha}
                  onChange={e => setFecha(e.target.value)}
                  disabled={!selectedCancha}
                  className="input-field disabled:opacity-40 disabled:cursor-not-allowed" />
              </div>

              {/* Loading slots */}
              {loadingSlots && (
                <p className="text-slate-500 text-xs animate-pulse">Verificando disponibilidad…</p>
              )}

              {/* Booked slots indicator */}
              {!loadingSlots && bookedSlots.length > 0 && (
                <div 
                  style={{ 
                    padding: '0.65rem 0.85rem', 
                    backgroundColor: 'rgba(250, 204, 21, 0.08)', 
                    borderColor: 'rgba(250, 204, 21, 0.2)', 
                    borderWidth: '1px', 
                    borderStyle: 'solid', 
                    borderRadius: '0.75rem',
                    color: '#facc15',
                    fontSize: '0.75rem',
                    lineHeight: '1.5'
                  }}>
                  ⚠️ Esta cancha ya tiene {bookedSlots.length} turno{bookedSlots.length > 1 ? 's' : ''} reservado{bookedSlots.length > 1 ? 's' : ''} para este día.
                  Los bloques marcados en rojo no están disponibles.
                </div>
              )}

              {/* Time row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-1.5">
                    <Clock size={14} className="text-green-500" /> Desde
                  </label>
                  <select value={horaInicio} onChange={e => setHoraInicio(e.target.value)}
                    disabled={!selectedCancha || !fecha || loadingSlots}
                    className="input-field disabled:opacity-40 disabled:cursor-not-allowed">
                    <option value="">--:--</option>
                    {START_SLOTS.map(t => {
                      const blocked = slotsOverlap(bookedSlots, t, `${String(parseInt(t)+1).padStart(2,'0')}:00`);
                      return (
                        <option key={t} value={t} disabled={blocked}>
                          {t}{blocked ? ' — ocupado' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-1.5">
                    <Clock size={14} className="text-green-500" /> Hasta
                  </label>
                  <select value={horaFin} onChange={e => setHoraFin(e.target.value)}
                    disabled={!horaInicio || loadingSlots}
                    className="input-field disabled:opacity-40 disabled:cursor-not-allowed">
                    <option value="">--:--</option>
                    {validEndSlots.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {/* Price preview */}
              {total && (
                <div style={{ padding: '1.25rem' }} className="rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-300 text-sm">
                    <CreditCard size={16} className="text-green-400" /> Total estimado
                  </div>
                  <span className="text-green-400 text-2xl font-bold">${total.toFixed(0)}</span>
                </div>
              )}

              <button onClick={() => setShowModal(true)} disabled={!canBook}
                className="btn-primary w-full text-base py-3 disabled:opacity-40 disabled:cursor-not-allowed">
                <CheckCircle size={18} /> Reservar turno
              </button>

              <p className="text-slate-600 text-xs text-center">
                Horario operativo: 09:00 – 23:00 · El pago se confirma por WhatsApp
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
