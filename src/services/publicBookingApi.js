import { publicRequest } from './api';

const base = (slug) => `/api/public/company/${slug}`;

export const publicBookingApi = {
  getCompany:       (slug)                              => publicRequest('GET',  base(slug)),
  getServices:      (slug)                              => publicRequest('GET',  `${base(slug)}/services`),
  getProfessionals: (slug)                              => publicRequest('GET',  `${base(slug)}/professionals`),

  getAvailableTimes: (slug, date, serviceId, professionalId) => {
    const qs = new URLSearchParams({ date });
    if (serviceId)      qs.set('service_id',      serviceId);
    if (professionalId) qs.set('professional_id', professionalId);
    return publicRequest('GET', `${base(slug)}/available-times?${qs}`);
  },

  createAppointment: (slug, data) => publicRequest('POST', `${base(slug)}/appointments`, data),
};
