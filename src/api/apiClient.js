// @ts-nocheck
import { Capacitor } from '@capacitor/core';

const BASE = Capacitor.isNativePlatform()
  ? 'https://eleganceesteticastudio.mustech.com.br'
  : (import.meta.env.VITE_API_URL || '');

const ENTITY_KEY_MAP = {
  Appointment:     'appointment',
  Client:          'client',
  Professional:    'professional',
  Service:         'service',
  Product:         'product',
  Transaction:     'transaction',
  MessageTemplate: 'messagetemplate',
};

function getToken() {
  return localStorage.getItem('bp_token');
}

// Retorna o company_id que o admin selecionou (ou null para usuários normais)
function getAdminCompanyId() {
  return localStorage.getItem('bp_admin_company_id');
}

// Injeta ?_company_id=X no path quando admin tem empresa selecionada
function withAdminCompany(path) {
  const cid = getAdminCompanyId();
  if (!cid) return path;
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}_company_id=${cid}`;
}

async function request(method, path, body) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const sep = path.includes('?') ? '&' : '?';
  const url = token ? `${BASE}${path}${sep}_token=${encodeURIComponent(token)}` : `${BASE}${path}`;

  const res = await fetch(url, {
    method,
    headers,
    ...(body !== undefined && { body: JSON.stringify(body) }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

function createEntityClient(key) {
  const base = `/api/entities/${key}`;
  return {
    list(sort) {
      const qs = sort ? `?_sort=${encodeURIComponent(sort)}` : '';
      return request('GET', withAdminCompany(`${base}${qs}`));
    },
    filter(filters = {}) {
      const entries = Object.entries(filters).map(([k, v]) => [k, String(v)]);
      const qs = entries.length ? `?${new URLSearchParams(entries)}` : '';
      return request('GET', withAdminCompany(`${base}${qs}`));
    },
    create(data) {
      return request('POST', base, data);
    },
    update(id, data) {
      return request('PUT', `${base}/${id}`, data);
    },
    delete(id) {
      return request('DELETE', `${base}/${id}`);
    },
  };
}

const entities = new Proxy({}, {
  get(_, entityName) {
    const key = ENTITY_KEY_MAP[entityName] ?? entityName.toLowerCase();
    return createEntityClient(key);
  },
});

export const apiClient = {
  entities,
  auth: {
    me: () => request('GET', '/api/auth/me'),
    login: (email, password) => request('POST', '/api/auth/login', { email, password }),
    register: (data) => request('POST', '/api/auth/register', data),
  },
  company: {
    get: () => request('GET', '/api/company'),
    update: (data) => request('PUT', '/api/company', data),
  },
  financial: {
    summary: (params = {}) => {
      const cid = getAdminCompanyId();
      if (cid) params = { ...params, _company_id: cid };
      const qs = new URLSearchParams(params).toString();
      return request('GET', `/api/financial/summary${qs ? '?' + qs : ''}`);
    },
    transactions: (params = {}) => {
      const cid = getAdminCompanyId();
      if (cid) params = { ...params, _company_id: cid };
      const qs = new URLSearchParams(params).toString();
      return request('GET', `/api/financial/transactions${qs ? '?' + qs : ''}`);
    },
  },
  businessHours: {
    get: () => request('GET', withAdminCompany('/api/business-hours')),
    save: (data) => request('POST', '/api/business-hours', data),
  },
  admin: {
    companies: () => request('GET', '/api/admin/companies'),
    dashboard: () => request('GET', '/api/admin/dashboard'),
    clients: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request('GET', `/api/admin/clients${qs ? '?' + qs : ''}`);
    },
    appointments: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request('GET', `/api/admin/appointments${qs ? '?' + qs : ''}`);
    },
  },
};
