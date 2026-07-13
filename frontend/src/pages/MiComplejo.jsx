import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Building2, Plus, Save, Pencil, AlertCircle, CheckCircle,
  Trash2, X, MapPin, Star, Zap, ChevronDown, ChevronUp,
  Calendar, Clock, Users, CreditCard, ChevronLeft, ChevronRight
} from 'lucide-react';
import api from '../services/api';

const DEPORTES = ['PADEL', 'FUTBOL', 'TENIS'];
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

const ESTADO_OPTIONS = [
  { value: 'PENDIENTE',  label: '⏳ Pendiente de pago',  cls: 'badge-yellow' },
  { value: 'CONFIRMADA', label: '✅ Pago aprobado',       cls: 'badge-green'  },
  { value: 'CANCELADA',  label: '❌ Cancelada',           cls: 'text-slate-400 badge' },
];

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">{label}</label>
      {children}
    </div>
  );
}

// ── Notification banner ───────────────────────────────────────────────────────
function Notif({ msg }) {
  if (!msg.text) return null;
  return (
    <div className={`flex items-center gap-3 p-4 rounded-xl border fade-in ${
      msg.type === 'ok'
        ? 'bg-green-500/10 border-green-500/30 text-green-400'
        : 'bg-red-500/10 border-red-500/30 text-red-400'
    }`}>
      {msg.type === 'ok' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
      {msg.text}
    </div>
  );
}

// ── Owner reservations table ──────────────────────────────────────────────────
function ReservasOwner({ complejoId }) {
  const [reservas, setReservas] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [updating, setUpdating] = useState(null); // id being updated
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    api.get(`/complejos/${complejoId}/reservas`)
      .then(r => setReservas(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [complejoId]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleEstado = async (id, nuevoEstado) => {
    setUpdating(id);
    try {
      await api.patch(`/reservas/${id}/estado?nuevo_estado=${nuevoEstado}`);
      setReservas(prev => prev.map(r => r.id === id ? { ...r, estado: nuevoEstado } : r));
    } catch { /* noop */ } finally {
      setUpdating(null);
    }
  };

  const formatTime = t => t?.slice(0, 5) ?? '';
  const formatDate = s => {
    if (!s) return '';
    const [y, m, d] = s.split('-');
    return `${d}/${m}/${y}`;
  };

  if (loading) return <div className="animate-pulse h-24 bg-slate-800/50 rounded-xl" />;

  if (reservas.length === 0) return (
    <div className="text-center py-8 text-slate-500 text-sm">
      <Calendar size={28} className="mx-auto mb-2 opacity-40" />
      No hay reservas en tu complejo aún.
    </div>
  );

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {reservas.map(r => {
          const estadoStyle = ESTADO_OPTIONS.find(e => e.value === r.estado) ?? ESTADO_OPTIONS[0];
          return (
            <div key={r.id} style={{ padding: '1rem', border: '1px solid #334155' }} className="rounded-xl bg-slate-800/30 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-white font-bold text-sm">{r.cliente_nombre}</span>
                <span className="text-green-400 font-bold text-sm">${r.total_pago?.toFixed(0)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{DEPORTE_EMOJI[r.cancha_deporte]} {r.cancha_nombre}</span>
                <span>{formatDate(r.fecha)} · {formatTime(r.hora_inicio)}–{formatTime(r.hora_fin)}</span>
              </div>
              <div style={{ borderTop: '1px solid #1e293b', paddingTop: '0.5rem' }} className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Estado</span>
                <select
                  value={r.estado}
                  disabled={updating === r.id}
                  onChange={e => handleEstado(r.id, e.target.value)}
                  className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border-0 cursor-pointer transition-colors ${
                    r.estado === 'CONFIRMADA'
                      ? 'bg-green-500/15 text-green-400'
                      : r.estado === 'CANCELADA'
                      ? 'bg-slate-700/50 text-slate-500'
                      : 'bg-yellow-400/15 text-yellow-400'
                  } ${updating === r.id ? 'opacity-50' : ''}`}
                >
                  {ESTADO_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase tracking-wider">
            <th className="text-left py-3 px-2">Cliente</th>
            <th className="text-left py-3 px-2">Cancha</th>
            <th className="text-left py-3 px-2">Fecha</th>
            <th className="text-left py-3 px-2">Horario</th>
            <th className="text-left py-3 px-2">Total</th>
            <th className="text-left py-3 px-2">Estado</th>
          </tr>
        </thead>
        <tbody>
          {reservas.map(r => {
            const estadoStyle = ESTADO_OPTIONS.find(e => e.value === r.estado) ?? ESTADO_OPTIONS[0];
            return (
              <tr key={r.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                <td className="py-3 px-2 text-white font-medium">{r.cliente_nombre}</td>
                <td className="py-3 px-2 text-slate-300">
                  {DEPORTE_EMOJI[r.cancha_deporte]} {r.cancha_nombre}
                </td>
                <td className="py-3 px-2 text-slate-400">{formatDate(r.fecha)}</td>
                <td className="py-3 px-2 text-slate-400">{formatTime(r.hora_inicio)}–{formatTime(r.hora_fin)}</td>
                <td className="py-3 px-2 text-green-400 font-semibold">${r.total_pago?.toFixed(0)}</td>
                <td className="py-3 px-2">
                  <select
                    value={r.estado}
                    disabled={updating === r.id}
                    onChange={e => handleEstado(r.id, e.target.value)}
                    className={`text-xs font-semibold px-2 py-1 rounded-lg border-0 cursor-pointer transition-colors ${
                      r.estado === 'CONFIRMADA'
                        ? 'bg-green-500/15 text-green-400'
                        : r.estado === 'CANCELADA'
                        ? 'bg-slate-700/50 text-slate-500'
                        : 'bg-yellow-400/15 text-yellow-400'
                    } ${updating === r.id ? 'opacity-50' : ''}`}
                  >
                    {ESTADO_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Cancha row (with edit/delete) ─────────────────────────────────────────────
function CanchaRow({ cancha, onDelete, onUpdate }) {
  const [editing,  setEditing]  = useState(false);
  const [form,     setForm]     = useState({ nombre_numero: cancha.nombre_numero, deporte: cancha.deporte, precio_hora: String(cancha.precio_hora), id_complejo: cancha.id_complejo });
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put(`/canchas/${cancha.id}`, { ...form, precio_hora: parseFloat(form.precio_hora) });
      onUpdate(res.data);
      setEditing(false);
    } catch { /* noop */ } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm(`¿Eliminar la cancha "${cancha.nombre_numero}"? Esto también eliminará sus reservas.`)) return;
    setDeleting(true);
    try {
      await api.delete(`/canchas/${cancha.id}`);
      onDelete(cancha.id);
    } catch { setDeleting(false); }
  };

  if (editing) return (
    <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }} className="bg-slate-700/40 rounded-xl border border-slate-600/60">
      <div className="grid grid-cols-3" style={{ gap: '1rem' }}>
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">Nombre</label>
          <input className="input-field text-sm py-2 px-3" value={form.nombre_numero}
            onChange={e => setForm(f => ({ ...f, nombre_numero: e.target.value }))} />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">Deporte</label>
          <select className="input-field text-sm py-2 px-3" value={form.deporte}
            onChange={e => setForm(f => ({ ...f, deporte: e.target.value }))}>
            {DEPORTES.map(d => (
              <option key={d} value={d}>
                {d === 'FUTBOL' ? '⚽ Fútbol' : d === 'PADEL' ? '🎾 Pádel' : '🏸 Tenis'}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">Precio/h</label>
          <input type="number" className="input-field text-sm py-2 px-3" value={form.precio_hora}
            onChange={e => setForm(f => ({ ...f, precio_hora: e.target.value }))} />
        </div>
      </div>
      <div className="flex justify-end" style={{ gap: '0.75rem' }}>
        <button onClick={() => setEditing(false)} className="btn-secondary text-xs px-3 py-1.5">Cancelar</button>
        <button onClick={handleSave} disabled={saving} className="btn-primary text-xs px-3 py-1.5 disabled:opacity-60">
          {saving ? 'Guardando…' : <><Save size={12} /> Guardar</>}
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '1rem' }} className="flex items-center justify-between bg-slate-800/60 rounded-xl border border-slate-700/60">
      <div className="flex items-center gap-3">
        <span className="text-xl">{DEPORTE_EMOJI[cancha.deporte]}</span>
        <div>
          <p className="text-white font-medium text-sm">{cancha.nombre_numero}</p>
          <p className="text-slate-500 text-xs">{cancha.deporte}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-green-400 font-bold">${Number(cancha.precio_hora).toFixed(0)}/h</span>
        <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors" title="Editar">
          <Pencil size={14} />
        </button>
        <button onClick={handleDelete} disabled={deleting} className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors disabled:opacity-50" title="Eliminar">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

// ── Lightbox (reusable within MiComplejo scope) ──────────────────────────────
function Lightbox({ images, startIdx, onClose }) {
  const [idx, setIdx] = useState(startIdx);
  const prev = () => setIdx(i => (i - 1 + images.length) % images.length);
  const next = () => setIdx(i => (i + 1) % images.length);
  useEffect(() => {
    const h = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 fade-in"
      style={{ isolation: 'isolate' }} onClick={onClose}>
      <button onClick={onClose}
        className="absolute top-4 right-4 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10">
        <X size={22} />
      </button>
      {images.length > 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 text-white text-sm px-3 py-1 rounded-full">
          {idx + 1} / {images.length}
        </div>
      )}
      <img src={images[idx]} alt={`Imagen ${idx + 1}`}
        className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl"
        onClick={e => e.stopPropagation()} />
      {images.length > 1 && (
        <>
          <button onClick={e => { e.stopPropagation(); prev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors">
            <ChevronLeft size={24} />
          </button>
          <button onClick={e => { e.stopPropagation(); next(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors">
            <ChevronRight size={24} />
          </button>
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, i) => (
              <button key={i} onClick={e => { e.stopPropagation(); setIdx(i); }}
                className={`w-2.5 h-2.5 rounded-full transition-all ${ i === idx ? 'bg-white scale-110' : 'bg-white/40 hover:bg-white/70' }`} />
            ))}
          </div>
        </>
      )}
    </div>,
    document.body
  );
}

// ── Complejo preview (read mode) ──────────────────────────────────────────────
function ComplejoPreview({ complejo, onEdit, onDelete }) {
  const images = (complejo.imagen_url || '').split(',').map(s => s.trim()).filter(Boolean);
  const [imgIdx,   setImgIdx]   = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const badges = (complejo.caracteristicas || '').split(',').map(s => s.trim()).filter(Boolean);

  return (
    <div className="card overflow-hidden">
      {lightbox && <Lightbox images={images} startIdx={imgIdx} onClose={() => setLightbox(false)} />}

      {/* Gallery with lightbox */}
      {images.length > 0 && (
        <div className="relative h-56 bg-slate-800">
          <img src={images[imgIdx]} alt={complejo.nombre}
            className="w-full h-full object-cover cursor-zoom-in"
            onClick={() => setLightbox(true)}
            onError={e => { e.currentTarget.style.opacity = '0'; }} />
          <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full pointer-events-none">
            🔍 {images.length > 1 ? `${images.length} fotos` : 'Ver foto'}
          </div>
          {images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <button key={i} onClick={() => setImgIdx(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${i === imgIdx ? 'bg-white' : 'bg-white/40'}`} />
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-white">{complejo.nombre}</h2>
            <div className="flex items-center gap-1.5 mt-1.5 text-slate-400 text-sm">
              <MapPin size={14} className="text-green-500" />
              {complejo.direccion}
            </div>
          </div>
          <div className="flex items-center gap-1 text-yellow-400 text-sm shrink-0">
            <Star size={14} fill="currentColor" />
            {Number(complejo.valoracion).toFixed(1)}
          </div>
        </div>

        {complejo.telefono_whatsapp && (
          <p className="text-slate-400 text-sm" style={{ marginTop: '0.25rem' }}>📱 WhatsApp: {complejo.telefono_whatsapp}</p>
        )}

        {badges.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {badges.map(b => (
              <span key={b} style={{ padding: '0.4rem 0.8rem' }} className="flex items-center gap-1.5 text-xs rounded-full bg-slate-700/60 text-slate-300 border border-slate-600/40">
                <Zap size={11} className="text-green-400" />{b}
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-wrap" style={{ gap: '1rem', paddingTop: '0.5rem' }}>
          <button onClick={onEdit} style={{ border: '1px solid transparent' }} className="btn-primary flex-1 py-3 px-6 gap-2">
            <Pencil size={15} /> Editar complejo
          </button>
          <button onClick={onDelete}
            style={{ color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)', backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
            className="btn-secondary hover:!bg-red-500/20">
            <Trash2 size={15} /> Eliminar complejo
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MiComplejo() {
  const [complejo,     setComplejo]     = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [mode,         setMode]         = useState('view'); // 'view' | 'create' | 'edit'
  const [saving,       setSaving]       = useState(false);
  const [savingCancha, setSavingCancha] = useState(false);
  const [msg,          setMsg]          = useState({ type: '', text: '' });
  const [showReservas, setShowReservas] = useState(false);

  const emptyForm = { nombre: '', direccion: '', telefono: '', imagen_url: '', caracteristicas: '', valoracion: '5.00', telefono_whatsapp: '' };
  const [form, setForm] = useState(emptyForm);
  const [canchaForm, setCanchaForm] = useState({ nombre_numero: '', deporte: 'PADEL', precio_hora: '' });

  useEffect(() => {
    api.get('/complejos/mio')
      .then(r => {
        if (r.data) {
          setComplejo(r.data);
          setForm({
            nombre:            r.data.nombre            ?? '',
            direccion:         r.data.direccion         ?? '',
            telefono:          r.data.telefono          ?? '',
            imagen_url:        r.data.imagen_url        ?? '',
            caracteristicas:   r.data.caracteristicas   ?? '',
            valoracion:        String(r.data.valoracion ?? '5.00'),
            telefono_whatsapp: r.data.telefono_whatsapp ?? '',
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: '', text: '' }), 4000);
  };

  const handleChange  = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleCChange = e => setCanchaForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, valoracion: parseFloat(form.valoracion) };
      let res;
      if (complejo) {
        res = await api.put(`/complejos/${complejo.id}`, payload);
      } else {
        res = await api.post('/complejos', payload);
      }
      setComplejo(res.data);
      setMode('view');
      showMsg('ok', complejo ? '¡Complejo actualizado correctamente!' : '¡Complejo creado exitosamente!');
    } catch (err) {
      showMsg('err', err.response?.data?.detail || 'No se pudo guardar el complejo.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteComplejo = async () => {
    if (!window.confirm(`¿Eliminar el complejo "${complejo.nombre}"? Esta acción es irreversible.`)) return;
    try {
      await api.delete(`/complejos/${complejo.id}`);
      setComplejo(null);
      setForm(emptyForm);
      setMode('view');
      showMsg('ok', 'Complejo eliminado.');
    } catch (err) {
      showMsg('err', err.response?.data?.detail || 'No se pudo eliminar el complejo.');
    }
  };

  const handleAddCancha = async (e) => {
    e.preventDefault();
    if (!complejo) return;
    setSavingCancha(true);
    try {
      const res = await api.post('/canchas', {
        ...canchaForm,
        precio_hora: parseFloat(canchaForm.precio_hora),
        id_complejo: complejo.id,
      });
      setComplejo(prev => ({ ...prev, canchas: [...(prev.canchas ?? []), res.data] }));
      setCanchaForm({ nombre_numero: '', deporte: 'PADEL', precio_hora: '' });
      showMsg('ok', 'Cancha agregada.');
    } catch (err) {
      showMsg('err', err.response?.data?.detail || 'No se pudo agregar la cancha.');
    } finally {
      setSavingCancha(false);
    }
  };

  const handleDeleteCancha = (id) => {
    setComplejo(prev => ({ ...prev, canchas: prev.canchas.filter(c => c.id !== id) }));
  };

  const handleUpdateCancha = (updated) => {
    setComplejo(prev => ({ ...prev, canchas: prev.canchas.map(c => c.id === updated.id ? updated : c) }));
  };

  // Parse comma-separated image URLs for preview
  const imageUrls = form.imagen_url.split(',').map(s => s.trim()).filter(Boolean);

  if (loading) return (
    <div className="page-container py-12">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-slate-800 rounded w-1/3" />
        <div className="h-64 bg-slate-800 rounded-2xl" />
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="page-container py-8">
      {/* Header */}
      <div style={{ marginBottom: '1rem' }} className="flex items-center gap-3">
        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
          <Building2 size={24} className="text-green-400" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-white">Mi Complejo</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {complejo ? `Gestioná ${complejo.nombre}` : 'Registrá tu complejo para recibir reservas'}
          </p>
        </div>
      </div>

      <Notif msg={msg} />

      {/* ── No complex yet ──────────────────────────────────────────────── */}
      {!complejo && mode === 'view' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', padding: '5rem 0' }} className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-800 rounded-2xl">
            <Building2 size={36} className="text-slate-600" />
          </div>
          <h3 className="text-white font-bold text-xl">Todavía no tenés un complejo</h3>
          <p className="text-slate-500">Creá tu complejo y comenzá a recibir reservas hoy mismo.</p>
          <button onClick={() => setMode('create')} className="btn-primary px-8 py-3 text-base">
            <Plus size={18} /> Crear nuevo complejo
          </button>
        </div>
      )}

      {/* ── Create / Edit form ──────────────────────────────────────────── */}
      {(mode === 'create' || mode === 'edit') && (
        <form onSubmit={handleSave} style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }} className="card shadow-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Pencil size={18} className="text-green-400" />
              {mode === 'create' ? 'Crear nuevo complejo' : 'Editar información'}
            </h2>
            <button type="button" onClick={() => setMode('view')} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>

          <div className="grid sm:grid-cols-2" style={{ gap: '1rem' }}>
            <Field label="Nombre del complejo *">
              <input type="text" name="nombre" required value={form.nombre} onChange={handleChange}
                placeholder="Ej: Club Deportivo Norte" className="input-field" />
            </Field>
            <Field label="Dirección *">
              <input type="text" name="direccion" required value={form.direccion} onChange={handleChange}
                placeholder="Ej: Av. Rivadavia 1234, CABA" className="input-field" />
            </Field>
            <Field label="Teléfono">
              <input type="text" name="telefono" value={form.telefono} onChange={handleChange}
                placeholder="Ej: 011-4567-8901" className="input-field" />
            </Field>
            <Field label="WhatsApp (con código de país)">
              <input type="text" name="telefono_whatsapp" value={form.telefono_whatsapp} onChange={handleChange}
                placeholder="Ej: 5491123456789" className="input-field" />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Imágenes (URLs separadas por coma, máx 10)">
                <input type="text" name="imagen_url" value={form.imagen_url} onChange={handleChange}
                  placeholder="https://url1.jpg, https://url2.jpg, ..."
                  className="input-field" />
              </Field>
              {/* Image preview strip */}
              {imageUrls.length > 0 && (
                <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                  {imageUrls.slice(0, 10).map((url, i) => (
                    <div key={i} className="shrink-0 w-20 h-16 rounded-lg overflow-hidden bg-slate-700 border border-slate-600">
                      <img src={url} alt={`Imagen ${i+1}`} className="w-full h-full object-cover"
                        onError={e => { e.target.parentElement.style.opacity = '0.3'; }} />
                    </div>
                  ))}
                  {imageUrls.length > 10 && (
                    <div className="shrink-0 w-20 h-16 rounded-lg bg-slate-700 border border-slate-600 flex items-center justify-center text-slate-400 text-xs">
                      máx. 10
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="sm:col-span-2">
              <Field label="Características (separadas por coma)">
                <input type="text" name="caracteristicas" value={form.caracteristicas} onChange={handleChange}
                  placeholder="Pasto sintético, Iluminación LED, Vestuarios, Techado"
                  className="input-field" />
              </Field>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', paddingTop: '0.5rem' }}>
            {complejo && (
              <button type="button" onClick={handleDeleteComplejo}
                style={{ color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)', backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                className="btn-secondary hover:!bg-red-500/20">
                <Trash2 size={15} /> Eliminar complejo
              </button>
            )}
            <div className="flex ml-auto" style={{ gap: '0.75rem', flexWrap: 'wrap' }}>
              <button type="button" onClick={() => setMode('view')} className="btn-secondary">Cancelar</button>
              <button type="submit" disabled={saving} style={{ border: '1px solid transparent' }} className="btn-primary px-8 disabled:opacity-60">
                <Save size={16} />
                {saving ? 'Guardando…' : complejo ? 'Guardar cambios' : 'Crear complejo'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ── Complejo preview (view mode) ─────────────────────────────── */}
      {complejo && mode === 'view' && (
        <>
          <ComplejoPreview complejo={complejo} onEdit={() => setMode('edit')} onDelete={handleDeleteComplejo} />

          {/* ── Canchas section ───────────────────────────────────────── */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }} className="card">
              <h2 className="text-xl font-bold text-white">
                Canchas registradas
                <span className="ml-2 text-sm text-slate-500 font-normal">({complejo.canchas?.length ?? 0})</span>
              </h2>
              {!complejo.canchas?.length ? (
                <p className="text-slate-500 text-sm">Aún no agregaste canchas.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {complejo.canchas.map(c => (
                    <CanchaRow key={c.id} cancha={c} onDelete={handleDeleteCancha} onUpdate={handleUpdateCancha} />
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={handleAddCancha} style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }} className="card">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Plus size={18} className="text-green-400" /> Agregar cancha
              </h2>
              <Field label="Nombre / número">
                <input type="text" name="nombre_numero" required
                  value={canchaForm.nombre_numero} onChange={handleCChange}
                  placeholder="Ej: Cancha 1 o Cancha A" className="input-field" />
              </Field>
              <Field label="Deporte">
                <select name="deporte" value={canchaForm.deporte} onChange={handleCChange} className="input-field">
                  {DEPORTES.map(d => (
                    <option key={d} value={d}>
                      {d === 'FUTBOL' ? '⚽ Fútbol' : d === 'PADEL' ? '🎾 Pádel' : '🏸 Tenis'}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Precio por hora ($)">
                <input type="number" name="precio_hora" required min="1" step="any"
                  value={canchaForm.precio_hora} onChange={handleCChange}
                  placeholder="Ej: 2500" className="input-field" />
              </Field>
              <div className="pt-2">
                <button type="submit" disabled={savingCancha} className="btn-primary w-full py-3 disabled:opacity-60">
                  <Plus size={16} />
                  {savingCancha ? 'Agregando…' : 'Agregar cancha'}
                </button>
              </div>
            </form>
          </div>

          {/* ── Reservas del complejo ────────────────────────────────── */}
          <div style={{ padding: '1rem' }} className="card">
            <button onClick={() => setShowReservas(v => !v)}
              style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between' }}
              className="w-full">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Users size={18} className="text-green-400" />
                Reservas de mi complejo
              </h2>
              {showReservas ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
            </button>
            {showReservas && (
              <div style={{ marginTop: '1.25rem' }} className="fade-in">
                <ReservasOwner complejoId={complejo.id} />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
