import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authApi, clearAuthCache } from '../services/authApi.js';
import { clearProgress } from '../services/progressStore.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authApi.me().then(({ user: currentUser }) => setUser(currentUser)).catch(() => setUser(null)).finally(() => setLoading(false));
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    register: async (data) => authApi.register(data),
    login: async (data) => { const result = await authApi.login(data); setUser(result.user); return result.user; },
    logout: async () => { await authApi.logout(); clearProgress(); setUser(null); },
    clearSession: () => { clearAuthCache(); clearProgress(); setUser(null); },
    updateUser: (nextUser) => setUser(nextUser)
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
