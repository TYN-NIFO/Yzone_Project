// src/modules/facilitator/routes/facilitator.routes.ts
import { Router } from "express";
import { CohortController } from "../controllers/cohort.controller";
import { TeamsController } from "../controllers/teams.controller";
import { ProjectsController } from "../controllers/projects.controller";
import * as SessionController from "../controllers/session.controller";
import * as AttendanceController from "../controllers/attendance.controller";
import { FacilitatorDashboardController } from "../controllers/dashboard.controller";
<<<<<<< HEAD
=======
import { TrackerFeedbackController } from "../controllers/tracker-feedback.controller";
>>>>>>> e25b0f6 (hi)
import TenantController from "../../tynExecutive/controllers/tenant.controller";
import authMiddleware from "../../../middleware/auth.middleware";
import roleMiddleware from "../../../middleware/role.middleware";
import { pool } from "../../../config/db";
import { AuthRequest } from "../../../types/custom-request";

export const facilitatorRoutes = Router();
const dashboardController = new FacilitatorDashboardController();
<<<<<<< HEAD
=======
const trackerFeedbackController = new TrackerFeedbackController();
>>>>>>> e25b0f6 (hi)

facilitatorRoutes.use(authMiddleware);

// Dashboard
facilitatorRoutes.get("/dashboard", roleMiddleware(["facilitator"]), (req, res) => dashboardController.getDashboard(req, res));

// Additional routes for facilitator
facilitatorRoutes.get("/tenants", roleMiddleware(["facilitator"]), (req, res) => {
  // Get tenants accessible to facilitator
  req.url = "/tenants";
  TenantController.getAll(req, res);
});

