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

    const result = await pool.query(
      `INSERT INTO faculty_feedback (faculty_id, student_id, tenant_id, academic_rating, behavior_rating, participation_rating, feedback, academic_comments, behavior_comments, recommendations, feedback_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_DATE)
       RETURNING *`,
      [facultyId, studentId, tenantId, academicRating, behaviorRating, participationRating, feedback, academicComments, behaviorComments, recommendations]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Faculty Management
router.post("/", roleMiddleware(["tynExecutive"]), FacultyController.create);
router.get("/", roleMiddleware(["facultyPrincipal", "tynExecutive"]), FacultyController.getAll);
router.get("/:id", roleMiddleware(["facultyPrincipal", "tynExecutive"]), FacultyController.getOne);

export default router;
