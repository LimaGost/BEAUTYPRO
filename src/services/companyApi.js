import { request } from './api';

export const companyApi = {
  get:    ()     => request('GET', '/api/company'),
  update: (data) => request('PUT', '/api/company', data),
};
