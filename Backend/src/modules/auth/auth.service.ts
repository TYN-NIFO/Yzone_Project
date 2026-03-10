import bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { pool } from "../../config/db";
import { LoginRequest, AuthResponse, JwtPayload } from "../../types/auth.types";

export class AuthService {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const { email, password } = credentials;

    const result = await pool.query(
      `SELECT id, tenant_id, cohort_id, name, email, password_hash, role, is_active 
       FROM users 
       WHERE email = $1 AND deleted_at IS NULL`,
      [email]
    );

    if (result.rows.length === 0) {
      throw new Error("Invalid credentials");
    }

    const user = result.rows[0];

    if (!user.is_active) {
      throw new Error("Account is inactive");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      throw new Error("Invalid credentials");
    }

    const payload: JwtPayload = {
      id: user.id,
      role: user.role,
      tenantId: user.tenant_id,
      cohortId: user.cohort_id,
      name: user.name,
      email: user.email,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || "fallback-secret");

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenant_id,
        cohortId: user.cohort_id,
      },
    };
  }

  async register(userData: any): Promise<AuthResponse> {
    const { tenantId, cohortId, name, email, password, role, phone, whatsappNumber } = userData;

    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1 AND tenant_id = $2 AND deleted_at IS NULL",
      [email, tenantId]
    );

    if (existingUser.rows.length > 0) {
      throw new Error("User already exists");
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (tenant_id, cohort_id, name, email, password_hash, role, phone, whatsapp_number)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, tenant_id, cohort_id, name, email, role`,
      [tenantId, cohortId, name, email, passwordHash, role, phone, whatsappNumber]
    );

    const user = result.rows[0];

    const payload: JwtPayload = {
      id: user.id,
      role: user.role,
      tenantId: user.tenant_id,
      cohortId: user.cohort_id,
      name: user.name,
      email: user.email,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || "fallback-secret");

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenant_id,
        cohortId: user.cohort_id,
      },
    };
  }
}
