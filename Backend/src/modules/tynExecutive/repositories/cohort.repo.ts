import { pool } from "../../../config/db";

class CohortRepository {
  static async create(data: any) {
    const { tenantId, name, cohortCode, startDate, endDate, facilitatorId } = data;

    const result = await pool.query(
      `INSERT INTO cohorts (tenant_id, name, cohort_code, start_date, end_date, facilitator_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [tenantId, name, cohortCode, startDate, endDate, facilitatorId || null]
    );

    return result.rows[0];
  }

  static async getByTenant(tenantId: string) {
    const result = await pool.query(
      `SELECT c.*, u.name as facilitator_name,
        (SELECT COUNT(*) FROM users WHERE cohort_id = c.id AND role = 'student' AND deleted_at IS NULL) as student_count
       FROM cohorts c
       LEFT JOIN users u ON c.facilitator_id = u.id
       WHERE c.tenant_id = $1 AND c.deleted_at IS NULL
       ORDER BY c.created_at DESC`,
      [tenantId]
    );
    return result.rows;
  }

  static async getById(id: string, tenantId: string) {
    const result = await pool.query(
      `SELECT c.*, u.name as facilitator_name,
        (SELECT COUNT(*) FROM users WHERE cohort_id = c.id AND role = 'student' AND deleted_at IS NULL) as student_count
       FROM cohorts c
       LEFT JOIN users u ON c.facilitator_id = u.id
       WHERE c.id = $1 AND c.tenant_id = $2 AND c.deleted_at IS NULL`,
      [id, tenantId]
    );
    return result.rows[0];
  }

  static async update(id: string, data: any, tenantId: string) {
    const { name, startDate, endDate, facilitatorId, isActive } = data;

    const result = await pool.query(
      `UPDATE cohorts 
       SET name = COALESCE($1, name),
           start_date = COALESCE($2, start_date),
           end_date = COALESCE($3, end_date),
           facilitator_id = COALESCE($4, facilitator_id),
           is_active = COALESCE($5, is_active)
       WHERE id = $6 AND tenant_id = $7 AND deleted_at IS NULL
       RETURNING *`,
      [name, startDate, endDate, facilitatorId, isActive, id, tenantId]
    );

    return result.rows[0];
  }

  static async delete(id: string, tenantId: string) {
    await pool.query(
      `UPDATE cohorts SET deleted_at = CURRENT_TIMESTAMP 
       WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );
  }

  static async getStats(cohortId: string) {
    const stats = await pool.query(
      `SELECT 
        (SELECT COUNT(*) FROM users WHERE cohort_id = $1 AND role = 'student' AND deleted_at IS NULL) as total_students,
        (SELECT COUNT(*) FROM tracker_entries WHERE cohort_id = $1 AND entry_date = CURRENT_DATE) as today_submissions,
        (SELECT AVG(total_score) FROM leaderboard WHERE cohort_id = $1) as avg_score,
        (SELECT COUNT(*) FROM sessions WHERE cohort_id = $1) as total_sessions`,
      [cohortId]
    );

    return stats.rows[0];
  }

  static async assignFacilitator(cohortId: string, facilitatorId: string, tenantId: string) {
    const result = await pool.query(
      `UPDATE cohorts 
       SET facilitator_id = $1
       WHERE id = $2 AND tenant_id = $3 AND deleted_at IS NULL
       RETURNING *`,
      [facilitatorId, cohortId, tenantId]
    );

    return result.rows[0];
  }
}

export default CohortRepository;
