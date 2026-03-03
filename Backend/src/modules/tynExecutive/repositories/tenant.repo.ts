import { pool } from "../../../config/db";

class TenantRepository {
  static async create(data: any) {
    const { name, institutionCode, contactEmail, contactPhone, address } = data;

    const result = await pool.query(
      `INSERT INTO tenants (name, institution_code, contact_email, contact_phone, address)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, institutionCode, contactEmail, contactPhone, address]
    );

    return result.rows[0];
  }

  static async getAll() {
    const result = await pool.query(
      `SELECT * FROM tenants WHERE deleted_at IS NULL ORDER BY created_at DESC`
    );
    return result.rows;
  }

  static async getById(id: string) {
    const result = await pool.query(
      `SELECT * FROM tenants WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );
    return result.rows[0];
  }

  static async update(id: string, data: any) {
    const { name, contactEmail, contactPhone, address, isActive } = data;

    const result = await pool.query(
      `UPDATE tenants 
       SET name = COALESCE($1, name),
           contact_email = COALESCE($2, contact_email),
           contact_phone = COALESCE($3, contact_phone),
           address = COALESCE($4, address),
           is_active = COALESCE($5, is_active)
       WHERE id = $6 AND deleted_at IS NULL
       RETURNING *`,
      [name, contactEmail, contactPhone, address, isActive, id]
    );

    return result.rows[0];
  }

  static async delete(id: string) {
    await pool.query(
      `UPDATE tenants SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [id]
    );
  }

  static async getStats(tenantId: string) {
    const stats = await pool.query(
      `SELECT 
        (SELECT COUNT(*) FROM cohorts WHERE tenant_id = $1 AND deleted_at IS NULL) as total_cohorts,
        (SELECT COUNT(*) FROM users WHERE tenant_id = $1 AND role = 'student' AND deleted_at IS NULL) as total_students,
        (SELECT COUNT(*) FROM users WHERE tenant_id = $1 AND role = 'facilitator' AND deleted_at IS NULL) as total_facilitators,
        (SELECT COUNT(*) FROM users WHERE tenant_id = $1 AND role = 'industryMentor' AND deleted_at IS NULL) as total_mentors,
        (SELECT COUNT(*) FROM tracker_entries WHERE tenant_id = $1 AND entry_date = CURRENT_DATE) as today_submissions`,
      [tenantId]
    );

    return stats.rows[0];
  }
}

export default TenantRepository;
