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
}
