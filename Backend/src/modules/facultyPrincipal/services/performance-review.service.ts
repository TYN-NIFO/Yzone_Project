import { pool } from '../../../config/db';

export interface StudentPerformance {
  student_id: string;
  student_name: string;
  student_email: string;
  cohort_name: string;
  attendance_percentage: number;
  total_tracker_entries: number;
  avg_hours_per_day: number;
  mentor_rating: number;
  leaderboard_rank: number;
  total_score: number;
  recent_activity: any[];
}

export interface PerformanceReview {
  id: string;
  faculty_principal_id: string;
  student_id: string;
  project_id: string;
  remarks: string;
  status: string;
  created_at: Date;
}

export interface CreatePerformanceReviewRequest {
  student_id: string;
  project_id: string;
  remarks: string;
  status: 'excellent' | 'good' | 'average' | 'needs_improvement';
}

export class PerformanceReviewService {
  static async getStudentsPerformance(
    tenantId: string,
    cohortId?: string
  ): Promise<StudentPerformance[]> {
    let query = `
      SELECT 
        u.id as student_id,
        u.name as student_name,
        u.email as student_email,
        c.name as cohort_name,
        
        -- Attendance percentage
        COALESCE(
          ROUND(
            (COUNT(CASE WHEN a.is_present = true THEN 1 END) * 100.0 / 
             NULLIF(COUNT(a.id), 0)), 2
          ), 0
        ) as attendance_percentage,
        
        -- Tracker stats
        COALESCE(tracker_stats.total_entries, 0) as total_tracker_entries,
        COALESCE(tracker_stats.avg_hours, 0) as avg_hours_per_day,
        
        -- Mentor rating
        COALESCE(mentor_stats.avg_rating, 0) as mentor_rating,
        
        -- Leaderboard info
        COALESCE(l.rank, 999) as leaderboard_rank,
        COALESCE(l.total_score, 0) as total_score
        
      FROM users u
      JOIN cohorts c ON u.cohort_id = c.id
      LEFT JOIN attendance a ON u.id = a.student_id
      LEFT JOIN (
        SELECT 
          student_id,
          COUNT(*) as total_entries,
          AVG(hours_spent) as avg_hours
        FROM tracker_entries
        GROUP BY student_id
      ) tracker_stats ON u.id = tracker_stats.student_id
      LEFT JOIN (
        SELECT 
          student_id,
          AVG(rating) as avg_rating
        FROM mentor_reviews
        GROUP BY student_id
      ) mentor_stats ON u.id = mentor_stats.student_id
      LEFT JOIN leaderboard l ON u.id = l.student_id
      WHERE u.role = 'student' AND u.tenant_id = $1
    `;

    const values: any[] = [tenantId];
    let paramCount = 1;

    if (cohortId) {
      paramCount++;
      query += ` AND u.cohort_id = $${paramCount}`;
      values.push(cohortId);
    }

    query += `
      GROUP BY u.id, u.name, u.email, c.name, tracker_stats.total_entries, 
               tracker_stats.avg_hours, mentor_stats.avg_rating, l.rank, l.total_score
      ORDER BY l.rank ASC NULLS LAST, u.name ASC
    `;

    const result = await pool.query(query, values);
    
    // Get recent activity for each student
    const studentsWithActivity = await Promise.all(
      result.rows.map(async (student) => {
        const recentActivity = await this.getStudentRecentActivity(student.student_id, tenantId);
        return {
          ...student,
          recent_activity: recentActivity
        };
      })
    );

    return studentsWithActivity;
  }

  static async getStudentRecentActivity(
    studentId: string,
    tenantId: string
  ): Promise<any[]> {
    const query = `
      (
        SELECT 
          'tracker' as type,
          entry_date as date,
          tasks_completed as description,
          hours_spent as value,
          created_at
        FROM tracker_entries 
        WHERE student_id = $1 AND tenant_id = $2
        ORDER BY entry_date DESC
        LIMIT 3
      )
      UNION ALL
      (
        SELECT 
          'attendance' as type,
          s.session_date as date,
          s.title as description,
          CASE WHEN a.is_present THEN 1 ELSE 0 END as value,
          a.marked_at as created_at
        FROM attendance a
        JOIN sessions s ON a.session_id = s.id
        WHERE a.student_id = $1
        ORDER BY s.session_date DESC
        LIMIT 3
      )
      UNION ALL
      (
        SELECT 
          'mentor_review' as type,
          review_date as date,
          feedback as description,
          rating as value,
          created_at
        FROM mentor_reviews 
        WHERE student_id = $1 AND tenant_id = $2
        ORDER BY review_date DESC
        LIMIT 2
      )
      ORDER BY created_at DESC
      LIMIT 5
    `;

    const result = await pool.query(query, [studentId, tenantId]);
    return result.rows;
  }

