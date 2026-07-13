import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Login() {
  const [form, setForm]       = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const { login }  = useAuth();
  const navigate   = useNavigate();

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      // Decode basic info from token payload (base64 middle section)
      const payload = JSON.parse(atob(data.access_token.split('.')[1]));
      login(data.access_token, {
        id:     payload.sub,
        rol:    payload.rol,
        nombre: payload.nombre ?? '',
        email:  form.email,
      });
      navigate(payload.rol === 'DUENIO' ? '/mi-complejo' : '/');
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
        setError(typeof detail === 'string' ? detail : 'Credenciales incorrectas.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-green-500/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md fade-in">
        {/* Logo */}
        <div style={{ marginBottom: '2.5rem' }} className="text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="bg-gradient-to-r from-green-400 to-green-600 p-2 rounded-xl">
              <MapPin size={22} className="text-white" />
            </span>
            <span className="text-2xl font-bold gradient-text">MatchPoint</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">Bienvenido de vuelta</h1>
          <p className="text-slate-400">Ingresá para reservar tu cancha</p>
        </div>
 
        {/* Form Card */}
        <div style={{ padding: '2rem' }} className="card shadow-lg">
          {error && (
            <div style={{ padding: '0.65rem' }} className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}
 
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  type="email" name="email" required
                  value={form.email} onChange={handleChange}
                  placeholder="tu@email.com"
                  className="input-field !pl-11"
                />
              </div>
            </div>
 
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Contraseña</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  type={showPwd ? 'text' : 'password'} name="password" required
                  value={form.password} onChange={handleChange}
                  placeholder="••••••••"
                  className="input-field !pl-11 !pr-11"
                />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
 
            <div className="pt-2">
              <button type="submit" disabled={loading} className="btn-primary w-full py-3 disabled:opacity-60 hover:scale-[1.02] active:scale-[0.98] transition-all">
                {loading ? 'Ingresando…' : 'Iniciar sesión'}
              </button>
            </div>
          </form>
 
          <p style={{ marginTop: '1.5rem' }} className="text-center text-sm text-slate-400">
            ¿No tenés cuenta?{' '}
            <Link to="/register" className="text-green-400 hover:text-green-300 font-medium">
              Registrate acá
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
