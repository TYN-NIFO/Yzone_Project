import { Response } from "express";
import { pool } from "../../../config/db";
import { TrackerService } from "../../../services/tracker.service";
import { LeaderboardService } from "../../../services/leaderboard.service";
import { AuthRequest } from "../../../types/custom-request";

const trackerService = new TrackerService();
const leaderboardService = new LeaderboardService();

export class StudentDashboardController {
  async getDashboard(req: AuthRequest, res: Response): Promise<void> {
    try {
      const studentId = req.user!.id;
      const tenantId = req.user!.tenantId;
      const cohortId = req.user!.cohortId;

      if (!cohortId) {
        res.status(400).json({ success: false, message: "Student not assigned to any cohort" });
        return;
      }

      const trackerStats = await trackerService.getTrackerStats(studentId, cohortId);
      const leaderboardRank = await leaderboardService.getStudentRank(studentId, cohortId);

      const recentTrackers = await pool.query(
        `SELECT entry_date, tasks_completed, hours_spent, learning_summary
         FROM tracker_entries
         WHERE student_id = $1 AND cohort_id = $2
         ORDER BY entry_date DESC
         LIMIT 7`,
        [studentId, cohortId]
      );

      const notifications = await pool.query(
        `SELECT id, type, title, message, is_read, created_at
         FROM notifications
         WHERE user_id = $1 AND tenant_id = $2
         ORDER BY created_at DESC
         LIMIT 10`,
        [studentId, tenantId]
      );

      const mentorFeedback = await pool.query(
        `SELECT mr.rating, mr.feedback, mr.review_date, u.name as mentor_name
         FROM mentor_reviews mr
         JOIN users u ON mr.mentor_id = u.id
         WHERE mr.student_id = $1 AND mr.tenant_id = $2
         ORDER BY mr.review_date DESC
         LIMIT 5`,
        [studentId, tenantId]
      );

      const topLeaderboard = await leaderboardService.getLeaderboard(cohortId, tenantId, 10);

      res.status(200).json({
        success: true,
        data: {
          trackerStats,
          leaderboardRank: leaderboardRank || { rank: null, total_score: 0 },
          recentTrackers: recentTrackers.rows,
          notifications: notifications.rows,
          mentorFeedback: mentorFeedback.rows,
          topLeaderboard,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async submitTracker(req: AuthRequest, res: Response): Promise<void> {
    try {
      const trackerData = {
        ...req.body,
        studentId: req.user!.id,
        tenantId: req.user!.tenantId,
        cohortId: req.user!.cohortId,
      };

      const file = req.file;
      const tracker = await trackerService.createTrackerEntry(trackerData, file);

      res.status(201).json({ success: true, data: tracker });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getNotifications(req: AuthRequest, res: Response): Promise<void> {
    try {
      const notifications = await pool.query(
        `SELECT * FROM notifications WHERE user_id = $1 AND tenant_id = $2 ORDER BY created_at DESC`,
        [req.user!.id, req.user!.tenantId]
      );

      res.status(200).json({ success: true, data: notifications.rows });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async markNotificationRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      await pool.query(
        `UPDATE notifications SET is_read = true, read_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2`,
        [req.params.id, req.user!.id]
      );

      res.status(200).json({ success: true, message: "Notification marked as read" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async markAttendance(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { sessionId, location, timestamp } = req.body;
      const studentId = req.user!.id;
      const tenantId = req.user!.tenantId;
      const cohortId = req.user!.cohortId;

      const result = await pool.query(
        `INSERT INTO attendance (session_id, student_id, cohort_id, tenant_id, is_present, marked_at, location_lat, location_lng)
         VALUES ($1, $2, $3, $4, true, $5, $6, $7)
         ON CONFLICT (session_id, student_id) DO UPDATE SET
           is_present = true,
           marked_at = $5,
           location_lat = $6,
           location_lng = $7
         RETURNING *`,
        [sessionId, studentId, cohortId, tenantId, timestamp, location?.lat, location?.lng]
      );

      res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getTodaySessions(req: AuthRequest, res: Response): Promise<void> {
    try {
      const cohortId = req.user!.cohortId;
      const tenantId = req.user!.tenantId;

      const sessions = await pool.query(
        `SELECT id, title, session_type, start_time, end_time
         FROM sessions
         WHERE cohort_id = $1 AND tenant_id = $2 AND session_date = CURRENT_DATE
         ORDER BY start_time`,
        [cohortId, tenantId]
      );

      res.status(200).json({ success: true, data: sessions.rows });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
