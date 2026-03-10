// src/modules/facilitator/types/project.types.ts
export interface Project {
  id?: string;
  cohortId: string; 
  teamId?: string | null;
  tenantId: string;
  type: 'MINI' | 'MAJOR';
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status?: string; // Default "PENDING"
}