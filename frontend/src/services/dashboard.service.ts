import { apiService } from './api.service';
import { API_ENDPOINTS } from '../config/api';

class DashboardService {
  // Executive Dashboard
  async getExecutiveDashboard() {
    const response = await apiService.get(API_ENDPOINTS.EXECUTIVE_DASHBOARD);
    return response.data;
  }

  async getTenants() {
    const response = await apiService.get(API_ENDPOINTS.TENANTS);
    return response.data;
  }

  async createTenant(data: any) {
    const response = await apiService.post(API_ENDPOINTS.TENANTS, data);
    return response.data;
  }

  async getCohorts(tenantId: string) {
    const response = await apiService.get(`${API_ENDPOINTS.COHORTS}/${tenantId}`);
    return response.data;
  }

  async createCohort(data: any) {
    const response = await apiService.post(API_ENDPOINTS.COHORTS, data);
    return response.data;
  }

  async createMentor(data: any) {
    const response = await apiService.post(API_ENDPOINTS.CREATE_MENTOR, data);
    return response.data;
  }

  async assignMentor(data: any) {
    const response = await apiService.post(API_ENDPOINTS.ASSIGN_MENTOR, data);
    return response.data;
  }

  // Facilitator Dashboard
  async getFacilitatorDashboard() {
    const response = await apiService.get(API_ENDPOINTS.FACILITATOR_DASHBOARD);
    return response.data;
  }

  // Faculty Dashboard
  async getFacultyDashboard() {
    const response = await apiService.get(API_ENDPOINTS.FACULTY_DASHBOARD);
    return response.data;
  }

  // Mentor Dashboard
  async getMentorDashboard() {
    const response = await apiService.get(API_ENDPOINTS.MENTOR_DASHBOARD);
    return response.data;
  }

  async getMentorStudents() {
    const response = await apiService.get(API_ENDPOINTS.MENTOR_STUDENTS);
    return response.data;
  }

  async submitReview(data: any) {
    const response = await apiService.post(API_ENDPOINTS.MENTOR_REVIEW, data);
    return response.data;
  }

  // Student Dashboard
  async getStudentDashboard() {
    const response = await apiService.get(API_ENDPOINTS.STUDENT_DASHBOARD);
    return response.data;
  }

  async submitTracker(data: any, file?: File) {
    if (file) {
      const response = await apiService.uploadFile(API_ENDPOINTS.STUDENT_TRACKER, file, data);
      return response.data;
    } else {
      const response = await apiService.post(API_ENDPOINTS.STUDENT_TRACKER, data);
      return response.data;
    }
  }

  async getNotifications() {
    const response = await apiService.get(API_ENDPOINTS.STUDENT_NOTIFICATIONS);
    return response.data;
  }

  async getLeaderboard() {
    const response = await apiService.get(API_ENDPOINTS.LEADERBOARD);
    return response.data;
  }
}

export const dashboardService = new DashboardService();
