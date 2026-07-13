import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

const TOKEN_KEY = 'matchpoint_token';
const USER_KEY  = 'matchpoint_user';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user,  setUser]  = useState(() => {
    try {
      const saved = localStorage.getItem(USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  /** Called after a successful /auth/login response */
  const login = useCallback((tokenValue, userData) => {
    localStorage.setItem(TOKEN_KEY, tokenValue);
    localStorage.setItem(USER_KEY,  JSON.stringify(userData));
    setToken(tokenValue);
    setUser(userData);
  }, []);

  /** Clear session */
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const isAuthenticated = Boolean(token);
  const isCliente       = user?.rol === 'CLIENTE';
  const isDuenio        = user?.rol === 'DUENIO';

  return (
    <AuthContext.Provider value={{ token, user, isAuthenticated, isCliente, isDuenio, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Custom hook — use inside any component */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
