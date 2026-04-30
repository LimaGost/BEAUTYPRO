import { request } from './api';

export const businessHoursApi = {
  get:  ()      => request('GET',  '/api/business-hours'),
  save: (hours) => request('POST', '/api/business-hours', hours),
};
