// src/modules/student/routes/student.routes.ts
import { Router } from "express";
import multer from "multer";
import StudentController from "../controllers/student.controller";
import { StudentDashboardController } from "../controllers/dashboard.controller";
import authMiddleware from "../../../middleware/auth.middleware";
import roleMiddleware from "../../../middleware/role.middleware";

const router = Router();
const dashboardController = new StudentDashboardController();

router.use(authMiddleware);

// Dashboard
router.get("/dashboard", roleMiddleware(["student"]), (req, res) => dashboardController.getDashboard(req, res));
router.get("/notifications", roleMiddleware(["student"]), (req, res) => dashboardController.getNotifications(req, res));
router.patch("/notifications/:id/read", roleMiddleware(["student"]), (req, res) => dashboardController.markNotificationRead(req, res));

// Attendance
router.post("/attendance", roleMiddleware(["student"]), (req, res) => dashboardController.markAttendance(req, res));
router.get("/today-sessions", roleMiddleware(["student"]), (req, res) => dashboardController.getTodaySessions(req, res));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// TRACKER - Must come before /:id routes
router.post("/tracker", roleMiddleware(["student"]), upload.single("file"), (req, res) => dashboardController.submitTracker(req, res));
router.get("/tracker/today", roleMiddleware(["student"]), (req, res) => dashboardController.getTodayTracker(req, res));
router.get("/tracker/history", roleMiddleware(["student"]), (req, res) => dashboardController.getTrackerHistory(req, res));
router.put("/tracker/:id/update", roleMiddleware(["student"]), (req, res) => dashboardController.updateTodayTracker(req, res));

// Attendance Stats - Must come before /:id routes
router.get("/attendance/stats", roleMiddleware(["student"]), (req, res) => dashboardController.getAttendanceStats(req, res));
router.get("/attendance/history", roleMiddleware(["student"]), (req, res) => dashboardController.getAttendanceHistory(req, res));
router.get("/upcoming-sessions", roleMiddleware(["student"]), (req, res) => dashboardController.getUpcomingSessions(req, res));

// Project submission
router.post("/project/submit", roleMiddleware(["student"]), upload.single("file"), (req, res) => dashboardController.submitProject(req, res));

// STUDENT - Generic routes with :id parameter (must come after specific routes)
router.post("/register", StudentController.register);
router.patch("/update/:id", StudentController.update);
router.get("/", StudentController.getAll);
router.patch("/tracker/:id", StudentController.updateTracker);
router.get("/:id/tracker", StudentController.getTrackers);
router.get("/:id", StudentController.getById);

// SUBMISSION
router.post("/submit", upload.single("file"), StudentController.submitProject);
router.patch("/submit/:id", upload.single("file"), StudentController.updateSubmission);
router.get("/submissions/:studentId", StudentController.getSubmissions);

export default router;