import { Request, Response } from "express";
import { AuthService } from "./auth.service";

const authService = new AuthService();

export class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    try {
      const result = await authService.login(req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(401).json({ success: false, message: error.message });
    }
  }

  async register(req: Request, res: Response): Promise<void> {
    try {
      const result = await authService.register(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      if (!email) { res.status(400).json({ success: false, message: "Email is required." }); return; }
      await authService.sendOtp(email);
      res.status(200).json({ success: true, message: "OTP sent to your email." });
    } catch (error: any) {
      res.status(500).json({ success: false, message: "Failed to send OTP. Please try again." });
    }
  }

  async verifyOtp(req: Request, res: Response): Promise<void> {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) { res.status(400).json({ success: false, message: "Email and OTP are required." }); return; }
      const resetToken = await authService.verifyOtp(email, otp);
      res.status(200).json({ success: true, resetToken });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) { res.status(400).json({ success: false, message: "Token and new password are required." }); return; }
      if (newPassword.length < 6) { res.status(400).json({ success: false, message: "Password must be at least 6 characters." }); return; }
      await authService.resetPassword(token, newPassword);
      res.status(200).json({ success: true, message: "Password reset successfully." });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}
