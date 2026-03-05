import { Router } from "express";
import TenantController from "../controllers/tenant.controller";
import CohortController from "../controllers/cohort.controller";
import { DashboardController } from "../controllers/dashboard.controller";
import { MentorController } from "../../industryMentor/controllers/mentor.controller";
<<<<<<< HEAD
=======
import { MOUController } from "../controllers/mou.controller";
>>>>>>> e25b0f6 (hi)
import authMiddleware from "../../../middleware/auth.middleware";
import roleMiddleware from "../../../middleware/role.middleware";
import multer from 'multer';

const router = Router();
const dashboardController = new DashboardController();
const mentorController = new MentorController();
<<<<<<< HEAD
=======

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow PDF and common document formats
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and Word documents are allowed'));
    }
  }
});
>>>>>>> e25b0f6 (hi)

router.use(authMiddleware);
router.use(roleMiddleware(["tynExecutive"]));

router.get("/dashboard", (req, res) => dashboardController.getExecutiveDashboard(req, res));

router.get("/tenants", TenantController.getAll);
router.get("/tenants/:id", TenantController.getOne);
router.post("/tenants", TenantController.create);

router.post("/cohorts", CohortController.create);
router.get("/cohorts/:tenantId", CohortController.getByTenant);

router.post("/mentor/create", (req, res) => mentorController.createMentor(req, res));
router.get("/mentors", (req, res) => mentorController.getAllMentors(req, res));
router.post("/mentor/assign", (req, res) => mentorController.assignStudents(req, res));

<<<<<<< HEAD
=======
// MOU Management Routes
router.post("/mou/upload", upload.single('file'), MOUController.uploadMOU);
router.get("/mou", MOUController.getMOUs);
router.get("/mou/stats", MOUController.getMOUStats);
router.get("/mou/:mouId", MOUController.getMOUById);
router.put("/mou/:mouId/status", MOUController.updateMOUStatus);
router.delete("/mou/:mouId", MOUController.deleteMOU);

>>>>>>> e25b0f6 (hi)
export default router;
