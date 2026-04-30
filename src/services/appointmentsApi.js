import { request } from './api';

export const appointmentsApi = {
  list:   (filters = {}) => {
    const qs = new URLSearchParams(filters).toString();
    return request('GET', `/api/entities/appointment${qs ? `?${qs}` : ''}`);
  },
  create: (data)         => request('POST', '/api/entities/appointment', data),
  update: (id, data)     => request('PUT',  `/api/entities/appointment/${id}`, data),
  delete: (id)           => request('DELETE', `/api/entities/appointment/${id}`),
};
