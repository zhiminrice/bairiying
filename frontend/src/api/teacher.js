import client from './client';

export const contentApi = {
  // Get records with filters
  list: (params) => client.get('/records', { params }),
  getById: (id) => client.get(`/records/${id}`),
};

export const commentsApi = {
  list: (params) => client.get('/comments', { params }),
  create: (data) => client.post('/comments', data),
};

export const groupsApi = {
  list: () => client.get('/groups'),
};

export const studentsApi = {
  list: (params) => client.get('/students', { params }),
};

export const teacherStatsApi = {
  overview: () => client.get('/stats/teacher-overview'),
};
