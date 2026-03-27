import { Response } from "express";
import { pool } from "../../../config/db";
import { AuthRequest } from "../../../types/custom-request";

export class FacilitatorDashboardController {
  async getDashboard(req: AuthRequest, res: Response): Promise<void> {
    try {
      const facilitatorId = req.user!.id;
      const tenantId = req.user!.tenantId;

      // Find cohorts where this facilitator is assigned
      // Check BOTH cohorts.facilitator_id AND users.cohort_id for robustness
      const cohorts = await pool.query(
        `SELECT DISTINCT c.id, c.name 
         FROM cohorts c
         WHERE c.deleted_at IS NULL
           AND c.tenant_id = $2
           AND (
             c.facilitator_id = $1
             OR c.id = (SELECT cohort_id FROM users WHERE id = $1 AND deleted_at IS NULL)
           )`,
        [facilitatorId, tenantId]
      );

      if (cohorts.rows.length === 0) {
        res.status(200).json({
          success: true,
          data: { message: "No cohorts assigned", stats: {}, students: [], trackerStatus: [] },
        });
        return;
      }

      const cohortIds = cohorts.rows.map((c) => c.id);

      const stats = await pool.query(
        `SELECT 
          COUNT(DISTINCT u.id) as total_students,
          COUNT(DISTINCT te.id) FILTER (WHERE te.entry_date = CURRENT_DATE) as today_submissions,
          AVG(l.total_score) as avg_score,
          COUNT(DISTINCT s.id) as total_sessions
         FROM users u
         LEFT JOIN tracker_entries te ON u.id = te.student_id
         LEFT JOIN leaderboard l ON u.id = l.student_id
         LEFT JOIN sessions s ON u.cohort_id = s.cohort_id
         WHERE u.cohort_id = ANY($1) AND u.role = 'student' AND u.deleted_at IS NULL`,
        [cohortIds]
      );

      const students = await pool.query(
        `SELECT u.id, u.name, u.email, c.name as cohort_name,
          (SELECT COUNT(*) FROM tracker_entries WHERE student_id = u.id AND entry_date >= CURRENT_DATE - INTERVAL '7 days') as recent_trackers,
          (SELECT total_score FROM leaderboard WHERE student_id = u.id LIMIT 1) as score,
          (SELECT rank FROM leaderboard WHERE student_id = u.id LIMIT 1) as rank
         FROM users u
         JOIN cohorts c ON u.cohort_id = c.id
         WHERE u.cohort_id = ANY($1) AND u.role = 'student' AND u.deleted_at IS NULL
         ORDER BY u.name`,
        [cohortIds]
      );

      const trackerStatus = await pool.query(
        `SELECT u.name, u.email,
          CASE 
            WHEN EXISTS (SELECT 1 FROM tracker_entries WHERE student_id = u.id AND entry_date = CURRENT_DATE) 
            THEN 'submitted' 
            ELSE 'pending' 
          END as status,
          (SELECT submitted_at FROM tracker_entries WHERE student_id = u.id AND entry_date = CURRENT_DATE LIMIT 1) as submitted_at
         FROM users u
         WHERE u.cohort_id = ANY($1) AND u.role = 'student' AND u.deleted_at IS NULL
         ORDER BY status, u.name`,
        [cohortIds]
      );

      res.status(200).json({
        success: true,
        data: {
          cohorts: cohorts.rows,
          stats: stats.rows[0],
          students: students.rows,
          trackerStatus: trackerStatus.rows,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
