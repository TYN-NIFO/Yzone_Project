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

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// STUDENT
router.post("/register", StudentController.register);
router.patch("/update/:id", StudentController.update);
router.get("/:id", StudentController.getById);
router.get("/", StudentController.getAll);

// TRACKER
router.post("/tracker", roleMiddleware(["student"]), upload.single("file"), (req, res) => dashboardController.submitTracker(req, res));
router.patch("/tracker/:id", StudentController.updateTracker);
router.get("/:id/tracker", StudentController.getTrackers);

// SUBMISSION
router.post("/submit", upload.single("file"), StudentController.submitProject);
router.patch("/submit/:id", upload.single("file"), StudentController.updateSubmission);
router.get("/submissions/:studentId", StudentController.getSubmissions);

export default router;