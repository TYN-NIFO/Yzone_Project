import { Response } from "express";
import { TenantService } from "../services/tenant.service";
import { AuthRequest } from "../../../types/custom-request";

const tenantService = new TenantService();

class TenantController {
  static async getAll(req: AuthRequest, res: Response) {
    try {
      const data = await tenantService.getAllTenants(req.user!.tenantId);
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("Error in getAll tenants:", error);
      res.status(500).json({ success: false, message: "Failed to fetch tenants" });
    }
  }

  static async getOne(req: AuthRequest, res: Response) {
    const { id } = req.params;

    if (!id || Array.isArray(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid tenant ID",
      });
    }

    try {
      const data = await tenantService.getTenantById(id);

      if (!data) {
        return res.status(404).json({
          success: false,
          message: "Tenant not found",
        });
      }

      res.json({ success: true, data });
    } catch (error: any) {
      console.error("Error in getOne tenant:", error);
      res.status(500).json({ success: false, message: "Failed to fetch tenant" });
    }
  }

  static async create(req: AuthRequest, res: Response) {
    try {
      const { name, institutionCode, contactEmail, contactPhone, address } = req.body;

      if (!name || !institutionCode || !contactEmail) {
        return res.status(400).json({
          success: false,
          message: "name, institutionCode, and contactEmail are required",
        });
      }

      const data = await tenantService.createTenant({
        name,
        institutionCode,
        contactEmail,
        contactPhone,
        address,
      });

      res.status(201).json({ success: true, data });
    } catch (error: any) {
      console.error("Error in create tenant:", error);
      res.status(500).json({ success: false, message: "Failed to create tenant" });
    }
  }
}

export default TenantController;
