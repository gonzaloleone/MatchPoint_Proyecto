import { useState } from 'react';
import { User, Mail, Shield, Key, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Perfil() {
  const { user } = useAuth();
  const [showPwdForm, setShowPwdForm] = useState(false);
  const [pwdForm, setPwdForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: '', text: '' }), 4000);
  };

  const handlePwdChange = e => setPwdForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmitPwd = async (e) => {
    e.preventDefault();
    if (pwdForm.new_password.length < 8) {
      return showMsg('err', 'La nueva contraseña debe tener al menos 8 caracteres.');
    }
    if (pwdForm.new_password !== pwdForm.confirm_password) {
      return showMsg('err', 'Las contraseñas nuevas no coinciden.');
    }
    setLoading(true);
    try {
      // Re-authenticate to verify current password
      await api.post('/auth/login', { email: user?.email ?? '', password: pwdForm.current_password });
      // Update password via a dedicated endpoint (uses PATCH /auth/me)
      await api.patch('/auth/me/password', { password: pwdForm.new_password });
      showMsg('ok', '¡Contraseña actualizada exitosamente!');
      setShowPwdForm(false);
      setPwdForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      const detail = err.response?.data?.detail;
      showMsg('err', detail === 'Incorrect email or password' ? 'La contraseña actual es incorrecta.' : detail || 'No se pudo actualizar la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  const rolLabel = user?.rol === 'DUENIO' ? '🏟️ Dueño de Complejo' : '🏃 Cliente';
  const rolBadge = user?.rol === 'DUENIO' ? 'badge-yellow' : 'badge-green';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="page-container py-8 max-w-2xl mx-auto">
      <h1 style={{ marginBottom: '1rem' }} className="text-3xl font-extrabold text-white">Mi Perfil</h1>

      {/* Notification */}
      {msg.text && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border fade-in ${msg.type === 'ok' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}>
          {msg.type === 'ok' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {msg.text}
        </div>
      )}

      {/* User info card */}
      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }} className="card shadow-lg">
        <h2 className="text-xl font-bold text-white">Datos de la cuenta</h2>

        <div style={{ padding: '1rem', gap: '1rem' }} className="flex items-center bg-slate-800/60 rounded-xl">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-3xl font-bold shrink-0">
            {user?.nombre?.charAt(0)?.toUpperCase() ?? '?'}
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-white font-bold text-xl leading-tight">{user?.nombre ?? '—'}</p>
            <span className={`badge ${rolBadge} text-xs self-start`}>{rolLabel}</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ padding: '1rem', gap: '0.85rem' }} className="flex items-center bg-slate-800/40 rounded-xl">
            <User size={20} className="text-green-400 shrink-0" />
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Nombre completo</p>
              <p className="text-white font-semibold text-base">{user?.nombre ?? '—'}</p>
            </div>
          </div>

          <div style={{ padding: '1rem', gap: '0.85rem' }} className="flex items-center bg-slate-800/40 rounded-xl">
            <Mail size={20} className="text-green-400 shrink-0" />
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Correo electrónico</p>
              <p className="text-white font-semibold text-base">{user?.email ?? '—'}</p>
            </div>
          </div>

          <div style={{ padding: '1rem', gap: '0.85rem' }} className="flex items-center bg-slate-800/40 rounded-xl">
            <Shield size={20} className="text-green-400 shrink-0" />
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Tipo de cuenta</p>
              <span className={`badge ${rolBadge} text-xs`}>{rolLabel}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Change password card */}
      <div style={{ padding: '1.25rem' }} className="card shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Key size={18} className="text-green-400" /> Contraseña
          </h2>
          <button onClick={() => setShowPwdForm(v => !v)} className="btn-secondary text-sm px-4 py-2 hover:scale-[1.02] active:scale-[0.98] transition-all">
            {showPwdForm ? 'Cancelar' : 'Cambiar contraseña'}
          </button>
        </div>

        {showPwdForm && (
          <form onSubmit={handleSubmitPwd} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1.5rem' }} className="fade-in">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Contraseña actual</label>
              <div className="relative">
                <input type={showCurrent ? 'text' : 'password'} name="current_password" required
                  value={pwdForm.current_password} onChange={handlePwdChange}
                  placeholder="••••••••" className="input-field !pr-11" />
                <button type="button" onClick={() => setShowCurrent(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Nueva contraseña <span className="text-slate-500 font-normal">(mín. 8 caracteres)</span></label>
              <div className="relative">
                <input type={showNew ? 'text' : 'password'} name="new_password" required
                  value={pwdForm.new_password} onChange={handlePwdChange}
                  placeholder="••••••••" className="input-field !pr-11" />
                <button type="button" onClick={() => setShowNew(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Confirmar nueva contraseña</label>
              <input type="password" name="confirm_password" required
                value={pwdForm.confirm_password} onChange={handlePwdChange}
                placeholder="••••••••" className="input-field" />
            </div>

            <div className="flex justify-end pt-4">
              <button type="submit" disabled={loading} className="btn-primary px-6 py-3 disabled:opacity-60 hover:scale-[1.02] active:scale-[0.98] transition-all">
                {loading ? 'Guardando…' : <><CheckCircle size={16} /> Guardar contraseña</>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
