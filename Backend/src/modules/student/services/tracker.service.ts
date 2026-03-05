import { pool } from "../../../config/db";

export const submitTracker = async (data: {
    studentId: string; cohortId: string; tenantId: string;
    tasksCompleted: string; learningSummary: string; hoursSpent: number;
    challenges: string; proofUrl?: string; entryDate?: string;
}) => {
    const r = await pool.query(
        `INSERT INTO tracker_entries
       (student_id, cohort_id, tenant_id, tasks_completed, learning_summary, hours_spent, challenges, proof_url, entry_date)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     ON CONFLICT(student_id, entry_date)
     DO UPDATE SET
       tasks_completed = EXCLUDED.tasks_completed,
       learning_summary = EXCLUDED.learning_summary,
       hours_spent = EXCLUDED.hours_spent,
       challenges = EXCLUDED.challenges,
       proof_url = COALESCE(EXCLUDED.proof_url, tracker_entries.proof_url),
       submitted_at = NOW()
     RETURNING *`,
        [
            data.studentId, data.cohortId, data.tenantId,
            data.tasksCompleted, data.learningSummary, data.hoursSpent,
            data.challenges, data.proofUrl || null,
            data.entryDate || new Date().toISOString().split("T")[0],
        ]
    );
    return r.rows[0];
};

export const getMyTrackers = async (studentId: string, limit = 30) => {
    const r = await pool.query(
        `SELECT * FROM tracker_entries WHERE student_id = $1
     ORDER BY entry_date DESC LIMIT $2`,
        [studentId, limit]
    );
    return r.rows;
};

export const getTrackersByCohort = async (cohortId: string, tenantId: string) => {
    const r = await pool.query(
        `SELECT te.*, u.name as student_name, u.email as student_email
     FROM tracker_entries te
     JOIN users u ON u.id = te.student_id
     WHERE te.cohort_id = $1 AND te.tenant_id = $2
     ORDER BY te.entry_date DESC, u.name ASC`,
        [cohortId, tenantId]
    );
    return r.rows;
};

export const submitMentorRating = async (
    entryId: string, rating: number, comment: string, mentorId: string
) => {
    const r = await pool.query(
        `UPDATE tracker_entries SET mentor_rating = $1, mentor_comment = $2
     WHERE id = $3 RETURNING *`,
        [rating, comment, entryId]
    );
    return r.rows[0];
};

export const getStudentsWhoMissedToday = async (): Promise<any[]> => {
    const today = new Date().toISOString().split("T")[0];
    const r = await pool.query(
        `SELECT u.id, u.name, u.phone, u.tenant_id, u.cohort_id,
            COALESCE(missed.streak, 0) as missed_days
     FROM users u
     LEFT JOIN tracker_entries te ON te.student_id = u.id AND te.entry_date = $1
     LEFT JOIN (
       SELECT student_id,
              COUNT(*) as streak
       FROM generate_series(1, 7) AS d(day)
       LEFT JOIN tracker_entries te2 ON te2.entry_date = CURRENT_DATE - (d.day * INTERVAL '1 day')::int
       GROUP BY student_id
     ) missed ON missed.student_id = u.id
     WHERE u.role = 'student' AND u.is_active = TRUE AND u.deleted_at IS NULL
       AND u.phone IS NOT NULL
       AND te.id IS NULL`,
        [today]
    );
    return r.rows;
};

export const getConsecutiveMissedDays = async (studentId: string): Promise<number> => {
    const r = await pool.query(
        `SELECT COUNT(*) as missed
     FROM generate_series(0, 6) AS d(day)
     LEFT JOIN tracker_entries te ON te.student_id = $1
       AND te.entry_date = CURRENT_DATE - (d.day * INTERVAL '1 day')::int
     WHERE te.id IS NULL`,
        [studentId]
    );
    return parseInt(r.rows[0]?.missed || "0");
};
