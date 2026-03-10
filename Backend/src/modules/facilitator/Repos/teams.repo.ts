import { pool } from "../../../config/db";
import { Team } from "../types/teams.types";

export class TeamsRepo {
  async createTeam(data: Team) {
    const { cohortId, name, tenant_id } = data;
    
    // Use a dummy project_id for now since the projects table structure is different
    const dummyProjectId = '00000000-0000-0000-0000-000000000000';
    
    const result = await pool.query(
      `INSERT INTO teams (cohort_id, tenant_id, project_id, name) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [cohortId, tenant_id, dummyProjectId, name]
    );
    return result.rows[0];
  }

  async getTeamsByCohort(cohortId: string) {
    const result = await pool.query(
      `SELECT t.*, 
              u.name as mentor_name,
              u.email as mentor_email,
              COUNT(DISTINCT tm.student_id) as member_count,
              p.id as project_id,
              p.title as project_title,
              p.type as project_type,
              p.status as project_status
       FROM teams t
       LEFT JOIN users u ON t.mentor_id = u.id
       LEFT JOIN team_members tm ON t.id = tm.team_id
       LEFT JOIN projects p ON t.id = p.team_id
       WHERE t.cohort_id = $1
       GROUP BY t.id, u.name, u.email, p.id, p.title, p.type, p.status
       ORDER BY t.created_at DESC`,
      [cohortId]
    );
    return result.rows;
  }
}