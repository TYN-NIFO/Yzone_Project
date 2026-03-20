// src/modules/facilitator/routes/facilitator.routes.ts
import { Router } from "express";
import { CohortController } from "../controllers/cohort.controller";
import { TeamsController } from "../controllers/teams.controller";
import { ProjectsController } from "../controllers/projects.controller";
import * as SessionController from "../controllers/session.controller";
import * as AttendanceController from "../controllers/attendance.controller";
import { FacilitatorDashboardController } from "../controllers/dashboard.controller";
import { TrackerFeedbackController } from "../controllers/tracker-feedback.controller";
import { DailyAttendanceController } from "../controllers/daily-attendance.controller";
import TenantController from "../../tynExecutive/controllers/tenant.controller";
import authMiddleware from "../../../middleware/auth.middleware";
import roleMiddleware from "../../../middleware/role.middleware";
import { pool } from "../../../config/db";
import { AuthRequest } from "../../../types/custom-request";

export const facilitatorRoutes = Router();
const dashboardController = new FacilitatorDashboardController();
const trackerFeedbackController = new TrackerFeedbackController();

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
      "SELECT id, name, email, phone, whatsapp_number FROM users WHERE cohort_id = $1 AND role = 'student' AND deleted_at IS NULL",
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

// Session Management Routes
facilitatorRoutes.post("/sessions", roleMiddleware(["facilitator"]), SessionController.createSession);
facilitatorRoutes.get("/sessions/:cohortId", roleMiddleware(["facilitator"]), SessionController.getSessionsByCohort);
facilitatorRoutes.delete("/sessions/:sessionId", roleMiddleware(["facilitator"]), SessionController.deleteSession);

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
facilitatorRoutes.post("/projects", ProjectsController.createProject as any);
facilitatorRoutes.get("/projects/cohort/:cohortId", ProjectsController.getProjectsByCohort as any);
facilitatorRoutes.get("/projects/team/:teamId", ProjectsController.getProjectsByTeam as any);

