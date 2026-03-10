import { pool } from "../../../config/db";
import { Project } from "../types/project.types";

export class ProjectsRepo {
  async createProject(data: Project) {
    const { cohortId, teamId, tenantId, type, title, description, startDate, endDate, status } = data;
    const result = await pool.query(
      `INSERT INTO projects (id, cohort_id, team_id, tenant_id, type, title, description, start_date, end_date, status, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP) 
       RETURNING *`,
      [cohortId, teamId || null, tenantId, type, title, description || null, startDate || null, endDate || null, status || "PENDING"]
    );
    return result.rows[0];
  }

  async getProjectsByCohort(cohortId: string) {
    const result = await pool.query(
      `SELECT * FROM projects WHERE cohort_id = $1 ORDER BY created_at DESC`,
      [cohortId]
    );
    return result.rows;
  }

  async getProjectsByTeam(teamId: string) {
    const result = await pool.query(
      `SELECT * FROM projects WHERE team_id = $1 ORDER BY created_at DESC`,
      [teamId]
    );
    return result.rows;
  }
}