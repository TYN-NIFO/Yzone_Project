import { Router } from "express";
import TenantController from "../controllers/tenant.controller";
import CohortController from "../controllers/cohort.controller";
import { DashboardController } from "../controllers/dashboard.controller";
import { MentorController } from "../../industryMentor/controllers/mentor.controller";
import { MOUController } from "../controllers/mou.controller";
import authMiddleware from "../../../middleware/auth.middleware";
import roleMiddleware from "../../../middleware/role.middleware";
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();
const dashboardController = new DashboardController();
const mentorController = new MentorController();

// Configure multer for MOU file uploads — save to disk
const mouUploadDir = path.join(__dirname, '../../../../uploads/mou');
if (!fs.existsSync(mouUploadDir)) fs.mkdirSync(mouUploadDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, mouUploadDir),
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Only PDF and Word documents are allowed'));
  }
});

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

// MOU Management Routes
router.post("/mou/upload", upload.single('file'), MOUController.uploadMOU);
router.get("/mou", MOUController.getMOUs);
router.get("/mou/stats", MOUController.getMOUStats);
router.get("/mou/:mouId", MOUController.getMOUById);
router.put("/mou/:mouId/status", MOUController.updateMOUStatus);
router.delete("/mou/:mouId", MOUController.deleteMOU);
export default router;
