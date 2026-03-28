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

      const facultyFeedback = await pool.query(
        `SELECT ff.academic_rating, ff.behavior_rating, ff.participation_rating, 
                ff.feedback, ff.academic_comments, ff.behavior_comments, 
                ff.recommendations, ff.feedback_date, u.name as faculty_name
         FROM faculty_feedback ff
         JOIN users u ON ff.faculty_id = u.id
         WHERE ff.student_id = $1 AND ff.tenant_id = $2
         ORDER BY ff.feedback_date DESC
         LIMIT 5`,
        [studentId, tenantId]
      );

      const topLeaderboard = await leaderboardService.getLeaderboard(cohortId, tenantId, 10);

      // Get student's projects (both individual and team projects)
      const projects = await pool.query(
        `SELECT DISTINCT p.id, 
                COALESCE(p.title, p.name) as title, 
                p.description, p.type, p.status, 
                p.start_date, p.end_date, p.created_at,
                t.name as team_name, t.id as team_id,
                s.id as submission_id, s.status as submission_status, 
                s.submitted_at, s.grade, s.feedback, s.reviewed_at
         FROM projects p
         LEFT JOIN teams t ON p.team_id = t.id
         LEFT JOIN team_members tm ON t.id = tm.team_id
         LEFT JOIN submissions s ON p.id = s.project_id AND s.student_id = $1
         WHERE p.cohort_id = $2 AND p.tenant_id = $3
         AND (p.team_id IS NULL OR tm.student_id = $1)
         ORDER BY p.created_at DESC`,
        [studentId, cohortId, tenantId]
      );

      res.status(200).json({
        success: true,
        data: {
          trackerStats,
          leaderboardRank: leaderboardRank || { rank: null, total_score: 0 },
          recentTrackers: recentTrackers.rows,
          notifications: notifications.rows,
          mentorFeedback: mentorFeedback.rows,
          facultyFeedback: facultyFeedback.rows,
          topLeaderboard,
          projects: projects.rows,
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
        entryDate: req.body.entry_date || new Date().toISOString().split('T')[0], // Default to today
      };

      const file = req.file;
      const tracker = await trackerService.createTrackerEntry(trackerData, file);

      res.status(201).json({ success: true, tracker });
    } catch (error: any) {
      console.error('Error submitting tracker:', error);
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

  async getTodayTracker(req: AuthRequest, res: Response): Promise<void> {
    try {
      const studentId = req.user!.id;
      const tenantId = req.user!.tenantId;

      const result = await pool.query(
        `SELECT te.*, 
                tf.id as feedback_id, tf.feedback, tf.rating, tf.suggestions, 
                tf.is_approved, tf.created_at as feedback_created_at,
                u.name as facilitator_name
         FROM tracker_entries te
         LEFT JOIN tracker_feedback tf ON te.id = tf.tracker_entry_id
         LEFT JOIN users u ON tf.facilitator_id = u.id
         WHERE te.student_id = $1 AND te.tenant_id = $2 
         AND te.entry_date = CURRENT_DATE
         ORDER BY te.created_at DESC
         LIMIT 1`,
        [studentId, tenantId]
      );

      if (result.rows.length === 0) {
        res.status(200).json({ success: true, tracker: null });
        return;
      }

      const row = result.rows[0];
      const tracker = {
        id: row.id,
        student_id: row.student_id,
        tenant_id: row.tenant_id,
        cohort_id: row.cohort_id,
        entry_date: row.entry_date,
        tasks_completed: row.tasks_completed,
        learning_summary: row.learning_summary,
        hours_spent: row.hours_spent,
        challenges: row.challenges,
        proof_file_url: row.proof_file_url,
        submitted_at: row.submitted_at,
        created_at: row.created_at,
        updated_at: row.updated_at,
        feedback: row.feedback_id ? {
          id: row.feedback_id,
          feedback: row.feedback,
          rating: row.rating,
          suggestions: row.suggestions,
          is_approved: row.is_approved,
          created_at: row.feedback_created_at,
          facilitator_name: row.facilitator_name
        } : null
      };

      res.status(200).json({ success: true, tracker });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateTodayTracker(req: AuthRequest, res: Response): Promise<void> {
    try {
      const studentId = req.user!.id;
      const tenantId = req.user!.tenantId;
      const { id } = req.params;
      const { tasks_completed, learning_summary, hours_spent, challenges } = req.body;

      // Check if tracker belongs to student and is from today
      const checkResult = await pool.query(
        `SELECT id FROM tracker_entries 
         WHERE id = $1 AND student_id = $2 AND tenant_id = $3 AND entry_date = CURRENT_DATE`,
        [id, studentId, tenantId]
      );

      if (checkResult.rows.length === 0) {
        res.status(403).json({ 
          success: false, 
          error: 'Cannot modify tracker: either not found, not yours, or not from today' 
        });
        return;
      }

      // Update tracker
      const result = await pool.query(
        `UPDATE tracker_entries 
         SET tasks_completed = COALESCE($1, tasks_completed),
             learning_summary = COALESCE($2, learning_summary),
             hours_spent = COALESCE($3, hours_spent),
             challenges = COALESCE($4, challenges),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $5 AND student_id = $6 AND tenant_id = $7
         RETURNING *`,
        [tasks_completed, learning_summary, hours_spent, challenges, id, studentId, tenantId]
      );

      res.status(200).json({ success: true, tracker: result.rows[0] });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getAttendanceStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const studentId = req.user!.id;
      const cohortId = req.user!.cohortId;

      if (!cohortId) {
        res.status(400).json({ 
          success: false, 
          message: 'Student not assigned to any cohort' 
        });
        return;
      }

      // Get total sessions
      const totalSessionsResult = await pool.query(
        `SELECT COUNT(*) as total_sessions
         FROM sessions s
         WHERE s.cohort_id = $1`,
        [cohortId]
      );

      // Get attended sessions
      const attendedResult = await pool.query(
        `SELECT COUNT(*) as attended_sessions
         FROM attendance a
         JOIN sessions s ON a.session_id = s.id
         WHERE a.student_id = $1 AND a.is_present = true AND s.cohort_id = $2`,
        [studentId, cohortId]
      );

      // Get recent attendance
      const recentResult = await pool.query(
        `SELECT a.id, a.is_present, a.marked_at,
                s.id as session_id, s.title as session_title, s.session_date,
                u.name as marked_by_name
         FROM attendance a
         JOIN sessions s ON a.session_id = s.id
         LEFT JOIN users u ON a.marked_by = u.id
         WHERE a.student_id = $1 AND s.cohort_id = $2
         ORDER BY s.session_date DESC, a.marked_at DESC
         LIMIT 10`,
        [studentId, cohortId]
      );

      const totalSessions = parseInt(totalSessionsResult.rows[0].total_sessions);
      const attendedSessions = parseInt(attendedResult.rows[0].attended_sessions);
      const attendancePercentage = totalSessions > 0 ? 
        Math.round((attendedSessions / totalSessions) * 100) : 0;

      res.status(200).json({
        success: true,
        data: {
          total_sessions: totalSessions,
          attended_sessions: attendedSessions,
          absent_sessions: totalSessions - attendedSessions,
          attendance_percentage: attendancePercentage,
          recent_attendance: recentResult.rows
        }
      });
    } catch (error: any) {
      console.error('Error getting attendance stats:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getUpcomingSessions(req: AuthRequest, res: Response): Promise<void> {
    try {
      const cohortId = req.user!.cohortId;
      const studentId = req.user!.id;

      if (!cohortId) {
        res.status(400).json({ 
          success: false, 
          message: 'Student not assigned to any cohort' 
        });
        return;
      }

      const result = await pool.query(
        `SELECT s.id, s.title, s.session_date,
                c.name as cohort_name,
                CASE WHEN a.id IS NOT NULL THEN a.is_present ELSE NULL END as attendance_status
         FROM sessions s
         JOIN cohorts c ON s.cohort_id = c.id
         LEFT JOIN attendance a ON s.id = a.session_id AND a.student_id = $1
         WHERE s.cohort_id = $2 AND s.session_date >= CURRENT_DATE
         ORDER BY s.session_date ASC
         LIMIT 5`,
        [studentId, cohortId]
      );

      res.status(200).json({ success: true, data: result.rows });
    } catch (error: any) {
      console.error('Error getting upcoming sessions:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getAttendanceHistory(req: AuthRequest, res: Response): Promise<void> {
    try {
      const studentId = req.user!.id;
      const cohortId = req.user!.cohortId;
      const { startDate, endDate, limit = 30 } = req.query;

      if (!cohortId) {
        res.status(400).json({ 
          success: false, 
          message: 'Student not assigned to any cohort' 
        });
        return;
      }

      let query = `
        SELECT s.id as session_id, s.title, s.session_date,
               a.id as attendance_id, a.is_present, a.marked_at,
               u.name as marked_by_name
        FROM sessions s
        LEFT JOIN attendance a ON s.id = a.session_id AND a.student_id = $1
        LEFT JOIN users u ON a.marked_by = u.id
        WHERE s.cohort_id = $2
      `;

      const params: any[] = [studentId, cohortId];
      let paramCount = 2;

      if (startDate) {
        paramCount++;
        query += ` AND s.session_date >= $${paramCount}`;
        params.push(startDate);
      }

      if (endDate) {
        paramCount++;
        query += ` AND s.session_date <= $${paramCount}`;
        params.push(endDate);
      }

      query += ` ORDER BY s.session_date DESC LIMIT $${paramCount + 1}`;
      params.push(limit);

      const result = await pool.query(query, params);

      res.status(200).json({ 
        success: true, 
        data: result.rows 
      });
    } catch (error: any) {
      console.error('Error getting attendance history:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async submitProject(req: AuthRequest, res: Response): Promise<void> {
    try {
      const studentId = req.user!.id;
      const tenantId = req.user!.tenantId;
      const { project_id, notes } = req.body;
      const fileUrl = req.file ? req.file.path : null;

      if (!project_id) {
        res.status(400).json({ success: false, message: 'project_id is required' });
        return;
      }

      // Check if submission already exists
      const existing = await pool.query(
        `SELECT id FROM submissions WHERE student_id = $1 AND project_id = $2`,
        [studentId, project_id]
      );

      let result;
      if (existing.rows.length > 0) {
        result = await pool.query(
          `UPDATE submissions SET
             file_url = COALESCE($1, file_url),
             status = 'SUBMITTED',
             notes = COALESCE($2, notes),
             submitted_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
           WHERE student_id = $3 AND project_id = $4
           RETURNING *`,
          [fileUrl, notes || null, studentId, project_id]
        );
      } else {
        result = await pool.query(
          `INSERT INTO submissions (student_id, project_id, tenant_id, file_url, status, notes, submitted_at)
           VALUES ($1, $2, $3, $4, 'SUBMITTED', $5, CURRENT_TIMESTAMP)
           RETURNING *`,
          [studentId, project_id, tenantId, fileUrl, notes || null]
        );
      }

      res.status(201).json({ success: true, submission: result.rows[0] });
    } catch (error: any) {
      console.error('Error submitting project:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getTrackerHistory(req: AuthRequest, res: Response): Promise<void> {
    try {
      const studentId = req.user!.id;
      const tenantId = req.user!.tenantId;
      const { limit = 30 } = req.query;

      const result = await pool.query(
        `SELECT te.*, 
                tf.id as feedback_id, tf.feedback, tf.rating, tf.suggestions, 
                tf.is_approved, tf.created_at as feedback_created_at,
                u.name as facilitator_name
         FROM tracker_entries te
         LEFT JOIN tracker_feedback tf ON te.id = tf.tracker_entry_id
         LEFT JOIN users u ON tf.facilitator_id = u.id
         WHERE te.student_id = $1 AND te.tenant_id = $2
         ORDER BY te.entry_date DESC
         LIMIT $3`,
        [studentId, tenantId, limit]
      );

      const trackers = result.rows.map(row => ({
        id: row.id,
        student_id: row.student_id,
        tenant_id: row.tenant_id,
        cohort_id: row.cohort_id,
        entry_date: row.entry_date,
        tasks_completed: row.tasks_completed,
        learning_summary: row.learning_summary,
        hours_spent: row.hours_spent,
        challenges: row.challenges,
        proof_file_url: row.proof_file_url,
        submitted_at: row.submitted_at,
        created_at: row.created_at,
        updated_at: row.updated_at,
        feedback: row.feedback_id ? {
          id: row.feedback_id,
          feedback: row.feedback,
          rating: row.rating,
          suggestions: row.suggestions,
          is_approved: row.is_approved,
          created_at: row.feedback_created_at,
          facilitator_name: row.facilitator_name
        } : null
      }));

      res.status(200).json({ 
        success: true, 
        data: trackers 
      });
    } catch (error: any) {
      console.error('Error getting tracker history:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
