import { Router } from "express";
import { UserController } from "./user.controller";
import authMiddleware from "../../middleware/auth.middleware";
import roleMiddleware from "../../middleware/role.middleware";

const router = Router();
const userController = new UserController();

router.use(authMiddleware);

// Create user (tynExecutive and facilitator can create users)
router.post(
  "/",
  roleMiddleware(["tynExecutive", "facilitator"]),
  (req, res) => userController.createUser(req, res)
);

// Get all users
router.get(
  "/",
  roleMiddleware(["tynExecutive", "facilitator", "facultyPrincipal"]),
  (req, res) => userController.getAllUsers(req, res)
);

// Get users by role
router.get(
  "/role/:role",
  roleMiddleware(["tynExecutive", "facilitator"]),
  (req, res) => userController.getUsersByRole(req, res)
);

// Get users by cohort
router.get(
  "/cohort/:cohortId",
  roleMiddleware(["tynExecutive", "facilitator", "facultyPrincipal"]),
  (req, res) => userController.getUsersByCohort(req, res)
);

// Get user by ID
router.get(
  "/:id",
  (req, res) => userController.getUserById(req, res)
);

// Update user
router.put(
  "/:id",
  roleMiddleware(["tynExecutive", "facilitator"]),
  (req, res) => userController.updateUser(req, res)
);

// Delete user
router.delete(
  "/:id",
  roleMiddleware(["tynExecutive"]),
  (req, res) => userController.deleteUser(req, res)
);

// Change own password
router.post(
  "/change-password",
  (req, res) => userController.changePassword(req, res)
);

// Reset user password (admin only)
router.post(
  "/:id/reset-password",
  roleMiddleware(["tynExecutive"]),
  (req, res) => userController.resetPassword(req, res)
);

export default router;
