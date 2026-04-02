import { Request, Response } from "express";
import * as ExecService from "../services/executive.service";
import * as AuthService from "../../auth/services/auth.service";

export const getAllTenants = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await ExecService.getTenants();
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to fetch tenants" });
    }
};

export const getTenant = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await ExecService.getTenantById(req.params.id as string);
        if (!data) { res.status(404).json({ success: false, message: "Tenant not found" }); return; }
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to fetch tenant" });
    }
};

export const createTenant = async (req: Request, res: Response): Promise<void> => {
    try {
        const { college_name, principal_name, email, phone, address, status } = req.body;
        if (!college_name || !principal_name || !email) {
            res.status(400).json({ success: false, message: "college_name, principal_name and email are required" });
            return;
        }
        const data = await ExecService.createTenant({ college_name, principal_name, email, phone, address, status });
        res.status(201).json({ success: true, data });
    } catch (err: any) {
        if (err.code === "23505") {
            res.status(409).json({ success: false, message: "Tenant email already exists" });
            return;
        }
        res.status(500).json({ success: false, message: "Failed to create tenant" });
    }
};

export const getCohorts = async (req: Request, res: Response): Promise<void> => {
    try {
        const tenantId = (req.params.tenantId as string) || (req.query.tenantId as string);
        if (!tenantId) { res.status(400).json({ success: false, message: "tenantId required" }); return; }
        const data = await ExecService.getCohortsForTenant(tenantId);
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to fetch cohorts" });
    }
};

export const createCohort = async (req: Request, res: Response): Promise<void> => {
    try {
        const { tenant_id, name, start_date, end_date } = req.body;
        if (!tenant_id || !name) {
            res.status(400).json({ success: false, message: "tenant_id and name are required" });
            return;
        }
        const data = await ExecService.createCohort({ tenant_id, name, start_date, end_date });
        res.status(201).json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to create cohort" });
    }
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, email, phone, password, role, tenantId, cohortId, department, experienceYears } = req.body;
        if (!name || !email || !password || !role) {
            res.status(400).json({ success: false, message: "name, email, password, role required" });
            return;
        }
        const existing = await AuthService.findUserByEmail(email);
        if (existing) { res.status(409).json({ success: false, message: "Email already exists" }); return; }
        const data = await AuthService.createUser({ name, email, phone, password, role, tenantId, cohortId, department, experienceYears });
        res.status(201).json({ success: true, data });
    } catch (err: any) {
        res.status(500).json({ success: false, message: "Failed to create user" });
    }
};

export const createMentor = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, email, phone, password, tenantId, cohortId, department, experienceYears } = req.body;
        if (!name || !email || !password) {
            res.status(400).json({ success: false, message: "name, email, password required" });
            return;
        }
        const existing = await AuthService.findUserByEmail(email);
        if (existing) { res.status(409).json({ success: false, message: "Email already exists" }); return; }
        const data = await AuthService.createUser({
            name, email, phone, password, role: "industryMentor",
            tenantId, cohortId, department, experienceYears
        });
        res.status(201).json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to create mentor" });
    }
};

export const assignFacilitator = async (req: Request, res: Response): Promise<void> => {
    try {
        const { facilitatorId, cohortId } = req.body;
        const tenantId = req.user!.tenantId!;
        if (!facilitatorId || !cohortId) {
            res.status(400).json({ success: false, message: "facilitatorId and cohortId required" });
            return;
        }
        const data = await ExecService.assignFacilitatorToCohort(facilitatorId, cohortId, tenantId);
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to assign facilitator" });
    }
};

export const getFacilitators = async (req: Request, res: Response): Promise<void> => {
    try {
        const tenantId = req.user!.tenantId!;
        const data = await ExecService.getUsersByRole("facilitator", tenantId);
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to fetch facilitators" });
    }
};

export const getMentors = async (req: Request, res: Response): Promise<void> => {
    try {
        const tenantId = req.user!.tenantId!;
        const data = await ExecService.getUsersByRole("industryMentor", tenantId);
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to fetch mentors" });
    }
};

export const getDashboard = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await ExecService.getDashboardStats();
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to fetch dashboard" });
    }
};
