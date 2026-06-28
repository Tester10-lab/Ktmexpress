import { createContext, useState, useContext, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api/axios';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const location = useLocation();
  const [forceUpdate, setForceUpdate] = useState(0);

  const activeRole = useMemo(() => {
    const path = location.pathname;
    if (path.startsWith('/admin')) return 'admin';
    if (path.startsWith('/vendor')) return 'vendor';
    if (path.startsWith('/dispatcher')) return 'dispatcher';
    if (path.startsWith('/rider')) return 'rider';
    return localStorage.getItem('last_active_role') || 'vendor';
  }, [location.pathname]);

  const user = useMemo(() => {
    const storedUser = localStorage.getItem(`${activeRole}_user`);
    const token = localStorage.getItem(`${activeRole}_token`);
    if (storedUser && token) {
      try {
        return JSON.parse(storedUser);
      } catch (e) {
        localStorage.removeItem(`${activeRole}_user`);
        localStorage.removeItem(`${activeRole}_token`);
        return null;
      }
    }
    return null;
  }, [activeRole, forceUpdate]);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    if (data.success) {
      const role = data.user.role;
      localStorage.setItem(`${role}_token`, data.token);
      localStorage.setItem(`${role}_user`, JSON.stringify(data.user));
      localStorage.setItem('last_active_role', role);
      setForceUpdate(prev => prev + 1);
      return data;
    }
    throw new Error('Login failed');
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout', { role: activeRole });
    } catch (e) {
      // ignore errors on logout
    }
    localStorage.removeItem(`${activeRole}_token`);
    localStorage.removeItem(`${activeRole}_user`);
    setForceUpdate(prev => prev + 1);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, activeRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
