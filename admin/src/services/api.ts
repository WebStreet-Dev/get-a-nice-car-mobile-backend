import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type {
  ApiResponse,
  PaginatedResponse,
  LoginResponse,
  User,
  Appointment,
  Department,
  FAQ,
  BreakdownRequest,
  DashboardStats,
} from '../types';

const API_URL = '/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
          `${API_URL}/auth/refresh`,
          { refreshToken }
        );

        if (response.data.data) {
          localStorage.setItem('accessToken', response.data.data.accessToken);
          localStorage.setItem('refreshToken', response.data.data.refreshToken);
          originalRequest.headers.Authorization = `Bearer ${response.data.data.accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await api.post<ApiResponse<LoginResponse>>('/auth/login', { email, password });
    return response.data.data!;
  },
  logout: async (): Promise<void> => {
    const refreshToken = localStorage.getItem('refreshToken');
    await api.post('/auth/logout', { refreshToken });
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },
  me: async (): Promise<User> => {
    const response = await api.get<ApiResponse<User>>('/auth/me');
    return response.data.data!;
  },
};

// Admin API
export const adminApi = {
  // Dashboard
  getDashboard: async (): Promise<{ stats: DashboardStats; recentAppointments: Appointment[] }> => {
    const response = await api.get<ApiResponse<{ stats: DashboardStats; recentAppointments: Appointment[] }>>('/admin/dashboard');
    return response.data.data!;
  },

  // Users
  getUsers: async (params: { page?: number; limit?: number; search?: string }): Promise<PaginatedResponse<User>> => {
    const response = await api.get<PaginatedResponse<User>>('/admin/users', { params });
    return response.data;
  },
  getPendingUsers: async (params: { page?: number; limit?: number }): Promise<PaginatedResponse<User>> => {
    const response = await api.get<PaginatedResponse<User>>('/admin/users/pending', { params });
    return response.data;
  },
  approveUser: async (id: string): Promise<User> => {
    const response = await api.put<ApiResponse<User>>(`/admin/users/${id}/approve`);
    return response.data.data!;
  },
  rejectUser: async (id: string, reason: string): Promise<User> => {
    const response = await api.put<ApiResponse<User>>(`/admin/users/${id}/reject`, { reason });
    return response.data.data!;
  },
  createInternalUser: async (data: { name: string; email: string; phone: string; password: string; role: string; customRoleId?: string }): Promise<User> => {
    const response = await api.post<ApiResponse<User>>('/admin/users/create-internal', data);
    return response.data.data!;
  },
  toggleUserStatus: async (id: string): Promise<User> => {
    const response = await api.put<ApiResponse<User>>(`/admin/users/${id}/toggle-status`);
    return response.data.data!;
  },

  // Appointments
  getAppointments: async (params: { page?: number; limit?: number; status?: string; departmentId?: string }): Promise<PaginatedResponse<Appointment>> => {
    const response = await api.get<PaginatedResponse<Appointment>>('/admin/appointments', { params });
    return response.data;
  },
  updateAppointmentStatus: async (id: string, status: string): Promise<Appointment> => {
    const response = await api.put<ApiResponse<Appointment>>(`/admin/appointments/${id}/status`, { status });
    return response.data.data!;
  },
  approveAppointment: async (id: string): Promise<Appointment> => {
    const response = await api.put<ApiResponse<Appointment>>(`/admin/appointments/${id}/approve`);
    return response.data.data!;
  },
  rejectAppointment: async (id: string): Promise<Appointment> => {
    const response = await api.put<ApiResponse<Appointment>>(`/admin/appointments/${id}/reject`);
    return response.data.data!;
  },

  // Departments
  getDepartments: async (): Promise<Department[]> => {
    const response = await api.get<ApiResponse<Department[]>>('/admin/departments');
    return response.data.data!;
  },
  createDepartment: async (data: Partial<Department>): Promise<Department> => {
    const response = await api.post<ApiResponse<Department>>('/admin/departments', data);
    return response.data.data!;
  },
  updateDepartment: async (id: string, data: Partial<Department>): Promise<Department> => {
    const response = await api.put<ApiResponse<Department>>(`/admin/departments/${id}`, data);
    return response.data.data!;
  },
  deleteDepartment: async (id: string): Promise<void> => {
    await api.delete(`/admin/departments/${id}`);
  },

  // FAQs
  getFaqs: async (): Promise<FAQ[]> => {
    const response = await api.get<ApiResponse<FAQ[]>>('/admin/faqs');
    return response.data.data!;
  },
  createFaq: async (data: Partial<FAQ>): Promise<FAQ> => {
    const response = await api.post<ApiResponse<FAQ>>('/admin/faqs', data);
    return response.data.data!;
  },
  updateFaq: async (id: string, data: Partial<FAQ>): Promise<FAQ> => {
    const response = await api.put<ApiResponse<FAQ>>(`/admin/faqs/${id}`, data);
    return response.data.data!;
  },
  deleteFaq: async (id: string): Promise<void> => {
    await api.delete(`/admin/faqs/${id}`);
  },

  // Breakdown Requests
  getBreakdownRequests: async (params: { page?: number; limit?: number; status?: string }): Promise<PaginatedResponse<BreakdownRequest>> => {
    const response = await api.get<PaginatedResponse<BreakdownRequest>>('/admin/breakdown', { params });
    return response.data;
  },
  updateBreakdownStatus: async (id: string, status: string): Promise<BreakdownRequest> => {
    const response = await api.put<ApiResponse<BreakdownRequest>>(`/admin/breakdown/${id}/status`, { status });
    return response.data.data!;
  },

  // Notifications
  sendBroadcast: async (data: { title: string; body: string; type: string }): Promise<{ sent: number; failed: number }> => {
    const response = await api.post<ApiResponse<{ sent: number; failed: number }>>('/admin/notifications/broadcast', data);
    return response.data.data!;
  },
};

export default api;




