import { pool } from '../src/config/db';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';

async function setup() {
  // 1. Get or create tenant
  let tenantRes = await pool.query(`SELECT id FROM tenants WHERE name = 'Yzone Demo' LIMIT 1`);
  let tenantId: string;
  if (tenantRes.rows.length === 0) {
    const t = await pool.query(
      `INSERT INTO tenants (name, institution_code, contact_email, is_active)
       VALUES ('Yzone Demo', 'YZONE001', 'admin@yzone.com', true) RETURNING id`
    );
    tenantId = t.rows[0].id;
    console.log(`✅ Created tenant: Yzone Demo (${tenantId})`);
  } else {
    tenantId = tenantRes.rows[0].id;
    console.log(`✅ Using existing tenant (${tenantId})`);
  }

  // 2. Get or create cohort
  let cohortRes = await pool.query(`SELECT id FROM cohorts WHERE name = 'Demo Cohort 2026' AND tenant_id = $1 LIMIT 1`, [tenantId]);
  let cohortId: string;
  if (cohortRes.rows.length === 0) {
    const c = await pool.query(
      `INSERT INTO cohorts (tenant_id, name, cohort_code, start_date, end_date, is_active)
       VALUES ($1, 'Demo Cohort 2026', 'DC2026', '2026-01-01', '2026-12-31', true) RETURNING id`,
      [tenantId]
    );
    cohortId = c.rows[0].id;
    console.log(`✅ Created cohort: Demo Cohort 2026 (${cohortId})`);
  } else {
    cohortId = cohortRes.rows[0].id;
    console.log(`✅ Using existing cohort (${cohortId})`);
  }

  // 3. Define all users
  const users = [
    { name: 'Tyn Executive',   email: 'executive@yzone.com',        password: 'exec123',        role: 'tynExecutive',     cohort_id: null },
    { name: 'Facilitator',     email: 'facilitator@yzone.com',      password: 'facilitator123', role: 'facilitator',      cohort_id: cohortId },
    { name: 'Faculty',         email: 'faculty@yzone.com',          password: 'faculty123',     role: 'facultyPrincipal', cohort_id: cohortId },
    { name: 'Mentor',          email: 'mentor@yzone.com',           password: 'mentor123',      role: 'industryMentor',   cohort_id: cohortId },
    { name: 'Student',         email: 'student@yzone.com',          password: 'student123',     role: 'student',          cohort_id: cohortId },
  ];

  console.log('\n--- Creating users ---');
  const createdIds: Record<string, string> = {};

  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 10);
    // Remove existing
    await pool.query(`DELETE FROM users WHERE email = $1`, [u.email]);
    const res = await pool.query(
      `INSERT INTO users (tenant_id, cohort_id, name, email, password_hash, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, true) RETURNING id`,
      [tenantId, u.cohort_id, u.name, u.email, hash, u.role]
    );
    createdIds[u.role] = res.rows[0].id;
    console.log(`✅ ${u.role.padEnd(20)} | ${u.email.padEnd(35)} | ${u.password}`);
  }

  // 4. Set facilitator on cohort
  await pool.query(
    `UPDATE cohorts SET facilitator_id = $1 WHERE id = $2`,
    [createdIds['facilitator'], cohortId]
  );
  console.log(`\n✅ Cohort facilitator set`);

  // 5. Create mentor assignment
  await pool.query(
    `INSERT INTO mentor_assignments (mentor_id, student_id, tenant_id, cohort_id, is_active)
     VALUES ($1, $2, $3, $4, true)
     ON CONFLICT DO NOTHING`,
    [createdIds['industryMentor'], createdIds['student'], tenantId, cohortId]
  );
  console.log(`✅ Mentor assigned to student`);

  console.log('\n========== LOGIN CREDENTIALS ==========');
  console.log('URL: http://localhost:5173');
  console.log('');
  console.log('Dashboard            Email                               Password');
  console.log('─────────────────────────────────────────────────────────────────');
  for (const u of users) {
    console.log(`${u.name.padEnd(20)} ${u.email.padEnd(35)} ${u.password}`);
  }
  console.log('═══════════════════════════════════════════════════════════════');

  await pool.end();
}

setup().catch(console.error);