// Submission Management Routes
facilitatorRoutes.get("/projects/:projectId/submissions", roleMiddleware(["facilitator"]), async (req: AuthRequest, res) => {
  try {
    const { projectId } = req.params;
    const tenantId = req.user!.tenantId;

    console.log(`📋 Fetching submissions for project ${projectId}`);

    const result = await pool.query(
      `SELECT s.*, u.name as student_name, u.email as student_email,
              t.name as team_name, p.name as project_title, p.title as project_name
       FROM submissions s
       JOIN users u ON s.student_id = u.id
       JOIN projects p ON s.project_id = p.id
       LEFT JOIN teams t ON p.team_id = t.id
       WHERE s.project_id = $1 AND s.tenant_id = $2
       ORDER BY s.submitted_at DESC`,
      [projectId, tenantId],
    );

    console.log(`✅ Found ${result.rows.length} submissions`);
    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    console.error('❌ Error fetching submissions:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

facilitatorRoutes.put("/submissions/:submissionId/status", roleMiddleware(["facilitator"]), async (req: AuthRequest, res) => {
  try {
    const { submissionId } = req.params;
    const { status, feedback, grade } = req.body;
    const facilitatorId = req.user!.id;
    const tenantId = req.user!.tenantId;

    console.log(`📝 Updating submission ${submissionId} to status: ${status}`);

    // Validate status
    const validStatuses = [
      "SUBMITTED",
      "UNDER_REVIEW",
      "APPROVED",
      "REJECTED",
      "NEEDS_REVISION",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be one of: " + validStatuses.join(", "),
      });
    }

    // Update submission
    const result = await pool.query(
      `UPDATE submissions 
       SET status = $1, 
           reviewed_by = $2, 
           reviewed_at = CURRENT_TIMESTAMP,
           feedback = $3,
           grade = $4
       WHERE id = $5 AND tenant_id = $6
       RETURNING *`,
      [status, facilitatorId, feedback, grade, submissionId, tenantId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Submission not found",
      });
    }

    // Create notification for student
    await pool.query(
      `INSERT INTO notifications (id, user_id, tenant_id, type, title, message)
       SELECT gen_random_uuid(), student_id, $1, 'system_alert', 
              'Project Submission Reviewed', 
              $2
       FROM submissions WHERE id = $3`,
      [
        tenantId,
        `Your submission has been ${status.toLowerCase().replace('_', ' ')}${feedback ? ': ' + feedback : ''}`,
        submissionId,
      ],
    );

    console.log(`✅ Submission updated successfully`);
    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('❌ Error updating submission:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

facilitatorRoutes.put("/projects/:projectId/status", roleMiddleware(["facilitator"]), async (req: AuthRequest, res) => {
  try {
    const { projectId } = req.params;
    const { status } = req.body;
    const tenantId = req.user!.tenantId;

    console.log(`📊 Updating project ${projectId} to status: ${status}`);

    const validStatuses = [
      "PENDING",
      "IN_PROGRESS",
      "SUBMITTED",
      "COMPLETED",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be one of: " + validStatuses.join(", "),
      });
    }

    const result = await pool.query(
      `UPDATE projects SET status = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 AND tenant_id = $3 RETURNING *`,
      [status, projectId, tenantId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    console.log(`✅ Project status updated successfully`);
    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('❌ Error updating project status:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

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

// Daily Attendance Routes (not session-based)
facilitatorRoutes.post(
  "/attendance/daily",
  roleMiddleware(["facilitator"]),
  DailyAttendanceController.markDailyAttendance
);

facilitatorRoutes.get(
  "/attendance/daily",
  roleMiddleware(["facilitator"]),
  DailyAttendanceController.getDailyAttendance
);

facilitatorRoutes.get(
  "/attendance/summary",
  roleMiddleware(["facilitator"]),
  DailyAttendanceController.getAttendanceSummary
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
    const { name, email, password, phone, whatsapp_number, cohort_id, auto_assign_students } = req.body;

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

    // Auto-assign to all students in cohort if requested
    if (auto_assign_students) {
      const studentsResult = await pool.query(
        `SELECT id FROM users WHERE cohort_id = $1 AND role = 'student' AND deleted_at IS NULL`,
        [cohort_id]
      );

      for (const student of studentsResult.rows) {
        await pool.query(
          `INSERT INTO mentor_assignments (mentor_id, student_id, tenant_id, cohort_id, is_active)
           VALUES ($1, $2, $3, $4, true)
           ON CONFLICT (mentor_id, student_id, cohort_id) DO NOTHING`,
          [mentorId, student.id, tenantId, cohort_id]
        );
      }

      console.log(`Auto-assigned ${studentsResult.rows.length} students to mentor ${name}`);
    }

    res.status(201).json({
      success: true,
      message: 'Mentor created successfully',
      mentor: result.rows[0],
      assigned_students: auto_assign_students ? (await pool.query(
        `SELECT COUNT(*) as count FROM mentor_assignments WHERE mentor_id = $1`,
        [mentorId]
      )).rows[0].count : 0
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

// Update Student
facilitatorRoutes.put("/students/:studentId", roleMiddleware(["facilitator"]), async (req: AuthRequest, res) => {
  try {
    const { tenantId } = req.user!;
    const { studentId } = req.params;
    const { name, email, password, phone, whatsapp_number, cohort_id } = req.body;

    const bcrypt = require('bcryptjs');
    let updateQuery = `UPDATE users SET name=$1, email=$2, phone=$3, whatsapp_number=$4, cohort_id=$5, updated_at=NOW()`;
    const params: any[] = [name, email, phone || null, whatsapp_number || null, cohort_id];

    if (password) {
      const hash = await bcrypt.hash(password, 10);
      updateQuery += `, password_hash=$${params.length + 1}`;
      params.push(hash);
    }

    updateQuery += ` WHERE id=$${params.length + 1} AND tenant_id=$${params.length + 2} AND role='student' RETURNING id, name, email, phone, whatsapp_number, cohort_id`;
    params.push(studentId, tenantId);

    const result = await pool.query(updateQuery, params);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Student not found' });

    res.json({ success: true, message: 'Student updated successfully', student: result.rows[0] });
  } catch (error: any) {
    console.error('Error updating student:', error);
    res.status(500).json({ error: 'Failed to update student' });
  }
});

// Update Mentor
facilitatorRoutes.put("/mentors/:mentorId", roleMiddleware(["facilitator"]), async (req: AuthRequest, res) => {
  try {
    const { tenantId } = req.user!;
    const { mentorId } = req.params;
    const { name, email, password, phone, whatsapp_number, cohort_id } = req.body;

    const bcrypt = require('bcryptjs');
    let updateQuery = `UPDATE users SET name=$1, email=$2, phone=$3, whatsapp_number=$4, cohort_id=$5, updated_at=NOW()`;
    const params: any[] = [name, email, phone || null, whatsapp_number || null, cohort_id];

    if (password) {
      const hash = await bcrypt.hash(password, 10);
      updateQuery += `, password_hash=$${params.length + 1}`;
      params.push(hash);
    }

    updateQuery += ` WHERE id=$${params.length + 1} AND tenant_id=$${params.length + 2} AND role='industryMentor' RETURNING id, name, email, phone, whatsapp_number, cohort_id`;
    params.push(mentorId, tenantId);

    const result = await pool.query(updateQuery, params);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Mentor not found' });

    res.json({ success: true, message: 'Mentor updated successfully', mentor: result.rows[0] });
  } catch (error: any) {
    console.error('Error updating mentor:', error);
    res.status(500).json({ error: 'Failed to update mentor' });
  }
});

// Send WhatsApp Tracker Reminders manually
facilitatorRoutes.post("/send-tracker-reminders", roleMiddleware(["facilitator"]), async (req: AuthRequest, res) => {
  try {
    const { tenantId } = req.user!;
    const { TwilioWhatsAppService } = await import("../../../services/twilio-whatsapp.service");

    // Get all students in this facilitator's cohorts who haven't submitted today's tracker
    const studentsResult = await pool.query(
      `SELECT u.id, u.name, u.whatsapp_number
       FROM users u
       JOIN cohorts c ON u.cohort_id = c.id
       WHERE u.role = 'student'
         AND u.is_active = true
         AND u.deleted_at IS NULL
         AND u.whatsapp_number IS NOT NULL
         AND c.tenant_id = $1
         AND NOT EXISTS (
           SELECT 1 FROM tracker_entries te
           WHERE te.student_id = u.id AND te.entry_date = CURRENT_DATE
         )`,
      [tenantId]
    );

    const students = studentsResult.rows;

    if (students.length === 0) {
      return res.json({ success: true, message: "All students have already submitted today's tracker.", sent: 0, failed: 0 });
    }

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const student of students) {
      const result = await TwilioWhatsAppService.sendTrackerReminder(student.name, student.whatsapp_number);
      if (result.success) {
        sent++;
      } else {
        failed++;
        errors.push(`${student.name}: ${result.error}`);
      }
    }

    res.json({
      success: true,
      message: `Reminders sent: ${sent} successful, ${failed} failed out of ${students.length} students.`,
      sent,
      failed,
      total: students.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("Error sending tracker reminders:", error);
    res.status(500).json({ success: false, message: error.message });
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
