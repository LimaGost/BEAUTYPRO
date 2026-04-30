// @ts-nocheck
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { apiClient } from '@/api/apiClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user,          setUser]          = useState(null);
  const [company,       setCompany]       = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Admin: empresa selecionada para visualização
  const [adminCompany, setAdminCompanyState] = useState(() => {
    try {
      const stored = localStorage.getItem('bp_admin_company');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  useEffect(() => {
    const token = localStorage.getItem('bp_token');
    if (!token) { setIsLoadingAuth(false); return; }
    apiClient.auth.me()
      .then((data) => {
        const { company: c, ...userFields } = data;
        setUser(userFields);
        setCompany(c ?? null);
      })
      .catch(() => {
        localStorage.removeItem('bp_token');
        setUser(null);
        setCompany(null);
      })
      .finally(() => setIsLoadingAuth(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await apiClient.auth.login(email, password);
    localStorage.setItem('bp_token', data.token);
    setUser(data.user);
    setCompany(data.company ?? null);
    return data.user;
  }, []);

  const register = useCallback(async (formData) => {
    const data = await apiClient.auth.register(formData);
    localStorage.setItem('bp_token', data.token);
    setUser(data.user);
    setCompany(data.company ?? null);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('bp_token');
    localStorage.removeItem('bp_admin_company');
    localStorage.removeItem('bp_admin_company_id');
    setUser(null);
    setCompany(null);
    setAdminCompanyState(null);
  }, []);

  const updateCompany = useCallback(async (data) => {
    const result = await apiClient.company.update(data);
    if (result?.token) {
      localStorage.setItem('bp_token', result.token);
      setCompany(result.company ?? null);
      return result.company;
    }
    setCompany(result);
    return result;
  }, []);

  // Admin: seleciona uma empresa para visualizar
  const selectAdminCompany = useCallback((c) => {
    localStorage.setItem('bp_admin_company',    JSON.stringify(c));
    localStorage.setItem('bp_admin_company_id', String(c.id));
    setAdminCompanyState(c);
  }, []);

  // Admin: volta para a lista de empresas
  const clearAdminCompany = useCallback(() => {
    localStorage.removeItem('bp_admin_company');
    localStorage.removeItem('bp_admin_company_id');
    setAdminCompanyState(null);
  }, []);

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{
      user,
      company,
      isAuthenticated:  !!user,
      // Usuário comum: empresa própria configurada. Admin: empresa selecionada.
      isCompanySetup:   isAdmin ? !!adminCompany : !!company,
      isAdmin,
      isSuperAdmin:     user?.role === 'superadmin', // backward-compat
      adminCompany,
      // Empresa "efetiva" para exibição: selecionada pelo admin ou própria do usuário
      effectiveCompany: isAdmin ? adminCompany : company,
      selectAdminCompany,
      clearAdminCompany,
      isLoadingAuth,
      login,
      register,
      logout,
      updateCompany,
      navigateToLogin: logout,
      checkAppState: () => {},
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
