import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore logout errors
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
    }
  }, []);

  const login = useCallback(async (credentials) => {
    const res = await authService.login(credentials);
    localStorage.setItem('token', res.access_token);
    localStorage.setItem('user', JSON.stringify(res.user));
    setToken(res.access_token);
    setUser(res.user);
    return res.user;
  }, []);

  useEffect(() => {
    let isMounted = true;
    const checkAuth = async () => {
      if (token) {
        try {
          const profile = await authService.getCurrentUser();
          if (isMounted && profile) {
            setUser(profile);
            localStorage.setItem('user', JSON.stringify(profile));
          }
        } catch {
          if (isMounted) {
            logout();
          }
        }
      }
      if (isMounted) {
        setLoading(false);
      }
    };
    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [token, logout]);

  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
