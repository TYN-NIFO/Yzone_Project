import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import * as AuthService from "../services/auth.service";

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({ success: false, message: "Email and password are required" });
            return;
        }

        const user = await AuthService.findUserByEmail(email);
        if (!user) {
            res.status(401).json({ success: false, message: "Invalid credentials" });
            return;
        }

        if (!user.is_active) {
            res.status(403).json({ success: false, message: "Account is disabled" });
            return;
        }

        const valid = await AuthService.verifyPassword(password, user.password_hash);
        if (!valid) {
            res.status(401).json({ success: false, message: "Invalid credentials" });
            return;
        }

        const payload = {
            id: user.id,
            role: user.role,
            tenantId: user.tenant_id,
            cohortId: user.cohort_id,
            name: user.name,
            email: user.email,
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET as string, {
            expiresIn: (process.env.JWT_EXPIRES_IN as any) || "7d",
        });

        res.json({
            success: true,
            token,
            user: payload,
        });
    } catch (err: any) {
        console.error("Login error:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, email, phone, password, role, tenantId, cohortId, department, experienceYears } =
            req.body;

        if (!name || !email || !password || !role) {
            res.status(400).json({ success: false, message: "name, email, password, role are required" });
            return;
        }

        const validRoles = ["tynExecutive", "facilitator", "facultyPrincipal", "industryMentor", "student"];
        if (!validRoles.includes(role)) {
            res.status(400).json({ success: false, message: `Invalid role. Must be one of: ${validRoles.join(", ")}` });
            return;
        }

        const existing = await AuthService.findUserByEmail(email);
        if (existing) {
            res.status(409).json({ success: false, message: "Email already registered" });
            return;
        }

        const user = await AuthService.createUser({
            name, email, phone, password, role, tenantId, cohortId, department, experienceYears,
        });

        res.status(201).json({ success: true, data: user });
    } catch (err: any) {
        console.error("Register error:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
