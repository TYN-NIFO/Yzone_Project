import { pool } from "../../config/db";
import bcrypt from "bcryptjs";

export class UserService {
  async createUser(data: any, creatorTenantId: string) {
    const { tenantId, cohortId, name, email, password, role, phone, whatsappNumber } = data;

    // Validate role
    const validRoles = ['tynExecutive', 'facilitator', 'facultyPrincipal', 'industryMentor', 'student'];
    if (!validRoles.includes(role)) {
      throw new Error('Invalid role');
    }

    // Check if user already exists
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1 AND tenant_id = $2 AND deleted_at IS NULL",
      [email, tenantId || creatorTenantId]
    );

    if (existingUser.rows.length > 0) {
      throw new Error("User with this email already exists");
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (tenant_id, cohort_id, name, email, password_hash, role, phone, whatsapp_number)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, tenant_id, cohort_id, name, email, role, phone, whatsapp_number, is_active, created_at`,
      [tenantId || creatorTenantId, cohortId || null, name, email, passwordHash, role, phone, whatsappNumber]
    );

    return result.rows[0];
  }

  async getAllUsers(tenantId: string, role?: string, userRole?: string) {
      let query = `
        SELECT u.id, u.name, u.email, u.role, u.phone, u.whatsapp_number, u.is_active, u.created_at,
          c.name as cohort_name, t.name as tenant_name
        FROM users u
        LEFT JOIN cohorts c ON u.cohort_id = c.id
        LEFT JOIN tenants t ON u.tenant_id = t.id
        WHERE u.deleted_at IS NULL
      `;

      const params: any[] = [];

      // Tyn Executive can see all users, others only see their tenant
      if (userRole !== 'tynExecutive') {
        params.push(tenantId);
        query += ` AND u.tenant_id = $${params.length}`;
      }

      if (role) {
        params.push(role);
        query += ` AND u.role = $${params.length}`;
      }

      query += ` ORDER BY u.created_at DESC`;

      const result = await pool.query(query, params);
      return result.rows;
    }

  async getUserById(id: string, tenantId: string) {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.phone, u.whatsapp_number, u.is_active, u.created_at,
        c.name as cohort_name, c.id as cohort_id, t.name as tenant_name, t.id as tenant_id
       FROM users u
       LEFT JOIN cohorts c ON u.cohort_id = c.id
       LEFT JOIN tenants t ON u.tenant_id = t.id
       WHERE u.id = $1 AND u.tenant_id = $2 AND u.deleted_at IS NULL`,
      [id, tenantId]
    );
    return result.rows[0];
  }

  async updateUser(id: string, data: any, tenantId: string) {
    const { name, email, phone, whatsappNumber, cohortId, isActive } = data;

    const result = await pool.query(
      `UPDATE users 
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           phone = COALESCE($3, phone),
           whatsapp_number = COALESCE($4, whatsapp_number),
           cohort_id = COALESCE($5, cohort_id),
           is_active = COALESCE($6, is_active)
       WHERE id = $7 AND tenant_id = $8 AND deleted_at IS NULL
       RETURNING id, tenant_id, cohort_id, name, email, role, phone, whatsapp_number, is_active`,
      [name, email, phone, whatsappNumber, cohortId, isActive, id, tenantId]
    );

    return result.rows[0];
  }

  async deleteUser(id: string, tenantId: string) {
    await pool.query(
      `UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    // Get user
    const result = await pool.query(
      "SELECT password_hash FROM users WHERE id = $1 AND deleted_at IS NULL",
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error("User not found");
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!isValid) {
      throw new Error("Current password is incorrect");
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await pool.query(
      "UPDATE users SET password_hash = $1 WHERE id = $2",
      [newPasswordHash, userId]
    );
  }

  async resetPassword(userId: string, newPassword: string, tenantId: string) {
    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await pool.query(
      "UPDATE users SET password_hash = $1 WHERE id = $2 AND tenant_id = $3",
      [newPasswordHash, userId, tenantId]
    );
  }

  async getUsersByRole(tenantId: string, role: string) {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.phone, u.whatsapp_number, u.cohort_id, c.name as cohort_name
       FROM users u
       LEFT JOIN cohorts c ON u.cohort_id = c.id
       WHERE u.tenant_id = $1 AND u.role = $2 AND u.deleted_at IS NULL AND u.is_active = true
       ORDER BY u.name`,
      [tenantId, role]
    );
    return result.rows;
  }

  async getUsersByCohort(cohortId: string, tenantId: string) {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.phone, u.whatsapp_number, u.is_active
       FROM users u
       WHERE u.cohort_id = $1 AND u.tenant_id = $2 AND u.deleted_at IS NULL
       ORDER BY u.role, u.name`,
      [cohortId, tenantId]
    );
    return result.rows;
  }
}
