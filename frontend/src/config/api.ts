export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  
  // Executive
  EXECUTIVE_DASHBOARD: '/executive/dashboard',
  TENANTS: '/executive/tenants',
  COHORTS: '/executive/cohorts',
  CREATE_MENTOR: '/executive/mentor/create',
  ASSIGN_MENTOR: '/executive/mentor/assign',
  
  // Facilitator
  FACILITATOR_DASHBOARD: '/facilitator/dashboard',
  
  // Faculty
  FACULTY_DASHBOARD: '/faculty/dashboard',
  
  // Mentor
  MENTOR_DASHBOARD: '/mentor/dashboard',
  MENTOR_STUDENTS: '/mentor/students',
  MENTOR_REVIEW: '/mentor/review',
  
  // Student
  STUDENT_DASHBOARD: '/student/dashboard',
  STUDENT_TRACKER: '/student/tracker',
  STUDENT_NOTIFICATIONS: '/student/notifications',
  LEADERBOARD: '/student/leaderboard',
};

export const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};
