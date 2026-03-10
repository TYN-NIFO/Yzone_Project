// src/modules/facultyPrincipal/routes/faculty.routes.ts
import { Router, Response } from "express";
import FacultyController from "../controllers/faculty.controller";
import { FacultyDashboardController } from "../controllers/dashboard.controller";
import authMiddleware from "../../../middleware/auth.middleware";
import roleMiddleware from "../../../middleware/role.middleware";
import { pool } from "../../../config/db";
import { AuthRequest } from "../../../types/custom-request";

const router = Router();
const dashboardController = new FacultyDashboardController();

router.use(authMiddleware);

// Dashboard
router.get("/dashboard", roleMiddleware(["facultyPrincipal"]), (req, res) => dashboardController.getDashboard(req, res));

// Feedback
router.post("/feedback", roleMiddleware(["facultyPrincipal"]), async (req: AuthRequest, res: Response) => {
  try {
    const { studentId, academicRating, behaviorRating, participationRating, feedback, academicComments, behaviorComments, recommendations } = req.body;
    const facultyId = req.user!.id;
    const tenantId = req.user!.tenantId;

    // Get student's cohort_id
    const studentResult = await pool.query(
      'SELECT cohort_id FROM users WHERE id = $1 AND deleted_at IS NULL',
      [studentId]
    );

    if (studentResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const cohortId = studentResult.rows[0].cohort_id;

    const result = await pool.query(
      `INSERT INTO faculty_feedback (faculty_id, student_id, tenant_id, cohort_id, academic_rating, behavior_rating, participation_rating, feedback, academic_comments, behavior_comments, recommendations, feedback_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_DATE)
       RETURNING *`,
      [facultyId, studentId, tenantId, cohortId, academicRating, behaviorRating, participationRating, feedback, academicComments, behaviorComments, recommendations]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('Faculty feedback error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Faculty Management
router.post("/", roleMiddleware(["tynExecutive"]), FacultyController.create);
router.get("/", roleMiddleware(["facultyPrincipal", "tynExecutive"]), FacultyController.getAll);
router.get("/:id", roleMiddleware(["facultyPrincipal", "tynExecutive"]), FacultyController.getOne);

export default router;
