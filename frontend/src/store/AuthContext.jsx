import { createContext, useState, useContext, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api, { setAccessToken, getAccessToken } from '../api/axios';

export const AuthContext = createContext(null);

const authChannel = new BroadcastChannel('ktmexpress_auth');

export const AuthProvider = ({ children }) => {
  const location = useLocation();

  const activeRole = useMemo(() => {
    const path = location.pathname;
    if (path.startsWith('/admin')) return 'admin';
    if (path.startsWith('/vendor')) return 'vendor';
    if (path.startsWith('/dispatcher')) return 'dispatcher';
    if (path.startsWith('/rider')) return 'rider';
    return localStorage.getItem('last_active_role') || 'vendor';
  }, [location.pathname]);

  const [user, setUser] = useState(() => {
    const path = window.location.pathname;
    let initialRole = 'vendor';
    if (path.startsWith('/admin')) initialRole = 'admin';
    else if (path.startsWith('/vendor')) initialRole = 'vendor';
    else if (path.startsWith('/dispatcher')) initialRole = 'dispatcher';
    else if (path.startsWith('/rider')) initialRole = 'rider';
    else initialRole = localStorage.getItem('last_active_role') || 'vendor';

    const storedUser = localStorage.getItem(`${initialRole}_user`);
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch (_) {
        localStorage.removeItem(`${initialRole}_user`);
      }
    }
    return null;
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const initializeAuth = async () => {
      setLoading(true);
      const storedUser = localStorage.getItem(`${activeRole}_user`);
      
      if (storedUser) {
        try {
          const { data } = await api.post('/auth/refresh', { role: activeRole });
          if (data.success && data.token) {
            setAccessToken(activeRole, data.token);
            if (isMounted) {
              setUser(JSON.parse(storedUser));
            }
          } else {
            setAccessToken(activeRole, null);
            localStorage.removeItem(`${activeRole}_user`);
            if (isMounted) {
              setUser(null);
            }
          }
        } catch (err) {
          console.error('Silent refresh failed during init:', err);
          setAccessToken(activeRole, null);
          localStorage.removeItem(`${activeRole}_user`);
          if (isMounted) {
            setUser(null);
          }
        }
      } else {
        if (isMounted) {
          setUser(null);
        }
      }
      
      if (isMounted) {
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, [activeRole]);

  useEffect(() => {
    const handleAuthMessage = (event) => {
      if (event.data.type === 'logout') {
        const loggedOutRole = event.data.role;
        setAccessToken(loggedOutRole, null);
        if (loggedOutRole === activeRole) {
          setUser(null);
        }
      }
    };
    authChannel.addEventListener('message', handleAuthMessage);
    return () => authChannel.removeEventListener('message', handleAuthMessage);
  }, [activeRole]);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    if (data.success) {
      const role = data.user.role;
      setAccessToken(role, data.token);
      localStorage.setItem(`${role}_user`, JSON.stringify(data.user));
      localStorage.setItem('last_active_role', role);
      setUser(data.user);
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
    setAccessToken(activeRole, null);
    localStorage.removeItem(`${activeRole}_user`);
    setUser(null);
    authChannel.postMessage({ type: 'logout', role: activeRole });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, activeRole, loading, token: getAccessToken(activeRole) }}>
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
