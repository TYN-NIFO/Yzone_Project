import { Router } from "express";
import { AuthController } from "./auth.controller";

const router = Router();
const authController = new AuthController();

router.post("/login", (req, res) => authController.login(req, res));
router.post("/register", (req, res) => authController.register(req, res));
router.post("/forgot-password", (req, res) => authController.forgotPassword(req, res));
router.post("/verify-otp", (req, res) => authController.verifyOtp(req, res));
router.post("/reset-password", (req, res) => authController.resetPassword(req, res));

export default router;
