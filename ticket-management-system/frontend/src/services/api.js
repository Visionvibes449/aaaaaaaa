import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.get('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateDetails: (data) => api.put('/auth/updatedetails', data),
  updatePassword: (data) => api.put('/auth/updatepassword', data),
  forgotPassword: (data) => api.post('/auth/forgotpassword', data)
};

// Ticket API
export const ticketAPI = {
  getTickets: (params) => api.get('/tickets', { params }),
  getTicket: (id) => api.get(`/tickets/${id}`),
  createTicket: (data) => api.post('/tickets', data),
  updateTicket: (id, data) => api.put(`/tickets/${id}`, data),
  assignTicket: (id, data) => api.put(`/tickets/${id}/assign`, data),
  deleteTicket: (id) => api.delete(`/tickets/${id}`),
  getStats: () => api.get('/tickets/stats')
};

// Upload API
export const uploadAPI = {
  uploadSingle: (formData) => api.post('/upload/single', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  uploadMultiple: (formData) => api.post('/upload/multiple', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
};

export default api;
