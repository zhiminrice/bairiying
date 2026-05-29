import client from './client';

export const slotsApi = {
  list: (params) => client.get('/consultations/slots', { params }),
  create: (data) => client.post('/consultations/slots', data),
  delete: (id) => client.delete(`/consultations/slots/${id}`),
};

export const bookingsApi = {
  list: (params) => client.get('/consultations', { params }),
  create: (data) => client.post('/consultations', data),
  confirm: (id) => client.patch(`/consultations/${id}/confirm`),
  complete: (id) => client.patch(`/consultations/${id}/complete`),
  cancel: (id) => client.patch(`/consultations/${id}/cancel`),
};
