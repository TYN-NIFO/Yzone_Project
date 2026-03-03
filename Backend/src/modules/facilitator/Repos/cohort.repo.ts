import { pool } from "../../../config/db";
import { Cohort } from "../types/cohort.types";

export class CohortRepo {
  async createCohort(data: Cohort) {
    const { tenantId, name, startDate, endDate } = data;
    
    // Generate a cohort code if not provided
    const cohortCode = (data as any).cohortCode || `COH${Date.now().toString().slice(-6)}`;
    
    const result = await pool.query(
      `INSERT INTO cohorts (tenant_id, name, cohort_code, start_date, end_date) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [tenantId, name, cohortCode, startDate, endDate]
    );
    return result.rows[0];
  }

  async getByTenant(tenantId: string) {
    const result = await pool.query(
      `SELECT * FROM cohorts WHERE tenant_id = $1 ORDER BY created_at DESC`,
      [tenantId]
    );
    return result.rows;
  }

  // ✅ Add this method to get all cohorts
  async getAll(): Promise<Cohort[]> {
    const result = await pool.query(
      `SELECT * FROM cohorts ORDER BY created_at DESC`
    );
    return result.rows;
  }
}