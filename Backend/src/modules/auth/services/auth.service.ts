import { pool } from "../../../config/db";
import bcrypt from "bcryptjs";

export const findUserByEmail = async (email: string) => {
    const result = await pool.query(
        "SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL",
        [email]
    );
    return result.rows[0] || null;
};

export const createUser = async (data: {
    name: string;
    email: string;
    phone?: string;
    password: string;
    role: string;
    tenantId?: string;
    cohortId?: string;
    department?: string;
    experienceYears?: number;
}) => {
    const passwordHash = await bcrypt.hash(data.password, 12);
    const result = await pool.query(
        `INSERT INTO users (name, email, phone, password_hash, role, tenant_id, cohort_id, department, experience_years)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING id, name, email, role, tenant_id, cohort_id, created_at`,
        [
            data.name,
            data.email,
            data.phone || null,
            passwordHash,
            data.role,
            data.tenantId || null,
            data.cohortId || null,
            data.department || null,
            data.experienceYears || null,
        ]
    );
    return result.rows[0];
};

export const verifyPassword = async (plain: string, hash: string): Promise<boolean> => {
    return bcrypt.compare(plain, hash);
};
