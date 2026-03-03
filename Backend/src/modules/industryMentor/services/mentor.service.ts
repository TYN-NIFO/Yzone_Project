import { pool } from "../../../config/db";
import bcrypt from "bcryptjs";

export class MentorService {
  async createMentor(data: any, creatorTenantId: string) {
    const { name, email, password, phone, whatsappNumber, tenantId, cohortId } = data;

    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1 AND tenant_id = $2 AND deleted_at IS NULL",
      [email, tenantId || creatorTenantId]
    );

    if (existingUser.rows.length > 0) {
      throw new Error("Mentor with this email already exists");
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (tenant_id, cohort_id, name, email, password_hash, role, phone, whatsapp_number)
       VALUES ($1, $2, $3, $4, $5, 'industryMentor', $6, $7)
       RETURNING id, tenant_id, cohort_id, name, email, role, phone, whatsapp_number, created_at`,
      [tenantId || creatorTenantId, cohortId || null, name, email, passwordHash, phone, whatsappNumber]
    );

    return result.rows[0];
  }

  async getAllMentors(tenantId: string) {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.phone, u.whatsapp_number, u.cohort_id, u.is_active, u.created_at,
        c.name as cohort_name,
        (SELECT COUNT(*) FROM mentor_assignments WHERE mentor_id = u.id AND is_active = true) as assigned_students
       FROM users u
       LEFT JOIN cohorts c ON u.cohort_id = c.id
       WHERE u.tenant_id = $1 AND u.role = 'industryMentor' AND u.deleted_at IS NULL
       ORDER BY u.created_at DESC`,
      [tenantId]
    );
    return result.rows;
  }

  async getMentorById(id: string, tenantId: string) {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.phone, u.whatsapp_number, u.cohort_id, u.is_active, u.created_at,
        c.name as cohort_name
       FROM users u
       LEFT JOIN cohorts c ON u.cohort_id = c.id
       WHERE u.id = $1 AND u.tenant_id = $2 AND u.role = 'industryMentor' AND u.deleted_at IS NULL`,
      [id, tenantId]
    );
    return result.rows[0];
  }

  async assignStudentsToMentor(mentorId: string, studentIds: string[], tenantId: string, cohortId: string) {
    const results = [];

    for (const studentId of studentIds) {
      try {
        const result = await pool.query(
          `INSERT INTO mentor_assignments (mentor_id, student_id, tenant_id, cohort_id)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (mentor_id, student_id, cohort_id) 
           DO UPDATE SET is_active = true, updated_at = CURRENT_TIMESTAMP
           RETURNING *`,
          [mentorId, studentId, tenantId, cohortId]
        );
        results.push(result.rows[0]);
      } catch (error) {
        console.error(`Failed to assign student ${studentId}:`, error);
      }
    }

    return results;
  }

  async getAssignedStudents(mentorId: string, tenantId: string) {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.phone, c.name as cohort_name, ma.assigned_at,
        (SELECT COUNT(*) FROM tracker_entries WHERE student_id = u.id AND entry_date >= CURRENT_DATE - INTERVAL '7 days') as recent_trackers,
        (SELECT total_score FROM leaderboard WHERE student_id = u.id) as score,
        (SELECT rank FROM leaderboard WHERE student_id = u.id) as rank
       FROM mentor_assignments ma
       JOIN users u ON ma.student_id = u.id
       LEFT JOIN cohorts c ON u.cohort_id = c.id
       WHERE ma.mentor_id = $1 AND ma.tenant_id = $2 AND ma.is_active = true
       ORDER BY u.name`,
      [mentorId, tenantId]
    );
    return result.rows;
  }

  async submitReview(data: any) {
    const { mentorId, studentId, tenantId, rating, feedback } = data;

    // Get student's cohort_id
    const studentResult = await pool.query(
      'SELECT cohort_id FROM users WHERE id = $1 AND deleted_at IS NULL',
      [studentId]
    );

    if (studentResult.rows.length === 0) {
      throw new Error('Student not found');
    }

    const cohortId = studentResult.rows[0].cohort_id;

    if (!cohortId) {
      throw new Error('Student is not assigned to a cohort');
    }

    const result = await pool.query(
      `INSERT INTO mentor_reviews (mentor_id, student_id, tenant_id, cohort_id, rating, feedback)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [mentorId, studentId, tenantId, cohortId, rating, feedback]
    );

    await pool.query(
      `INSERT INTO notifications (user_id, tenant_id, type, title, message)
       VALUES ($1, $2, 'mentor_comment', 'New Mentor Feedback', $3)`,
      [studentId, tenantId, `Your mentor has provided feedback: ${feedback.substring(0, 100)}...`]
    );

    return result.rows[0];
  }

  async getReviews(studentId: string, tenantId: string) {
    const result = await pool.query(
      `SELECT mr.*, u.name as mentor_name
       FROM mentor_reviews mr
       JOIN users u ON mr.mentor_id = u.id
       WHERE mr.student_id = $1 AND mr.tenant_id = $2
       ORDER BY mr.review_date DESC`,
      [studentId, tenantId]
    );
    return result.rows;
  }
}
