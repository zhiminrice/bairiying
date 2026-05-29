import client from './client';

export const attendanceApi = {
  list: (params) => client.get('/attendance', { params }),
  create: (data) => client.post('/attendance', data),
  todayProgress: (params) => client.get('/attendance/today-progress', { params }),
};

export const assignmentsApi = {
  list: (params) => client.get('/assignments', { params }),
  create: (data) => client.post('/assignments', data),
};

export const recordsApi = {
  list: (params) => client.get('/records', { params }),
  create: (data) => client.post('/records', data),
  getById: (id) => client.get(`/records/${id}`),
};

export const statsApi = {
  leaderDashboard: () => client.get('/stats/leader-dashboard'),
};

export const studentsApi = {
  list: (params) => client.get('/students', { params }),
};

export const coursesApi = {
  list: () => client.get('/courses'),
};

export const consultationApi = {
  getSlots: (params) => client.get('/consultations/slots', { params }),
  getBookings: (params) => client.get('/consultations', { params }),
  book: (data) => client.post('/consultations', data),
  cancel: (id) => client.patch(`/consultations/${id}/cancel`),
};
