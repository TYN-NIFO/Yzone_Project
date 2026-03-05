import { Router } from "express";
import * as AuthController from "../controllers/auth.controller";
import authMiddleware from "../../../middleware/auth.middleware";
import roleMiddleware from "../../../middleware/role.middleware";

const router = Router();

// Public routes
router.post("/login", AuthController.login);

// Protected: only tynExecutive can register new users
router.post("/register", authMiddleware, roleMiddleware(["tynExecutive"]), AuthController.register);

export default router;
