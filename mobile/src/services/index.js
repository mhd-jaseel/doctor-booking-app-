import api from './api';

export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
  getProfile: () => api.get('/auth/me'),
};

export const fileService = {
  uploadImage: (formData) =>
    api.post('/files/upload', formData, {
      timeout: 30000, // 30s timeout for image upload to MongoDB GridFS
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      transformRequest: (data) => data, // Ensure FormData is passed as raw body without stringification
    }),
  deleteFile: (fileId) => api.delete(`/files/${fileId}`),
};

export const doctorService = {
  getDoctors: (params) => api.get('/doctors', { params }),
  getDoctorById: (id) => api.get(`/doctors/${id}`),
  getDoctorsByHospital: (hospitalId, params) => api.get(`/doctors/hospital/${hospitalId}`, { params }),
  createDoctor: (data) => api.post('/doctors', data),
  updateDoctor: (id, data) => api.put(`/doctors/${id}`, data),
  toggleDoctorStatus: (id) => api.patch(`/doctors/${id}/status`),
};

export const hospitalService = {
  getHospitals: (params) => api.get('/hospitals', { params }),
  getHospitalById: (id) => api.get(`/hospitals/${id}`),
  createHospital: (data) => api.post('/hospitals', data),
  updateHospital: (id, data) => api.put(`/hospitals/${id}`, data),
  toggleHospitalStatus: (id) => api.patch(`/hospitals/${id}/status`),
};

export const scheduleService = {
  getDoctorSchedules: (doctorId) => api.get(`/schedules/doctor/${doctorId}`),
  getScheduleById: (id) => api.get(`/schedules/${id}`),
  createSchedule: (data) => api.post('/schedules', data),
  updateSchedule: (id, data) => api.put(`/schedules/${id}`, data),
  toggleScheduleAvailability: (id) => api.patch(`/schedules/${id}/status`),
  deleteSchedule: (id) => api.delete(`/admin/schedules/${id}`),
};

export const appointmentService = {
  bookAppointment: (data) => api.post('/appointments', data),
  getMyAppointments: (params) => api.get('/appointments/my', { params }),
  getAppointmentById: (id) => api.get(`/appointments/${id}`),
  cancelAppointment: (id) => api.patch(`/appointments/${id}/cancel`),
};

export const notificationService = {
  getNotifications: (params) => api.get('/notifications', { params }),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
};

export const ratingService = {
  submitRating: (data) => api.post('/ratings', data),
};

export const waitingListService = {
  joinWaitingList: (data) => api.post('/waiting-list', data),
  getMyWaitingList: () => api.get('/waiting-list/my'),
  getScheduleWaitingList: (scheduleId, params) => api.get(`/waiting-list/${scheduleId}`, { params }),
};

export const healthcareService = {
  getActiveServices: () => api.get('/healthcare-services'),
};

export const adminService = {
  getDashboardStats: () => api.get('/admin/dashboard'),
  
  // Healthcare Services
  getHealthcareServices: (params) => api.get('/admin/healthcare-services', { params }),
  createHealthcareService: (data) => api.post('/admin/healthcare-services', data),
  updateHealthcareService: (id, data) => api.put(`/admin/healthcare-services/${id}`, data),
  toggleHealthcareServiceStatus: (id) => api.patch(`/admin/healthcare-services/${id}/status`),
  deleteHealthcareService: (id) => api.delete(`/admin/healthcare-services/${id}`),

  // Facilities
  getFacilities: (params) => api.get('/admin/facilities', { params }),
  createFacility: (data) => api.post('/admin/facilities', data),
  updateFacility: (id, data) => api.put(`/admin/facilities/${id}`, data),
  toggleFacilityStatus: (id, data) => api.patch(`/admin/facilities/${id}/status`, data),
  deleteFacility: (id) => api.delete(`/admin/facilities/${id}`),

  // Doctors
  getDoctors: (params) => api.get('/admin/doctors', { params }),
  createDoctor: (data) => api.post('/admin/doctors', data),
  updateDoctor: (id, data) => api.put(`/admin/doctors/${id}`, data),
  toggleDoctorStatus: (id, data) => api.patch(`/admin/doctors/${id}/status`, data),
  deleteDoctor: (id) => api.delete(`/admin/doctors/${id}`),
  assignDoctorFacility: (doctorId, facilityId) => api.post(`/admin/doctors/${doctorId}/facilities`, { facilityId }),
  removeDoctorFacility: (doctorId, facilityId) => api.delete(`/admin/doctors/${doctorId}/facilities/${facilityId}`),

  // Schedules
  getSchedules: (params) => api.get('/admin/schedules', { params }),
  createSchedule: (data) => api.post('/admin/schedules', data),
  updateSchedule: (id, data) => api.put(`/admin/schedules/${id}`, data),
  toggleScheduleAvailability: (id) => api.patch(`/admin/schedules/${id}/status`),
  deleteSchedule: (id) => api.delete(`/admin/schedules/${id}`),
  getScheduleWaitingList: (scheduleId, params) => api.get(`/admin/schedules/${scheduleId}/waiting-list`, { params }),

  // Appointments
  getAllAppointments: (params) => api.get('/admin/appointments', { params }),
  getAppointmentById: (id) => api.get(`/admin/appointments/${id}`),
  cancelAppointment: (id) => api.patch(`/admin/appointments/${id}/cancel`),

  // Users
  getAllUsers: (params) => api.get('/admin/users', { params }),
  getUserDetails: (id) => api.get(`/admin/users/${id}`),
  toggleUserStatus: (id) => api.patch(`/admin/users/${id}/status`),

  // Ratings
  getRatings: (params) => api.get('/admin/ratings', { params }),
};

export const syncService = {
  getVersion: () => api.get('/sync/version'),
  getChanges: (since) => api.get('/sync/changes', { params: { since } }),
  getUnreadCount: () => api.get('/sync/unread-count'),
};

