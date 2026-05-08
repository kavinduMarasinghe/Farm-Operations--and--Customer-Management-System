import apiClient from './apiClient';

const STUDENT_API_BASE = '/api/admin/student';

// Student Bookings API
export const studentBookingsAPI = {
  getAll: () => apiClient.get(`${STUDENT_API_BASE}/bookings`),
  getById: (id: string) => apiClient.get(`${STUDENT_API_BASE}/bookings/${id}`),
  getUserBookings: (userId: string) => apiClient.get(`${STUDENT_API_BASE}/bookings/user/${userId}`),
  create: (data: any) => apiClient.post(`${STUDENT_API_BASE}/bookings`, data),
  update: (id: string, data: any) => apiClient.put(`${STUDENT_API_BASE}/bookings/${id}`, data),
  updateStatus: (id: string, status: string) => apiClient.patch(`${STUDENT_API_BASE}/bookings/${id}/status`, { status }),
  delete: (id: string) => apiClient.delete(`${STUDENT_API_BASE}/bookings/${id}`),
};

// Student Feedback API
export const studentFeedbackAPI = {
  getAll: () => apiClient.get(`${STUDENT_API_BASE}/feedback`),
  getById: (id: string) => apiClient.get(`${STUDENT_API_BASE}/feedback/${id}`),
  getStudentFeedbacks: (studentId: string) => apiClient.get(`${STUDENT_API_BASE}/feedback/student/${studentId}`),
  create: (data: any) => apiClient.post(`${STUDENT_API_BASE}/feedback`, data),
  update: (id: string, data: any) => apiClient.put(`${STUDENT_API_BASE}/feedback/${id}`, data),
  delete: (id: string) => apiClient.delete(`${STUDENT_API_BASE}/feedback/${id}`),
};

// Live Session API
export const liveSessionAPI = {
  getAll: () => apiClient.get(`${STUDENT_API_BASE}/livesession`),
  getActive: () => apiClient.get(`${STUDENT_API_BASE}/livesession/active`),
  getById: (id: string) => apiClient.get(`${STUDENT_API_BASE}/livesession/${id}`),
  create: (data: any) => apiClient.post(`${STUDENT_API_BASE}/livesession`, data),
  update: (id: string, data: any) => apiClient.put(`${STUDENT_API_BASE}/livesession/${id}`, data),
  join: (id: string) => apiClient.post(`${STUDENT_API_BASE}/livesession/${id}/join`),
  delete: (id: string) => apiClient.delete(`${STUDENT_API_BASE}/livesession/${id}`),
};

// Material API
export const materialAPI = {
  getAll: () => apiClient.get(`${STUDENT_API_BASE}/material`),
  getById: (id: string) => apiClient.get(`${STUDENT_API_BASE}/material/${id}`),
  download: (id: string) => apiClient.get(`${STUDENT_API_BASE}/material/${id}/download`),
  create: (data: any) => apiClient.post(`${STUDENT_API_BASE}/material`, data),
  upload: (formData: FormData) => apiClient.post(`${STUDENT_API_BASE}/material/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id: string, data: any) => apiClient.put(`${STUDENT_API_BASE}/material/${id}`, data),
  delete: (id: string) => apiClient.delete(`${STUDENT_API_BASE}/material/${id}`),
};

// Lab Tour API
export const labTourAPI = {
  getAll: () => apiClient.get(`${STUDENT_API_BASE}/labtour`),
  getAvailable: () => apiClient.get(`${STUDENT_API_BASE}/labtour/available`),
  getById: (id: string) => apiClient.get(`${STUDENT_API_BASE}/labtour/${id}`),
  create: (data: any) => apiClient.post(`${STUDENT_API_BASE}/labtour`, data),
  book: (id: string, data: any) => apiClient.post(`${STUDENT_API_BASE}/labtour/${id}/book`, data),
  update: (id: string, data: any) => apiClient.put(`${STUDENT_API_BASE}/labtour/${id}`, data),
  delete: (id: string) => apiClient.delete(`${STUDENT_API_BASE}/labtour/${id}`),
};

// Student Details API
export const studentDetailsAPI = {
  getAll: () => apiClient.get(`${STUDENT_API_BASE}/details`),
  search: (query: string) => apiClient.get(`${STUDENT_API_BASE}/details/search?q=${query}`),
  getStats: () => apiClient.get(`${STUDENT_API_BASE}/details/stats`),
  getById: (id: string) => apiClient.get(`${STUDENT_API_BASE}/details/${id}`),
  create: (data: any) => apiClient.post(`${STUDENT_API_BASE}/details`, data),
  update: (id: string, data: any) => apiClient.put(`${STUDENT_API_BASE}/details/${id}`, data),
  delete: (id: string) => apiClient.delete(`${STUDENT_API_BASE}/details/${id}`),
};

// Student Reports API
export const studentReportsAPI = {
  getEnrollment: () => apiClient.get(`${STUDENT_API_BASE}/reports/enrollment`),
  getPerformance: () => apiClient.get(`${STUDENT_API_BASE}/reports/performance`),
  getAttendance: () => apiClient.get(`${STUDENT_API_BASE}/reports/attendance`),
  getFeedbackSummary: () => apiClient.get(`${STUDENT_API_BASE}/reports/feedback-summary`),
  getLabTourStats: () => apiClient.get(`${STUDENT_API_BASE}/reports/lab-tour-stats`),
  getMaterialUsage: () => apiClient.get(`${STUDENT_API_BASE}/reports/material-usage`),
  getLiveSessionStats: () => apiClient.get(`${STUDENT_API_BASE}/reports/live-session-stats`),
};