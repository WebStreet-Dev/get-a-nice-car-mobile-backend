export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  isActive: boolean;
  accountStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectedReason?: string;
  fcmToken?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  name: string;
  phone: string;
  email: string;
  description: string;
  icon: string;
  isActive: boolean;
  sortOrder: number;
}

export interface Appointment {
  id: string;
  userId: string;
  departmentId: string;
  dateTime: string;
  vehicleOfInterest?: string;
  notes?: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  createdAt: string;
  updatedAt: string;
  user?: Pick<User, 'id' | 'name' | 'email' | 'phone'>;
  department?: Department;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: 'SALES' | 'SERVICE' | 'GENERAL' | 'ACCOUNTING';
  isPublished: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface BreakdownRequest {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  locationType: 'CURRENT' | 'LIVE';
  liveDurationMinutes?: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED';
  notes?: string;
  createdAt: string;
  resolvedAt?: string;
  user?: Pick<User, 'id' | 'name' | 'email' | 'phone'>;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'APPOINTMENT' | 'OFFER' | 'PAYMENT' | 'SERVICE' | 'GENERAL';
  isRead: boolean;
  data?: Record<string, unknown>;
  createdAt: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalAppointments: number;
  pendingAppointments: number;
  activeBreakdowns: number;
  totalDepartments: number;
  totalFaqs: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}




