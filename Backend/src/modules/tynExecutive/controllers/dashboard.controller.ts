import { Response } from "express";
import { pool } from "../../../config/db";
import { AuthRequest } from "../../../types/custom-request";

export class DashboardController {
  async getExecutiveDashboard(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const userRole = req.user!.role;

      // Tyn Executive can see all data across tenants
      const tenantFilter = userRole === 'tynExecutive' ? '' : 'WHERE tenant_id = $1';
      const tenantParam = userRole === 'tynExecutive' ? [] : [tenantId];

      const stats = await pool.query(
        `SELECT 
          (SELECT COUNT(*) FROM tenants WHERE deleted_at IS NULL) as total_tenants,
          (SELECT COUNT(*) FROM cohorts WHERE deleted_at IS NULL ${userRole === 'tynExecutive' ? '' : 'AND tenant_id = $1'}) as total_cohorts,
          (SELECT COUNT(*) FROM users WHERE role = 'student' AND deleted_at IS NULL ${userRole === 'tynExecutive' ? '' : 'AND tenant_id = $1'}) as total_students,
          (SELECT COUNT(*) FROM users WHERE role = 'facilitator' AND deleted_at IS NULL ${userRole === 'tynExecutive' ? '' : 'AND tenant_id = $1'}) as total_facilitators,
          (SELECT COUNT(*) FROM users WHERE role = 'industryMentor' AND deleted_at IS NULL ${userRole === 'tynExecutive' ? '' : 'AND tenant_id = $1'}) as total_mentors,
          (SELECT COUNT(*) FROM tracker_entries WHERE entry_date = CURRENT_DATE ${userRole === 'tynExecutive' ? '' : 'AND tenant_id = $1'}) as today_submissions`,
        userRole === 'tynExecutive' ? [] : [tenantId]
      );

      const trackerCompliance = await pool.query(
        `SELECT 
          ROUND((COUNT(DISTINCT te.student_id)::numeric / NULLIF(COUNT(DISTINCT u.id), 0)) * 100, 2) as compliance_percentage
         FROM users u
         LEFT JOIN tracker_entries te ON u.id = te.student_id AND te.entry_date = CURRENT_DATE
         WHERE u.role = 'student' AND u.deleted_at IS NULL ${userRole === 'tynExecutive' ? '' : 'AND u.tenant_id = $1'}`,
        userRole === 'tynExecutive' ? [] : [tenantId]
      );

      const recentActivity = await pool.query(
        `SELECT u.name, te.entry_date, te.hours_spent, c.name as cohort_name
         FROM tracker_entries te
         JOIN users u ON te.student_id = u.id
         JOIN cohorts c ON te.cohort_id = c.id
         ${userRole === 'tynExecutive' ? '' : 'WHERE te.tenant_id = $1'}
         ORDER BY te.submitted_at DESC
         LIMIT 10`,
        userRole === 'tynExecutive' ? [] : [tenantId]
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
         WHERE c.deleted_at IS NULL ${userRole === 'tynExecutive' ? '' : 'AND c.tenant_id = $1'}
         GROUP BY c.id, c.name
         ORDER BY avg_score DESC`,
        userRole === 'tynExecutive' ? [] : [tenantId]
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