  static async createPerformanceReview(
    facultyPrincipalId: string,
    reviewData: CreatePerformanceReviewRequest
  ): Promise<PerformanceReview> {
    const query = `
      INSERT INTO faculty_reviews (
        faculty_principal_id, student_id, project_id, remarks, status
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [
      facultyPrincipalId,
      reviewData.student_id,
      reviewData.project_id,
      reviewData.remarks,
      reviewData.status
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async getPerformanceReviews(
    tenantId: string,
    studentId?: string
  ): Promise<any[]> {
    let query = `
      SELECT 
        fr.*,
        s.name as student_name,
        s.email as student_email,
        p.title as project_title,
        f.name as faculty_name
      FROM faculty_reviews fr
      JOIN users s ON fr.student_id = s.id
      JOIN projects p ON fr.project_id = p.id
      JOIN users f ON fr.faculty_principal_id = f.id
      WHERE s.tenant_id = $1
    `;

    const values: any[] = [tenantId];
    let paramCount = 1;

    if (studentId) {
      paramCount++;
      query += ` AND fr.student_id = $${paramCount}`;
      values.push(studentId);
    }

    query += ` ORDER BY fr.created_at DESC`;

    const result = await pool.query(query, values);
    return result.rows;
  }

  static async getPerformanceStats(tenantId: string, cohortId?: string): Promise<any> {
    let query = `
      SELECT 
        COUNT(DISTINCT u.id) as total_students,
        AVG(
          COALESCE(
            (COUNT(CASE WHEN a.is_present = true THEN 1 END) * 100.0 / 
             NULLIF(COUNT(a.id), 0)), 0
          )
        ) as avg_attendance_percentage,
        AVG(COALESCE(tracker_stats.avg_hours, 0)) as avg_daily_hours,
        AVG(COALESCE(mentor_stats.avg_rating, 0)) as avg_mentor_rating,
        COUNT(fr.id) as total_reviews
      FROM users u
      JOIN cohorts c ON u.cohort_id = c.id
      LEFT JOIN attendance a ON u.id = a.student_id
      LEFT JOIN (
        SELECT student_id, AVG(hours_spent) as avg_hours
        FROM tracker_entries GROUP BY student_id
      ) tracker_stats ON u.id = tracker_stats.student_id
      LEFT JOIN (
        SELECT student_id, AVG(rating) as avg_rating
        FROM mentor_reviews GROUP BY student_id
      ) mentor_stats ON u.id = mentor_stats.student_id
      LEFT JOIN faculty_reviews fr ON u.id = fr.student_id
      WHERE u.role = 'student' AND u.tenant_id = $1
    `;

    const values: any[] = [tenantId];

    if (cohortId) {
      query += ` AND u.cohort_id = $2`;
      values.push(cohortId);
    }

    query += ` GROUP BY u.tenant_id`;

    const result = await pool.query(query, values);
    return result.rows[0] || {
      total_students: 0,
      avg_attendance_percentage: 0,
      avg_daily_hours: 0,
      avg_mentor_rating: 0,
      total_reviews: 0
    };
  }

  static async getStudentDetailedPerformance(
    studentId: string,
    tenantId: string
  ): Promise<any> {
    const query = `
      SELECT 
        u.id, u.name, u.email, u.phone,
        c.name as cohort_name,
        c.start_date as cohort_start_date,
        c.end_date as cohort_end_date,
        
        -- Attendance stats
        COUNT(a.id) as total_sessions_attended,
        COUNT(CASE WHEN a.is_present = true THEN 1 END) as sessions_present,
        COALESCE(
          ROUND(
            (COUNT(CASE WHEN a.is_present = true THEN 1 END) * 100.0 / 
             NULLIF(COUNT(a.id), 0)), 2
          ), 0
        ) as attendance_percentage,
        
        -- Tracker stats
        COALESCE(tracker_stats.total_entries, 0) as total_tracker_entries,
        COALESCE(tracker_stats.total_hours, 0) as total_hours_logged,
        COALESCE(tracker_stats.avg_hours, 0) as avg_hours_per_day,
        
        -- Mentor feedback
        COALESCE(mentor_stats.total_reviews, 0) as total_mentor_reviews,
        COALESCE(mentor_stats.avg_rating, 0) as avg_mentor_rating,
        
        -- Leaderboard position
        l.rank as leaderboard_rank,
        l.total_score as leaderboard_score
        
      FROM users u
      JOIN cohorts c ON u.cohort_id = c.id
      LEFT JOIN attendance a ON u.id = a.student_id
      LEFT JOIN (
        SELECT 
          student_id,
          COUNT(*) as total_entries,
          SUM(hours_spent) as total_hours,
          AVG(hours_spent) as avg_hours
        FROM tracker_entries
        WHERE student_id = $1
        GROUP BY student_id
      ) tracker_stats ON u.id = tracker_stats.student_id
      LEFT JOIN (
        SELECT 
          student_id,
          COUNT(*) as total_reviews,
          AVG(rating) as avg_rating
        FROM mentor_reviews
        WHERE student_id = $1
        GROUP BY student_id
      ) mentor_stats ON u.id = mentor_stats.student_id
      LEFT JOIN leaderboard l ON u.id = l.student_id
      WHERE u.id = $1 AND u.tenant_id = $2
      GROUP BY u.id, u.name, u.email, u.phone, c.name, c.start_date, c.end_date,
               tracker_stats.total_entries, tracker_stats.total_hours, tracker_stats.avg_hours,
               mentor_stats.total_reviews, mentor_stats.avg_rating, l.rank, l.total_score
    `;

    const result = await pool.query(query, [studentId, tenantId]);
    return result.rows[0] || null;
  }
}