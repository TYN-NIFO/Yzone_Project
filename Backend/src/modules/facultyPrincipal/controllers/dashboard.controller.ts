import { Response } from "express";
import { pool } from "../../../config/db";
import { AuthRequest } from "../../../types/custom-request";

export class FacultyDashboardController {
  async getDashboard(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;

      const stats = await pool.query(
        `SELECT 
          COUNT(DISTINCT u.id) FILTER (WHERE u.role = 'student') as total_students,
          COUNT(DISTINCT c.id) as total_cohorts,
          COUNT(DISTINCT te.id) FILTER (WHERE te.entry_date = CURRENT_DATE) as today_submissions,
          AVG(l.total_score) as avg_score
         FROM users u
         LEFT JOIN cohorts c ON u.cohort_id = c.id
         LEFT JOIN tracker_entries te ON u.id = te.student_id
         LEFT JOIN leaderboard l ON u.id = l.student_id
         WHERE u.tenant_id = $1 AND u.deleted_at IS NULL`,
        [tenantId]
      );

      const attendanceSummary = await pool.query(
        `SELECT c.name as cohort_name,
          COUNT(DISTINCT a.student_id) FILTER (WHERE a.is_present = true) as present_count,
          COUNT(DISTINCT a.student_id) as total_marked,
          ROUND((COUNT(DISTINCT a.student_id) FILTER (WHERE a.is_present = true)::numeric / NULLIF(COUNT(DISTINCT a.student_id), 0)) * 100, 2) as attendance_percentage
         FROM cohorts c
         LEFT JOIN sessions s ON c.id = s.cohort_id
         LEFT JOIN attendance a ON s.id = a.session_id
         WHERE c.tenant_id = $1 AND c.deleted_at IS NULL
         GROUP BY c.id, c.name
         ORDER BY c.name`,
        [tenantId]
      );

      const studentProgress = await pool.query(
        `SELECT u.id, u.name, u.email, c.name as cohort_name,
          (SELECT COUNT(*) FROM tracker_entries WHERE student_id = u.id) as total_trackers,
          (SELECT total_score FROM leaderboard WHERE student_id = u.id AND cohort_id = u.cohort_id LIMIT 1) as score,
          (SELECT rank FROM leaderboard WHERE student_id = u.id AND cohort_id = u.cohort_id LIMIT 1) as rank,
          (SELECT COUNT(*) FILTER (WHERE a.is_present = true) 
           FROM attendance a 
           JOIN sessions s ON a.session_id = s.id 
           WHERE a.student_id = u.id) as attendance_count
         FROM users u
         JOIN cohorts c ON u.cohort_id = c.id
         WHERE u.tenant_id = $1 AND u.role = 'student' AND u.deleted_at IS NULL
         ORDER BY score DESC NULLS LAST
         LIMIT 20`,
        [tenantId]
      );

      const cohortOverview = await pool.query(
        `SELECT c.name, c.start_date, c.end_date,
          COUNT(DISTINCT u.id) as student_count,
          AVG(l.total_score) as avg_score,
          u2.name as facilitator_name
         FROM cohorts c
         LEFT JOIN users u ON c.id = u.cohort_id AND u.role = 'student' AND u.deleted_at IS NULL
         LEFT JOIN leaderboard l ON u.id = l.student_id
         LEFT JOIN users u2 ON c.facilitator_id = u2.id
         WHERE c.tenant_id = $1 AND c.deleted_at IS NULL
         GROUP BY c.id, c.name, c.start_date, c.end_date, u2.name
         ORDER BY c.start_date DESC`,
        [tenantId]
      );

      res.status(200).json({
        success: true,
        data: {
          stats: stats.rows[0],
          attendanceSummary: attendanceSummary.rows,
          studentProgress: studentProgress.rows,
          cohortOverview: cohortOverview.rows,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
