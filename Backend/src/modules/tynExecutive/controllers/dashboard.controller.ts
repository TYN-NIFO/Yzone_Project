import { Response } from "express";
import { pool } from "../../../config/db";
import { AuthRequest } from "../../../types/custom-request";

export class DashboardController {
  async getExecutiveDashboard(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;

      const stats = await pool.query(
        `SELECT 
          (SELECT COUNT(*) FROM tenants WHERE deleted_at IS NULL) as total_tenants,
          (SELECT COUNT(*) FROM cohorts WHERE tenant_id = $1 AND deleted_at IS NULL) as total_cohorts,
          (SELECT COUNT(*) FROM users WHERE tenant_id = $1 AND role = 'student' AND deleted_at IS NULL) as total_students,
          (SELECT COUNT(*) FROM users WHERE tenant_id = $1 AND role = 'facilitator' AND deleted_at IS NULL) as total_facilitators,
          (SELECT COUNT(*) FROM users WHERE tenant_id = $1 AND role = 'industryMentor' AND deleted_at IS NULL) as total_mentors,
          (SELECT COUNT(*) FROM tracker_entries WHERE tenant_id = $1 AND entry_date = CURRENT_DATE) as today_submissions,
          (SELECT COUNT(*) FROM users WHERE tenant_id = $1 AND role = 'student' AND deleted_at IS NULL) as total_students_count`,
        [tenantId]
      );

      const trackerCompliance = await pool.query(
        `SELECT 
          ROUND((COUNT(DISTINCT te.student_id)::numeric / NULLIF(COUNT(DISTINCT u.id), 0)) * 100, 2) as compliance_percentage
         FROM users u
         LEFT JOIN tracker_entries te ON u.id = te.student_id AND te.entry_date = CURRENT_DATE
         WHERE u.tenant_id = $1 AND u.role = 'student' AND u.deleted_at IS NULL`,
        [tenantId]
      );

      const recentActivity = await pool.query(
        `SELECT u.name, te.entry_date, te.hours_spent, c.name as cohort_name
         FROM tracker_entries te
         JOIN users u ON te.student_id = u.id
         JOIN cohorts c ON te.cohort_id = c.id
         WHERE te.tenant_id = $1
         ORDER BY te.submitted_at DESC
         LIMIT 10`,
        [tenantId]
      );

      const cohortPerformance = await pool.query(
        `SELECT c.name, c.id,
          COUNT(DISTINCT u.id) as student_count,
          AVG(l.total_score) as avg_score,
          COUNT(DISTINCT te.id) FILTER (WHERE te.entry_date >= CURRENT_DATE - INTERVAL '7 days') as recent_submissions
         FROM cohorts c
         LEFT JOIN users u ON c.id = u.cohort_id AND u.role = 'student' AND u.deleted_at IS NULL
         LEFT JOIN leaderboard l ON u.id = l.student_id
         LEFT JOIN tracker_entries te ON u.id = te.student_id
         WHERE c.tenant_id = $1 AND c.deleted_at IS NULL
         GROUP BY c.id, c.name
         ORDER BY avg_score DESC`,
        [tenantId]
      );

      res.status(200).json({
        success: true,
        data: {
          stats: {
            ...stats.rows[0],
            tracker_compliance: trackerCompliance.rows[0].compliance_percentage || 0,
          },
          recentActivity: recentActivity.rows,
          cohortPerformance: cohortPerformance.rows,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