facilitatorRoutes.get("/students/:cohortId", roleMiddleware(["facilitator"]), async (req: AuthRequest, res) => {
  try {
    const { cohortId } = req.params;
    const result = await pool.query(
      "SELECT id, name, email FROM users WHERE cohort_id = $1 AND role = 'student' AND deleted_at IS NULL",
      [cohortId]
    );
    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Attendance routes
facilitatorRoutes.get("/today-sessions", roleMiddleware(["facilitator"]), async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user!.tenantId;
    
    const result = await pool.query(
      `SELECT s.id, s.title, s.session_date, c.name as cohort_name
       FROM sessions s
       JOIN cohorts c ON s.cohort_id = c.id
       WHERE c.tenant_id = $1 AND s.session_date = CURRENT_DATE
       ORDER BY s.created_at`,
      [tenantId]
    );
    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

facilitatorRoutes.get("/session-students/:sessionId", roleMiddleware(["facilitator"]), async (req: AuthRequest, res) => {
  try {
    const { sessionId } = req.params;
    const tenantId = req.user!.tenantId;
    
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, 
              COALESCE(a.is_present, false) as is_present
       FROM sessions s
       JOIN cohorts c ON s.cohort_id = c.id
       JOIN users u ON u.cohort_id = c.id AND u.role = 'student'
       LEFT JOIN attendance a ON a.session_id = s.id AND a.student_id = u.id
       WHERE s.id = $1 AND c.tenant_id = $2 AND u.deleted_at IS NULL
       ORDER BY u.name`,
      [sessionId, tenantId]
    );
    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

facilitatorRoutes.post("/mark-attendance", roleMiddleware(["facilitator"]), async (req: AuthRequest, res) => {
  try {
    const { sessionId, attendance } = req.body;
    const facilitatorId = req.user!.id;
    const tenantId = req.user!.tenantId;
    
    // Verify session exists and belongs to tenant
    const sessionCheck = await pool.query(
      `SELECT s.cohort_id FROM sessions s 
       JOIN cohorts c ON s.cohort_id = c.id 
       WHERE s.id = $1 AND c.tenant_id = $2`,
      [sessionId, tenantId]
    );
    
    if (sessionCheck.rows.length === 0) {
      return res.status(403).json({ success: false, message: "Unauthorized to mark attendance for this session" });
    }
    
    // Mark attendance for each student
    for (const { studentId, isPresent } of attendance) {
      await pool.query(
        `INSERT INTO attendance (id, session_id, student_id, is_present, marked_by, marked_at)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
         ON CONFLICT (session_id, student_id) 
         DO UPDATE SET is_present = $4, marked_by = $5, marked_at = CURRENT_TIMESTAMP`,
        [require('crypto').randomUUID(), sessionId, studentId, isPresent, facilitatorId]
      );
    }
    
    res.json({ success: true, message: "Attendance marked successfully" });
  } catch (error: any) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Cohorts
facilitatorRoutes.post("/cohorts", CohortController.create);
facilitatorRoutes.get("/cohorts/:tenantId", CohortController.getByTenant);
facilitatorRoutes.get("/cohorts", CohortController.getAll); // ✅ Get all cohorts

// Teams
facilitatorRoutes.post("/teams", TeamsController.create);
facilitatorRoutes.get("/teams/:cohortId", TeamsController.getByCohort);

// Projects
facilitatorRoutes.post("/projects", ProjectsController.createProject);
facilitatorRoutes.get("/projects/cohort/:cohortId", ProjectsController.getProjectsByCohort);
facilitatorRoutes.get("/projects/team/:teamId", ProjectsController.getProjectsByTeam);

facilitatorRoutes.get(
  "/cohorts/:cohortId/today-session",
  SessionController.getTodaySession
);

facilitatorRoutes.post(
  "/sessions/:sessionId/attendance",
  AttendanceController.markAttendance
);

facilitatorRoutes.get(
  "/sessions/:sessionId/attendance",
  AttendanceController.getAttendance
);

// Tracker Feedback Routes
facilitatorRoutes.get("/tracker-entries", roleMiddleware(["facilitator"]), (req, res) => trackerFeedbackController.getTrackerEntries(req, res));
facilitatorRoutes.post("/tracker-feedback", roleMiddleware(["facilitator"]), (req, res) => trackerFeedbackController.createFeedback(req, res));
facilitatorRoutes.put("/tracker-feedback/:feedbackId", roleMiddleware(["facilitator"]), (req, res) => trackerFeedbackController.updateFeedback(req, res));
facilitatorRoutes.delete("/tracker-feedback/:feedbackId", roleMiddleware(["facilitator"]), (req, res) => trackerFeedbackController.deleteFeedback(req, res));
facilitatorRoutes.get("/tracker-feedback/stats", roleMiddleware(["facilitator"]), (req, res) => trackerFeedbackController.getFeedbackStats(req, res));

// Student Creation Route
facilitatorRoutes.post("/students", roleMiddleware(["facilitator"]), async (req: AuthRequest, res) => {
  try {
    const { tenantId } = req.user!;
    const { name, email, password, phone, whatsapp_number, cohort_id, role } = req.body;

    if (!name || !email || !password || !cohort_id) {
      return res.status(400).json({ error: 'Name, email, password, and cohort are required' });
    }

    // Hash password
    const bcrypt = require('bcryptjs');
    const password_hash = await bcrypt.hash(password, 10);

    // Create student
    const result = await pool.query(
      `INSERT INTO users (tenant_id, cohort_id, name, email, password_hash, role, phone, whatsapp_number, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
       RETURNING id, name, email, role, cohort_id, created_at`,
      [tenantId, cohort_id, name, email, password_hash, role || 'student', phone || null, whatsapp_number || null]
    );

    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      student: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error creating student:', error);
    if (error.code === '23505') {
      res.status(400).json({ error: 'Email already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create student' });
    }
  }
});

// Mentor Creation Route
facilitatorRoutes.post("/mentors", roleMiddleware(["facilitator"]), async (req: AuthRequest, res) => {
  try {
    const { tenantId } = req.user!;
    const { name, email, password, phone, whatsapp_number, cohort_id, company, designation, expertise } = req.body;

    if (!name || !email || !password || !cohort_id) {
      return res.status(400).json({ error: 'Name, email, password, and cohort are required' });
    }

    // Hash password
    const bcrypt = require('bcryptjs');
    const password_hash = await bcrypt.hash(password, 10);

    // Create mentor
    const result = await pool.query(
      `INSERT INTO users (tenant_id, cohort_id, name, email, password_hash, role, phone, whatsapp_number, is_active)
       VALUES ($1, $2, $3, $4, $5, 'industryMentor', $6, $7, true)
       RETURNING id, name, email, role, cohort_id, created_at`,
      [tenantId, cohort_id, name, email, password_hash, phone || null, whatsapp_number || null]
    );

    const mentorId = result.rows[0].id;

    // Store additional mentor details if provided
    if (company || designation || expertise) {
      await pool.query(
        `INSERT INTO mentor_profiles (mentor_id, company, designation, expertise)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (mentor_id) DO UPDATE 
         SET company = COALESCE($2, mentor_profiles.company),
             designation = COALESCE($3, mentor_profiles.designation),
             expertise = COALESCE($4, mentor_profiles.expertise)`,
        [mentorId, company || null, designation || null, expertise || null]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Mentor created successfully',
      mentor: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error creating mentor:', error);
    if (error.code === '23505') {
      res.status(400).json({ error: 'Email already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create mentor' });
    }
  }
});

// Get Mentors List
facilitatorRoutes.get("/mentors", roleMiddleware(["facilitator"]), async (req: AuthRequest, res) => {
  try {
    const { tenantId } = req.user!;
    
    const result = await pool.query(
      `SELECT id, name, email, phone, whatsapp_number, cohort_id, is_active, created_at
       FROM users 
       WHERE tenant_id = $1 AND role = 'industryMentor' AND deleted_at IS NULL
       ORDER BY created_at DESC`,
      [tenantId]
    );

    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    console.error('Error fetching mentors:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});
