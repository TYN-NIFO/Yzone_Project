// src/modules/facilitator/types/cohort.types.ts
export interface Cohort {
  id?: string;
  tenantId: string;   // UUID of tenant
  name: string;
  cohortCode?: string; // Cohort code (optional, will be auto-generated if not provided)
  startDate?: string; // ISO date string
  endDate?: string;   // ISO date string
}