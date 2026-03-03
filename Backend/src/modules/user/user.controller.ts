import { Response } from "express";
import { UserService } from "./user.service";
import { AuthRequest } from "../../types/custom-request";

const userService = new UserService();

export class UserController {
  async createUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = await userService.createUser(req.body, req.user!.tenantId);
      res.status(201).json({ success: true, data: user });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getAllUsers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const role = req.query.role as string | undefined;
      const users = await userService.getAllUsers(req.user!.tenantId, role);
      res.status(200).json({ success: true, data: users });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getUserById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const user = await userService.getUserById(id, req.user!.tenantId);
      if (!user) {
        res.status(404).json({ success: false, message: "User not found" });
        return;
      }
      res.status(200).json({ success: true, data: user });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const user = await userService.updateUser(id, req.body, req.user!.tenantId);
      res.status(200).json({ success: true, data: user });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async deleteUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      await userService.deleteUser(id, req.user!.tenantId);
      res.status(200).json({ success: true, message: "User deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async changePassword(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { currentPassword, newPassword } = req.body;
      await userService.changePassword(req.user!.id, currentPassword, newPassword);
      res.status(200).json({ success: true, message: "Password changed successfully" });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async resetPassword(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const { newPassword } = req.body;
      await userService.resetPassword(id, newPassword, req.user!.tenantId);
      res.status(200).json({ success: true, message: "Password reset successfully" });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getUsersByRole(req: AuthRequest, res: Response): Promise<void> {
    try {
      const role = req.params.role as string;
      const users = await userService.getUsersByRole(req.user!.tenantId, role);
      res.status(200).json({ success: true, data: users });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getUsersByCohort(req: AuthRequest, res: Response): Promise<void> {
    try {
      const cohortId = req.params.cohortId as string;
      const users = await userService.getUsersByCohort(cohortId, req.user!.tenantId);
      res.status(200).json({ success: true, data: users });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
