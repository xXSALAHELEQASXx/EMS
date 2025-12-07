import axios, { AxiosInstance } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests automatically
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (credentials: { email: string; password: string }) => 
    api.post('/auth/login', credentials),
  
  register: (userData: {
    name: string;
    email: string;
    password: string;
    role: string;
    department?: string;
    position?: string;
    baseSalary?: number;
    managerId?: string;
  }) => api.post('/auth/register', userData),
  
  getProfile: () => api.get('/auth/me'),
  
  getAllUsers: () => api.get('/auth/users'),
  
  getUserById: (id: string) => api.get(`/auth/users/${id}`),
  
  updateUser: (id: string, data: any) => api.patch(`/auth/users/${id}`, data),
  
  deleteUser: (id: string) => api.delete(`/auth/users/${id}`),
};

// Leave APIs
export const leaveAPI = {
  create: (leaveData: {
    leaveType: string;
    startDate: string;
    endDate: string;
    reason: string;
  }) => api.post('/leave', leaveData),
  
  getAll: () => api.get('/leave'),
  
  getById: (id: string) => api.get(`/leave/${id}`),
  
  approve: (id: string, status: string, rejectionReason?: string) => 
    api.patch(`/leave/${id}`, { status, rejectionReason }),
  
  delete: (id: string) => api.delete(`/leave/${id}`),
};

// Attendance APIs
export const attendanceAPI = {
  checkIn: () => api.post('/attendance/check-in'),
  
  checkOut: () => api.post('/attendance/check-out'),
  
  getRecords: (params?: {
    startDate?: string;
    endDate?: string;
    employeeId?: string;
  }) => api.get('/attendance', { params }),
  
  createRecord: (data: {
    employeeId: string;
    date: string;
    checkIn?: string;
    checkOut?: string;
    status?: string;
    notes?: string;
  }) => api.post('/attendance/record', data),
};

// Payroll APIs
export const payrollAPI = {
  getAll: (params?: {
    month?: number;
    year?: number;
    employeeId?: string;
  }) => api.get('/payroll', { params }),
  
  getById: (id: string) => api.get(`/payroll/${id}`),
  
  create: (payrollData: {
    employeeId: string;
    month: number;
    year: number;
    baseSalary: number;
    bonuses?: number;
    deductions?: number;
  }) => api.post('/payroll', payrollData),
  
  update: (id: string, data: {
    status?: string;
    bonuses?: number;
    deductions?: number;
  }) => api.patch(`/payroll/${id}`, data),
  
  bulkGenerate: (data: { month: number; year: number }) => 
    api.post('/payroll/bulk-generate', data),
};

// Notification APIs
export const notificationAPI = {
  getAll: (params?: { isRead?: boolean; limit?: number }) => 
    api.get('/notifications', { params }),
  
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
  
  markAllAsRead: () => api.patch('/notifications/read-all'),
  
  delete: (id: string) => api.delete(`/notifications/${id}`),
};

// Department APIs
export const departmentAPI = {
  getAll: () => api.get('/departments'),
  
  getById: (id: string) => api.get(`/departments/${id}`),
  
  create: (data: {
    name: string;
    description: string;
    managerId?: string;
  }) => api.post('/departments', data),
  
  update: (id: string, data: {
    name?: string;
    description?: string;
    managerId?: string;
  }) => api.patch(`/departments/${id}`, data),
  
  delete: (id: string) => api.delete(`/departments/${id}`),
};

export default api;
