import { pool } from "../../../config/db";
import { Team } from "../types/teams.types";

export class TeamsRepo {
  async createTeam(data: Team) {
    const { cohortId, name, tenant_id } = data;

    const result = await pool.query(
      `INSERT INTO teams (cohort_id, tenant_id, name) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [cohortId, tenant_id, name]
    );
    return result.rows[0];
  }

  async getTeamsByCohort(cohortId: string) {
    const result = await pool.query(
      `SELECT t.*,
              u.name as mentor_name,
              u.email as mentor_email,
              COUNT(DISTINCT tm.student_id) as member_count,
              (SELECT p.id FROM projects p WHERE p.team_id = t.id LIMIT 1) as project_id,
              (SELECT p.title FROM projects p WHERE p.team_id = t.id LIMIT 1) as project_title,
              (SELECT p.status FROM projects p WHERE p.team_id = t.id LIMIT 1) as project_status
       FROM teams t
       LEFT JOIN users u ON t.mentor_id = u.id
       LEFT JOIN team_members tm ON t.id = tm.team_id
       WHERE t.cohort_id = $1
       GROUP BY t.id, u.name, u.email
       ORDER BY t.created_at DESC`,
      [cohortId]
    );
    return result.rows;
  }
}