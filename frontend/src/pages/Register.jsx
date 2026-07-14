import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ChevronDown, MapPin, Eye, EyeOff } from 'lucide-react';
import api from '../services/api';

export default function Register() {
  const [form, setForm] = useState({ nombre: '', email: '', password: '', rol: 'CLIENTE' });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) {
      return setError('La contraseña debe tener al menos 8 caracteres.');
    }
    setLoading(true);
    try {
      await api.post('/auth/register', form);
      navigate('/login');
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        const emailErr = detail.find(d => d.loc?.includes('email'));
        if (emailErr) {
          setError('El formato del correo electrónico no es válido.');
        } else {
          setError(detail[0]?.msg || 'Error de validación.');
        }
      } else {
        setError(typeof detail === 'string' ? detail : 'Error al registrarse. Intentá de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-green-500/8 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md fade-in">
        <div style={{ marginBottom: '2.5rem' }} className="text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="bg-gradient-to-r from-green-400 to-green-600 p-2 rounded-xl">
              <MapPin size={22} className="text-white" />
            </span>
            <span className="text-2xl font-bold gradient-text">MatchPoint</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">Crear cuenta</h1>
          <p className="text-slate-400">Unite a la comunidad deportiva</p>
        </div>

        <div style={{ padding: '2rem' }} className="card shadow-lg">
          {error && (
            <div style={{ padding: '0.65rem' }} className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Nombre completo</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input type="text" name="nombre" required value={form.nombre} onChange={handleChange}
                  placeholder="Juan Pérez" className="input-field !pl-11" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input type="email" name="email" required value={form.email} onChange={handleChange}
                  placeholder="tu@email.com" className="input-field !pl-11" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Contraseña</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input type={showPwd ? 'text' : 'password'} name="password" required
                  value={form.password} onChange={handleChange}
                  placeholder="Mínimo 8 caracteres" className="input-field !pl-11 !pr-11" />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Tipo de cuenta</label>
              <div className="relative">
                <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <select name="rol" value={form.rol} onChange={handleChange}
                  className="input-field appearance-none cursor-pointer !pr-11">
                  <option value="CLIENTE">Cliente — Reservar canchas</option>
                  <option value="DUENIO">Dueño — Publicar mi complejo</option>
                </select>
              </div>
            </div>

            <div className="pt-2">
              <button type="submit" disabled={loading} className="btn-primary w-full py-3 disabled:opacity-60 hover:scale-[1.02] active:scale-[0.98] transition-all">
                {loading ? 'Creando cuenta…' : 'Crear cuenta'}
              </button>
            </div>
          </form>

          <p style={{ marginTop: '1.5rem' }} className="text-center text-sm text-slate-400">
            ¿Ya tenés cuenta?{' '}
            <Link to="/login" className="text-green-400 hover:text-green-300 font-medium">
              Iniciá sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
