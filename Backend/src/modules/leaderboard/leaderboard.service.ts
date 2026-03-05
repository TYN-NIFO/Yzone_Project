import { pool } from "../../config/db";

export const recalculateLeaderboard = async (): Promise<void> => {
    try {
        const cohorts = await pool.query("SELECT id, tenant_id FROM cohorts WHERE deleted_at IS NULL");

        for (const cohort of cohorts.rows) {
            const students = await pool.query(
                "SELECT id FROM users WHERE cohort_id = $1 AND role = 'student' AND deleted_at IS NULL",
                [cohort.id]
            );

            for (const student of students.rows) {
                const [trackerStats, attendanceStats, mentorStats] = await Promise.all([
                    pool.query(
                        `SELECT COUNT(*) as total_submissions,
                    COUNT(*) FILTER (WHERE entry_date >= NOW() - INTERVAL '30 days') as recent_submissions
             FROM tracker_entries WHERE student_id = $1 AND cohort_id = $2`,
                        [student.id, cohort.id]
                    ),
                    pool.query(
                        `SELECT 
              COUNT(*) FILTER (WHERE status = 'PRESENT') as present_count,
              COUNT(*) as total_count
             FROM attendance WHERE student_id = $1`,
                        [student.id]
                    ),
                    pool.query(
                        `SELECT AVG(mentor_rating) as avg_rating
             FROM tracker_entries WHERE student_id = $1 AND mentor_rating IS NOT NULL`,
                        [student.id]
                    ),
                ]);

                const recentSubmissions = parseInt(trackerStats.rows[0].recent_submissions);
                const trackerScore = Math.min((recentSubmissions / 30) * 100, 100) * 0.4;

                const totalAttendance = parseInt(attendanceStats.rows[0].total_count);
                const presentCount = parseInt(attendanceStats.rows[0].present_count);
                const attendanceScore =
                    (totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 0) * 0.2;

                const avgRating = parseFloat(mentorStats.rows[0].avg_rating || "0");
                const mentorScore = (avgRating / 10) * 100 * 0.3;

                const performanceScore = 10 * 0.1; // baseline 10%

                const totalScore = trackerScore + attendanceScore + mentorScore + performanceScore;

                await pool.query(
                    `INSERT INTO leaderboard
             (student_id, cohort_id, tenant_id, tracker_score, attendance_score, mentor_rating_avg, performance_score, total_score, calculated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8, NOW())
           ON CONFLICT (student_id, cohort_id) DO UPDATE SET
             tracker_score = EXCLUDED.tracker_score,
             attendance_score = EXCLUDED.attendance_score,
             mentor_rating_avg = EXCLUDED.mentor_rating_avg,
             performance_score = EXCLUDED.performance_score,
             total_score = EXCLUDED.total_score,
             calculated_at = NOW()`,
                    [
                        student.id, cohort.id, cohort.tenant_id,
                        trackerScore.toFixed(2), attendanceScore.toFixed(2),
                        avgRating.toFixed(2), performanceScore.toFixed(2),
                        totalScore.toFixed(2),
                    ]
                );
            }

            // Update ranks within cohort
            await pool.query(
                `WITH ranked AS (
           SELECT id, ROW_NUMBER() OVER (ORDER BY total_score DESC) as rn
           FROM leaderboard WHERE cohort_id = $1
         )
         UPDATE leaderboard SET rank = ranked.rn
         FROM ranked WHERE leaderboard.id = ranked.id`,
                [cohort.id]
            );
        }

        console.log("✅ Leaderboard recalculated");
    } catch (err) {
        console.error("❌ Leaderboard recalculation error:", err);
    }
};

export const getLeaderboard = async (cohortId: string, tenantId: string, limit = 10) => {
    const r = await pool.query(
        `SELECT l.*, u.name, u.email
     FROM leaderboard l
     JOIN users u ON u.id = l.student_id
     WHERE l.cohort_id = $1 AND l.tenant_id = $2
     ORDER BY l.rank ASC
     LIMIT $3`,
        [cohortId, tenantId, limit]
    );
    return r.rows;
};

export const getStudentRank = async (studentId: string, cohortId: string) => {
    const r = await pool.query(
        `SELECT l.*, u.name FROM leaderboard l
     JOIN users u ON u.id = l.student_id
     WHERE l.student_id = $1 AND l.cohort_id = $2`,
        [studentId, cohortId]
    );
    return r.rows[0] || null;
};
