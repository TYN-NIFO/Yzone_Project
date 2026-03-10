// src/modules/facilitator/types/teams.types.ts
export interface Team {
  id?: string;
  cohortId: string; // UUID of cohort
  tenant_id: string; // UUID of tenant
  project_id?: string; // UUID of project
  name: string;
  description?: string;
  maxMembers?: number;
  mentor_id?: string; // UUID of assigned mentor
}