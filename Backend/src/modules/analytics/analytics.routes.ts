import { Router } from "express";
import authMiddleware from "../../middleware/auth.middleware";
import roleMiddleware from "../../middleware/role.middleware";
import { pool } from "../../config/db";

const router = Router();
router.use(authMiddleware);

// Tracker compliance % per tenant (executive / facilitator)
router.get(
    "/tracker-compliance",
    roleMiddleware(["tynExecutive", "facilitator", "facultyPrincipal"]),
    async (req, res) => {
        try {
            const { tenantId } = req.user!;
            const cohortId = req.query.cohortId as string | undefined;

            const whereClause = cohortId
                ? "te.tenant_id = $1 AND te.cohort_id = $2"
                : "te.tenant_id = $1";
            const params: any[] = cohortId ? [tenantId, cohortId] : [tenantId];

            const r = await pool.query(
                `SELECT 
          u.name, u.email, u.id as student_id,
          COUNT(te.id) as total_submissions,
          COUNT(te.id) FILTER (WHERE te.entry_date >= NOW() - INTERVAL '30 days') as last_30_days,
          ROUND(COUNT(te.id) FILTER (WHERE te.entry_date >= NOW() - INTERVAL '30 days')::numeric / 30 * 100, 1) as compliance_pct
         FROM users u
         LEFT JOIN tracker_entries te ON te.student_id = u.id AND ${whereClause}
         WHERE u.role = 'student' AND u.tenant_id = $1 AND u.deleted_at IS NULL
         GROUP BY u.id, u.name, u.email
         ORDER BY compliance_pct DESC`,
                params
            );
            res.json({ success: true, data: r.rows });
        } catch (err) {
            res.status(500).json({ success: false, message: "Failed to fetch compliance data" });
        }
    }
);

// Cohort performance overview
router.get(
    "/cohort-performance/:cohortId",
    roleMiddleware(["tynExecutive", "facilitator", "facultyPrincipal", "industryMentor"]),
    async (req, res) => {
        try {
            const { tenantId } = req.user!;
            const r = await pool.query(
                `SELECT
          COUNT(DISTINCT u.id) as total_students,
          COUNT(te.id) as total_tracker_submissions,
          ROUND(AVG(te.hours_spent), 2) as avg_hours_per_entry,
          ROUND(AVG(te.mentor_rating), 2) as avg_mentor_rating,
          COUNT(te.id) FILTER (WHERE te.entry_date = CURRENT_DATE) as today_submissions
         FROM users u
         LEFT JOIN tracker_entries te ON te.student_id = u.id AND te.cohort_id = $1
         WHERE u.cohort_id = $1 AND u.tenant_id = $2 AND u.role = 'student' AND u.deleted_at IS NULL`,
                [req.params.cohortId, tenantId]
            );
            res.json({ success: true, data: r.rows[0] });
        } catch (err) {
            res.status(500).json({ success: false, message: "Failed to fetch performance data" });
        }
    }
);

// Student growth graph (last 30 days)
router.get("/student-growth/:studentId", async (req, res) => {
    try {
        const r = await pool.query(
            `SELECT entry_date, hours_spent, mentor_rating,
              LENGTH(tasks_completed) as tasks_length
       FROM tracker_entries
       WHERE student_id = $1
       ORDER BY entry_date DESC LIMIT 30`,
            [req.params.studentId]
        );
        res.json({ success: true, data: r.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to fetch growth data" });
    }
});

// Mentor engagement
router.get(
    "/mentor-engagement",
    roleMiddleware(["tynExecutive", "facultyPrincipal"]),
    async (req, res) => {
        try {
            const { tenantId } = req.user!;
            const r = await pool.query(
                `SELECT u.name, u.email,
                COUNT(ma.student_id) as assigned_students,
                COUNT(te.id) FILTER (WHERE te.mentor_rating IS NOT NULL) as entries_rated,
                ROUND(AVG(te.mentor_rating), 2) as avg_rating_given
         FROM users u
         LEFT JOIN mentor_assignments ma ON ma.mentor_id = u.id
         LEFT JOIN tracker_entries te ON te.student_id = ma.student_id
         WHERE u.role = 'industryMentor' AND u.tenant_id = $1 AND u.deleted_at IS NULL
         GROUP BY u.id, u.name, u.email`,
                [tenantId]
            );
            res.json({ success: true, data: r.rows });
        } catch (err) {
            res.status(500).json({ success: false, message: "Failed to fetch mentor engagement" });
        }
    }
);

export default router;
