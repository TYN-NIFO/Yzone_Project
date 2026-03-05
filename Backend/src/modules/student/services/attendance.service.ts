import { pool } from '../../../config/db';

export interface StudentAttendance {
  id: string;
  session_id: string;
  session_title: string;
  session_date: Date;
  is_present: boolean;
  marked_at: Date;
  marked_by_name: string;
}

export interface AttendanceStats {
  total_sessions: number;
  attended_sessions: number;
  attendance_percentage: number;
  recent_attendance: StudentAttendance[];
}

export class StudentAttendanceService {
  static async getStudentAttendance(
    studentId: string,
    tenantId: string,
    cohortId?: string
  ): Promise<StudentAttendance[]> {
    let query = `
      SELECT 
        a.id, a.session_id, a.is_present, a.marked_at,
        s.title as session_title, s.session_date,
        u.name as marked_by_name
      FROM attendance a
      JOIN sessions s ON a.session_id = s.id
      JOIN users u ON a.marked_by = u.id
      WHERE a.student_id = $1
    `;

    const values: any[] = [studentId];
    let paramCount = 1;

    if (cohortId) {
      paramCount++;
      query += ` AND s.cohort_id = $${paramCount}`;
      values.push(cohortId);
    }

    query += ` ORDER BY s.session_date DESC, a.marked_at DESC`;

    const result = await pool.query(query, values);
    return result.rows;
  }

  static async getAttendanceStats(
    studentId: string,
    tenantId: string,
    cohortId?: string
  ): Promise<AttendanceStats> {
    // Get total sessions for the student's cohort
    let sessionsQuery = `
      SELECT COUNT(*) as total_sessions
      FROM sessions s
      JOIN users u ON u.cohort_id = s.cohort_id
      WHERE u.id = $1
    `;

    const sessionsValues: any[] = [studentId];
    let paramCount = 1;

    if (cohortId) {
      paramCount++;
      sessionsQuery += ` AND s.cohort_id = $${paramCount}`;
      sessionsValues.push(cohortId);
    }

    const sessionsResult = await pool.query(sessionsQuery, sessionsValues);
    const totalSessions = parseInt(sessionsResult.rows[0].total_sessions);

    // Get attended sessions
    let attendedQuery = `
      SELECT COUNT(*) as attended_sessions
      FROM attendance a
      JOIN sessions s ON a.session_id = s.id
      WHERE a.student_id = $1 AND a.is_present = true
    `;

    const attendedValues: any[] = [studentId];
    paramCount = 1;

    if (cohortId) {
      paramCount++;
      attendedQuery += ` AND s.cohort_id = $${paramCount}`;
      attendedValues.push(cohortId);
    }

    const attendedResult = await pool.query(attendedQuery, attendedValues);
    const attendedSessions = parseInt(attendedResult.rows[0].attended_sessions);

    // Get recent attendance (last 10 sessions)
    const recentAttendance = await this.getStudentAttendance(studentId, tenantId, cohortId);
    const recent = recentAttendance.slice(0, 10);

    const attendancePercentage = totalSessions > 0 ? 
      Math.round((attendedSessions / totalSessions) * 100) : 0;

    return {
      total_sessions: totalSessions,
      attended_sessions: attendedSessions,
      attendance_percentage: attendancePercentage,
      recent_attendance: recent
    };
  }

  static async getUpcomingSessions(
    studentId: string,
    tenantId: string
  ): Promise<any[]> {
    const query = `
      SELECT 
        s.id, s.title, s.session_date,
        c.name as cohort_name,
        CASE 
          WHEN a.id IS NOT NULL THEN a.is_present
          ELSE NULL
        END as attendance_status
      FROM sessions s
      JOIN cohorts c ON s.cohort_id = c.id
      JOIN users u ON u.cohort_id = c.id
      LEFT JOIN attendance a ON s.id = a.session_id AND a.student_id = u.id
      WHERE u.id = $1 AND s.session_date >= CURRENT_DATE
      ORDER BY s.session_date ASC
      LIMIT 5
    `;

    const result = await pool.query(query, [studentId]);
    return result.rows;
  }

  static async getTodaySessions(
    studentId: string,
    tenantId: string
  ): Promise<any[]> {
    const query = `
      SELECT 
        s.id, s.title, s.session_date,
        c.name as cohort_name,
        CASE 
          WHEN a.id IS NOT NULL THEN a.is_present
          ELSE NULL
        END as attendance_status
      FROM sessions s
      JOIN cohorts c ON s.cohort_id = c.id
      JOIN users u ON u.cohort_id = c.id
      LEFT JOIN attendance a ON s.id = a.session_id AND a.student_id = u.id
      WHERE u.id = $1 AND s.session_date = CURRENT_DATE
      ORDER BY s.session_date ASC
    `;

    const result = await pool.query(query, [studentId]);
    return result.rows;
  }
}