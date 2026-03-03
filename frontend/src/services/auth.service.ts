import { apiService } from './api.service';
import { API_ENDPOINTS } from '../config/api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  tenantId: string;
  cohortId?: string;
  name: string;
  email: string;
  password: string;
  role: string;
  phone?: string;
  whatsappNumber?: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    tenantId: string;
    cohortId?: string;
  };
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>(API_ENDPOINTS.LOGIN, credentials);
    
    if (response.success && response.data) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      return response.data;
    }
    
    throw new Error(response.message || 'Login failed');
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>(API_ENDPOINTS.REGISTER, data);
    
    if (response.success && response.data) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      return response.data;
    }
    
    throw new Error(response.message || 'Registration failed');
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  getCurrentUser(): AuthResponse['user'] | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export const authService = new AuthService();
