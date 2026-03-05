import { pool } from "../../../config/db";
import { Team } from "../types/teams.types";

export class TeamsRepo {
  async createTeam(data: Team) {
    const { cohortId, name } = data;
    const result = await pool.query(
      `INSERT INTO teams (cohort_id, name) VALUES ($1,$2) RETURNING *`,
      [cohortId, name]
    );
    return result.rows[0];
  }

  async getTeamsByCohort(cohortId: string) {
    const result = await pool.query(
      `SELECT t.*, 
              u.name as mentor_name,
              u.email as mentor_email,
              COUNT(DISTINCT tm.student_id) as member_count
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