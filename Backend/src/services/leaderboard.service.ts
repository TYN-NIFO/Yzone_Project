import { pool } from "../config/db";

export class LeaderboardService {
  async calculateLeaderboard(cohortId: string, tenantId: string) {
    const students = await pool.query(
      `SELECT id FROM users WHERE cohort_id = $1 AND role = 'student' AND deleted_at IS NULL`,
      [cohortId]
    );

    for (const student of students.rows) {
      const trackerScore = await this.calculateTrackerConsistency(student.id, cohortId);
      const performanceScore = await this.calculatePerformanceScore(student.id, cohortId);
      const attendanceScore = await this.calculateAttendanceScore(student.id, cohortId);
      const mentorRatingScore = await this.calculateMentorRating(student.id, cohortId);

      const totalScore = trackerScore + performanceScore + attendanceScore + mentorRatingScore;

      await pool.query(
        `INSERT INTO leaderboard (student_id, tenant_id, cohort_id, rank, total_score, tracker_consistency_score, performance_score, attendance_score, mentor_rating_score)
         VALUES ($1, $2, $3, 0, $4, $5, $6, $7, $8)
         ON CONFLICT (cohort_id, student_id) 
         DO UPDATE SET 
           total_score = $4,
           tracker_consistency_score = $5,
           performance_score = $6,
           attendance_score = $7,
           mentor_rating_score = $8,
           calculated_at = CURRENT_TIMESTAMP`,
        [student.id, tenantId, cohortId, totalScore, trackerScore, performanceScore, attendanceScore, mentorRatingScore]
      );
    }

    await this.updateRanks(cohortId);
  }

  private async calculateTrackerConsistency(studentId: string, cohortId: string): Promise<number> {
    const result = await pool.query(
      `SELECT COUNT(*) as count FROM tracker_entries 
       WHERE student_id = $1 AND cohort_id = $2 AND entry_date >= CURRENT_DATE - INTERVAL '30 days'`,
      [studentId, cohortId]
    );
    return Math.min((result.rows[0].count / 30) * 25, 25);
  }

  private async calculatePerformanceScore(studentId: string, cohortId: string): Promise<number> {
    const result = await pool.query(
      `SELECT AVG(hours_spent) as avg_hours FROM tracker_entries 
       WHERE student_id = $1 AND cohort_id = $2 AND entry_date >= CURRENT_DATE - INTERVAL '30 days'`,
      [studentId, cohortId]
    );
    const avgHours = result.rows[0].avg_hours || 0;
    return Math.min((avgHours / 8) * 25, 25);
  }

  private async calculateAttendanceScore(studentId: string, cohortId: string): Promise<number> {
    const result = await pool.query(
      `SELECT 
        COUNT(*) FILTER (WHERE is_present = true) as present,
        COUNT(*) as total
       FROM attendance 
       WHERE student_id = $1 AND cohort_id = $2`,
      [studentId, cohortId]
    );
    const { present, total } = result.rows[0];
    if (total === 0) return 0;
    return (present / total) * 25;
  }

  private async calculateMentorRating(studentId: string, cohortId: string): Promise<number> {
    const result = await pool.query(
      `SELECT AVG(rating) as avg_rating FROM mentor_reviews 
       WHERE student_id = $1 AND cohort_id = $2`,
      [studentId, cohortId]
    );
    const avgRating = result.rows[0].avg_rating || 0;
    return (avgRating / 5) * 25;
  }

  private async updateRanks(cohortId: string) {
    await pool.query(
      `WITH ranked AS (
        SELECT student_id, ROW_NUMBER() OVER (ORDER BY total_score DESC) as new_rank
        FROM leaderboard
        WHERE cohort_id = $1
      )
      UPDATE leaderboard l
      SET rank = r.new_rank
      FROM ranked r
      WHERE l.student_id = r.student_id AND l.cohort_id = $1`,
      [cohortId]
    );
  }

  async getLeaderboard(cohortId: string, tenantId: string, limit: number = 10) {
    const result = await pool.query(
      `SELECT l.*, u.name, u.email
       FROM leaderboard l
       JOIN users u ON l.student_id = u.id
       WHERE l.cohort_id = $1 AND l.tenant_id = $2
       ORDER BY l.rank ASC
       LIMIT $3`,
      [cohortId, tenantId, limit]
    );
    return result.rows;
  }

  async getStudentRank(studentId: string, cohortId: string) {
    const result = await pool.query(
      `SELECT * FROM leaderboard WHERE student_id = $1 AND cohort_id = $2`,
      [studentId, cohortId]
    );
    return result.rows[0];
  }
}
