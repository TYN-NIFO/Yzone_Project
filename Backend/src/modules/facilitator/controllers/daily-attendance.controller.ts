import { Response } from 'express';
import { pool } from '../../../config/db';
import { AuthRequest } from '../../../types/custom-request';

export class DailyAttendanceController {
  // Mark daily attendance for students (not session-based)
  static async markDailyAttendance(req: AuthRequest, res: Response) {
    try {
      const facilitatorId = req.user!.id;
      const tenantId = req.user!.tenantId;
      const { date, attendance } = req.body; // attendance: [{ studentId, isPresent }]

      if (!date || !attendance || !Array.isArray(attendance)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Date and attendance array are required' 
        });
      }

      // Verify facilitator has access to these students
      const facilitatorCohorts = await pool.query(
        `SELECT id FROM cohorts WHERE facilitator_id = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
        [facilitatorId, tenantId]
      );

      if (facilitatorCohorts.rows.length === 0) {
        return res.status(403).json({ 
          success: false, 
          message: 'No cohorts assigned to facilitator' 
        });
      }

      const cohortIds = facilitatorCohorts.rows.map(c => c.id);

      // Create or get today's session for each cohort
      const sessionMap = new Map();
      
      for (const cohortId of cohortIds) {
        // Check if session exists for this date
        let session = await pool.query(
          `SELECT id FROM sessions WHERE cohort_id = $1 AND session_date = $2`,
          [cohortId, date]
        );

        if (session.rows.length === 0) {
          // Create a new session for this date
          session = await pool.query(
            `INSERT INTO sessions (id, cohort_id, title, session_date)
             VALUES (gen_random_uuid(), $1, $2, $3)
             RETURNING id`,
            [cohortId, `Daily Attendance - ${date}`, date]
          );
        }

        sessionMap.set(cohortId, session.rows[0].id);
      }

      // Mark attendance for each student
      let markedCount = 0;
      const errors = [];

      for (const { studentId, isPresent } of attendance) {
        try {
          // Get student's cohort
          const studentCohort = await pool.query(
            `SELECT cohort_id FROM users WHERE id = $1 AND role = 'student' AND deleted_at IS NULL`,
            [studentId]
          );

          if (studentCohort.rows.length === 0) {
            errors.push({ studentId, error: 'Student not found' });
            continue;
          }

          const cohortId = studentCohort.rows[0].cohort_id;

          // Verify student belongs to facilitator's cohort
          if (!cohortIds.includes(cohortId)) {
            errors.push({ studentId, error: 'Student not in facilitator cohort' });
            continue;
          }

          const sessionId = sessionMap.get(cohortId);

          // Insert or update attendance
          await pool.query(
            `INSERT INTO attendance (id, session_id, student_id, is_present, marked_by)
             VALUES (gen_random_uuid(), $1, $2, $3, $4)
             ON CONFLICT (session_id, student_id) 
             DO UPDATE SET is_present = $3, marked_by = $4, marked_at = CURRENT_TIMESTAMP`,
            [sessionId, studentId, isPresent, facilitatorId]
          );

          markedCount++;
        } catch (error: any) {
          console.error(`Error marking attendance for student ${studentId}:`, error);
          errors.push({ studentId, error: error.message });
        }
      }

      res.json({ 
        success: true, 
        message: `Attendance marked for ${markedCount} students`,
        markedCount,
        errors: errors.length > 0 ? errors : undefined
      });

    } catch (error: any) {
      console.error('Error marking daily attendance:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get daily attendance for facilitator's cohorts
  static async getDailyAttendance(req: AuthRequest, res: Response) {
    try {
      const facilitatorId = req.user!.id;
      const tenantId = req.user!.tenantId;
      const { date } = req.query;

      if (!date) {
        return res.status(400).json({ 
          success: false, 
          message: 'Date parameter is required' 
        });
      }

      // Get facilitator's cohorts
      const facilitatorCohorts = await pool.query(
        `SELECT id, name FROM cohorts WHERE facilitator_id = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
        [facilitatorId, tenantId]
      );

      if (facilitatorCohorts.rows.length === 0) {
        return res.status(200).json({ 
          success: true, 
          data: { students: [], message: 'No cohorts assigned' }
        });
      }

      const cohortIds = facilitatorCohorts.rows.map(c => c.id);

      // Get all students in facilitator's cohorts with their attendance status
      const students = await pool.query(
        `SELECT 
          u.id,
          u.name,
          u.email,
          u.cohort_id,
          c.name as cohort_name,
          COALESCE(a.is_present, false) as is_present,
          a.marked_at
         FROM users u
         JOIN cohorts c ON u.cohort_id = c.id
         LEFT JOIN sessions s ON s.cohort_id = u.cohort_id AND s.session_date = $1
         LEFT JOIN attendance a ON a.session_id = s.id AND a.student_id = u.id
         WHERE u.cohort_id = ANY($2) 
           AND u.role = 'student' 
           AND u.deleted_at IS NULL
         ORDER BY c.name, u.name`,
        [date, cohortIds]
      );

      res.json({ 
        success: true, 
        data: {
          date,
          students: students.rows,
          cohorts: facilitatorCohorts.rows
        }
      });

    } catch (error: any) {
      console.error('Error getting daily attendance:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get attendance summary for a date range
  static async getAttendanceSummary(req: AuthRequest, res: Response) {
    try {
      const facilitatorId = req.user!.id;
      const tenantId = req.user!.tenantId;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({ 
          success: false, 
          message: 'Start date and end date are required' 
        });
      }

      // Get facilitator's cohorts
      const facilitatorCohorts = await pool.query(
        `SELECT id FROM cohorts WHERE facilitator_id = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
        [facilitatorId, tenantId]
      );

      if (facilitatorCohorts.rows.length === 0) {
        return res.status(200).json({ 
          success: true, 
          data: { summary: [], message: 'No cohorts assigned' }
        });
      }

      const cohortIds = facilitatorCohorts.rows.map(c => c.id);

      // Get attendance summary
      const summary = await pool.query(
        `SELECT 
          u.id as student_id,
          u.name as student_name,
          u.email,
          c.name as cohort_name,
          COUNT(DISTINCT s.id) as total_sessions,
          COUNT(DISTINCT CASE WHEN a.is_present = true THEN s.id END) as present_count,
          COUNT(DISTINCT CASE WHEN a.is_present = false THEN s.id END) as absent_count,
          ROUND(
            (COUNT(DISTINCT CASE WHEN a.is_present = true THEN s.id END)::numeric / 
             NULLIF(COUNT(DISTINCT s.id), 0) * 100), 2
          ) as attendance_percentage
         FROM users u
         JOIN cohorts c ON u.cohort_id = c.id
         LEFT JOIN sessions s ON s.cohort_id = u.cohort_id 
           AND s.session_date BETWEEN $1 AND $2
         LEFT JOIN attendance a ON a.session_id = s.id AND a.student_id = u.id
         WHERE u.cohort_id = ANY($3) 
           AND u.role = 'student' 
           AND u.deleted_at IS NULL
         GROUP BY u.id, u.name, u.email, c.name
         ORDER BY c.name, u.name`,
        [startDate, endDate, cohortIds]
      );

      res.json({ 
        success: true, 
        data: {
          startDate,
          endDate,
          summary: summary.rows
        }
      });

    } catch (error: any) {
      console.error('Error getting attendance summary:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}