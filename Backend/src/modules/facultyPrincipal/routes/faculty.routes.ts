// src/modules/facultyPrincipal/routes/faculty.routes.ts
import { Router } from "express";
import FacultyController from "../controllers/faculty.controller";
import { FacultyDashboardController } from "../controllers/dashboard.controller";
import authMiddleware from "../../../middleware/auth.middleware";
import roleMiddleware from "../../../middleware/role.middleware";

const router = Router();
const dashboardController = new FacultyDashboardController();

router.use(authMiddleware);

// Dashboard
router.get("/dashboard", roleMiddleware(["facultyPrincipal"]), (req, res) => dashboardController.getDashboard(req, res));

// Faculty Management
router.post("/", roleMiddleware(["tynExecutive"]), FacultyController.create);
router.get("/", roleMiddleware(["facultyPrincipal", "tynExecutive"]), FacultyController.getAll);
router.get("/:id", roleMiddleware(["facultyPrincipal", "tynExecutive"]), FacultyController.getOne);

export default router;
