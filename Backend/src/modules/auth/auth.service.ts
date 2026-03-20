import bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import * as crypto from "crypto";
import sgMail from "@sendgrid/mail";
import { pool } from "../../config/db";
import { LoginRequest, AuthResponse, JwtPayload } from "../../types/auth.types";

// Init SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

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

  // ── STEP 1: Send OTP ─────────────────────────────────────────
  async sendOtp(email: string): Promise<void> {
    const result = await pool.query(
      `SELECT id, name FROM users WHERE email = $1 AND deleted_at IS NULL AND is_active = true`,
      [email]
    );
    if (result.rows.length === 0) return; // silent — don't reveal if email exists

    const user = result.rows[0];

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await pool.query(
      `INSERT INTO otp_tokens (user_id, email, otp_hash, expires_at, verified, used)
       VALUES ($1, $2, $3, $4, false, false)
       ON CONFLICT DO NOTHING`,
      [user.id, email, otpHash, expiresAt]
    );

    // Delete old OTPs for this user first, then insert fresh
    await pool.query(`DELETE FROM otp_tokens WHERE user_id = $1`, [user.id]);
    await pool.query(
      `INSERT INTO otp_tokens (user_id, email, otp_hash, expires_at, verified, used)
       VALUES ($1, $2, $3, $4, false, false)`,
      [user.id, email, otpHash, expiresAt]
    );

    const fromEmail = process.env.SENDGRID_FROM_EMAIL || "no-reply@yzone.com";
    const fromName  = process.env.SENDGRID_FROM_NAME  || "YZone Platform";

    await sgMail.send({
      to: email,
      from: { email: fromEmail, name: fromName },
      subject: `${otp} is your YZone password reset OTP`,
      text: `Hi ${user.name},\n\nYour OTP to reset your YZone password is:\n\n${otp}\n\nThis OTP expires in 10 minutes. Do not share it with anyone.\n\nYZone Team`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#f9fafb;border-radius:12px;">
          <div style="text-align:center;margin-bottom:20px;">
            <div style="display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;background:#2563eb;border-radius:10px;">
              <span style="color:#fff;font-size:22px;font-weight:bold;">Y</span>
            </div>
            <h2 style="color:#1e293b;margin:10px 0 2px;">YZone Platform</h2>
          </div>
          <div style="background:#fff;border-radius:8px;padding:28px;border:1px solid #e2e8f0;">
            <p style="color:#475569;margin-top:0;">Hi <strong>${user.name}</strong>,</p>
            <p style="color:#475569;">Use the OTP below to reset your password. It expires in <strong>10 minutes</strong>.</p>
            <div style="text-align:center;margin:28px 0;">
              <div style="display:inline-block;background:#eff6ff;border:2px dashed #2563eb;border-radius:10px;padding:16px 40px;">
                <span style="font-size:36px;font-weight:800;letter-spacing:10px;color:#2563eb;">${otp}</span>
              </div>
            </div>
            <p style="color:#94a3b8;font-size:13px;text-align:center;">Do not share this OTP with anyone.</p>
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;"/>
            <p style="color:#94a3b8;font-size:12px;margin:0;">If you didn't request this, ignore this email.</p>
          </div>
        </div>
      `,
    });
  }

  // ── STEP 2: Verify OTP ────────────────────────────────────────
  async verifyOtp(email: string, otp: string): Promise<string> {
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

    const result = await pool.query(
      `SELECT id, user_id FROM otp_tokens
       WHERE email = $1 AND otp_hash = $2 AND expires_at > NOW() AND used = false`,
      [email, otpHash]
    );

    if (result.rows.length === 0) {
      throw new Error("Invalid or expired OTP.");
    }

    // Mark as verified (not used yet — used after password reset)
    await pool.query(
      `UPDATE otp_tokens SET verified = true WHERE id = $1`,
      [result.rows[0].id]
    );

    // Return a short-lived reset token tied to this verified OTP
    const resetToken = crypto.randomBytes(32).toString("hex");
    const tokenHash  = crypto.createHash("sha256").update(resetToken).digest("hex");
    const expiresAt  = new Date(Date.now() + 15 * 60 * 1000); // 15 min to complete reset

    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE SET token_hash = $2, expires_at = $3, used = false`,
      [result.rows[0].user_id, tokenHash, expiresAt]
    );

    return resetToken;
  }

  // ── STEP 3: Reset Password ────────────────────────────────────
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const result = await pool.query(
      `SELECT user_id FROM password_reset_tokens
       WHERE token_hash = $1 AND expires_at > NOW() AND used = false`,
      [tokenHash]
    );

    if (result.rows.length === 0) {
      throw new Error("Invalid or expired reset token.");
    }

    const { user_id } = result.rows[0];
    const passwordHash = await bcrypt.hash(newPassword, 10);

    await pool.query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [passwordHash, user_id]);
    await pool.query(`UPDATE password_reset_tokens SET used = true WHERE token_hash = $1`, [tokenHash]);
    // Clean up OTP tokens too
    await pool.query(`DELETE FROM otp_tokens WHERE user_id = $1`, [user_id]);
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
