import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PrivateRoute, PublicRoute } from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import ComplejoDetalle from './pages/ComplejoDetalle';
import Reservas from './pages/Reservas';
import Favoritos from './pages/Favoritos';
import Perfil from './pages/Perfil';
import MiComplejo from './pages/MiComplejo';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public routes */}
              <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

              {/* Protected routes */}
              <Route path="/"              element={<PrivateRoute><Home /></PrivateRoute>} />
              <Route path="/complejos/:id" element={<PrivateRoute><ComplejoDetalle /></PrivateRoute>} />
              <Route path="/favoritos"     element={<PrivateRoute><Favoritos /></PrivateRoute>} />
              <Route path="/reservas"      element={<PrivateRoute><Reservas /></PrivateRoute>} />
              <Route path="/perfil"        element={<PrivateRoute><Perfil /></PrivateRoute>} />
              <Route path="/mi-complejo"   element={<PrivateRoute><MiComplejo /></PrivateRoute>} />

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
