import client from './client';

export const adminStatsApi = {
  overview: () => client.get('/stats/admin-overview'),
  courseAttendanceRate: () => client.get('/stats/course-attendance-rate'),
  exportAttendance: () => client.get('/stats/export/attendance', { responseType: 'blob' }),
};

export const attendanceApi = {
  list: (params) => client.get('/attendance', { params }),
};

export const courseAttendanceApi = {
  list: (params) => client.get('/course-attendance', { params }),
  create: (data) => client.post('/course-attendance', data),
};

export const witnessesApi = {
  list: (params) => client.get('/witnesses', { params }),
  create: (data) => client.post('/witnesses', data),
  publish: (id) => client.patch(`/witnesses/${id}/publish`),
  hide: (id) => client.patch(`/witnesses/${id}/hide`),
  published: () => client.get('/witnesses/published'),
};

export const studentsApi = {
  list: (params) => client.get('/students', { params }),
  create: (data) => client.post('/students', data),
  update: (id, data) => client.put(`/students/${id}`, data),
};

export const groupsApi = {
  list: () => client.get('/groups'),
  create: (data) => client.post('/groups', data),
  update: (id, data) => client.put(`/groups/${id}`, data),
};

export const usersApi = {
  list: () => client.get('/users'),
  create: (data) => client.post('/users', data),
  update: (id, data) => client.put(`/users/${id}`, data),
};

export const coursesApi = {
  list: () => client.get('/courses'),
  create: (data) => client.post('/courses', data),
  update: (id, data) => client.put(`/courses/${id}`, data),
};
