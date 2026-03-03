import { apiService } from './api.service';

export interface CreateUserData {
  tenantId?: string;
  cohortId?: string;
  name: string;
  email: string;
  password: string;
  role: 'tynExecutive' | 'facilitator' | 'facultyPrincipal' | 'industryMentor' | 'student';
  phone?: string;
  whatsappNumber?: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  phone?: string;
  whatsappNumber?: string;
  cohortId?: string;
  isActive?: boolean;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

class UserService {
  async createUser(data: CreateUserData) {
    const response = await apiService.post('/users', data);
    return response.data;
  }

  async getAllUsers(role?: string) {
    const endpoint = role ? `/users?role=${role}` : '/users';
    const response = await apiService.get(endpoint);
    return response.data;
  }

  async getUserById(id: string) {
    const response = await apiService.get(`/users/${id}`);
    return response.data;
  }

  async updateUser(id: string, data: UpdateUserData) {
    const response = await apiService.put(`/users/${id}`, data);
    return response.data;
  }

  async deleteUser(id: string) {
    const response = await apiService.delete(`/users/${id}`);
    return response.data;
  }

  async changePassword(data: ChangePasswordData) {
    const response = await apiService.post('/users/change-password', data);
    return response.data;
  }

  async resetPassword(userId: string, newPassword: string) {
    const response = await apiService.post(`/users/${userId}/reset-password`, { newPassword });
    return response.data;
  }

  async getUsersByRole(role: string) {
    const response = await apiService.get(`/users/role/${role}`);
    return response.data;
  }

  async getUsersByCohort(cohortId: string) {
    const response = await apiService.get(`/users/cohort/${cohortId}`);
    return response.data;
  }
}

export const userService = new UserService();
