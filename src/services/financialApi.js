import { request } from './api';

export const financialApi = {
  summary: (startDate, endDate) =>
    request('GET', `/api/financial/summary?start_date=${startDate}&end_date=${endDate}`),

  transactions: (startDate, endDate, type) => {
    const params = new URLSearchParams({ start_date: startDate, end_date: endDate });
    if (type) params.set('type', type);
    return request('GET', `/api/financial/transactions?${params}`);
  },
};
