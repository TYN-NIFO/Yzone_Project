import { Router } from "express";
import TenantController from "../controllers/tenant.controller";
import CohortController from "../controllers/cohort.controller";
import { DashboardController } from "../controllers/dashboard.controller";
import { MentorController } from "../../industryMentor/controllers/mentor.controller";
import authMiddleware from "../../../middleware/auth.middleware";
import roleMiddleware from "../../../middleware/role.middleware";

const router = Router();
const dashboardController = new DashboardController();
const mentorController = new MentorController();

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

export default router;
