import { pool } from '../src/config/db';
import bcrypt from 'bcryptjs';

async function create() {
  // Get the real cohort and tenant
  const cohort = await pool.query(
    `SELECT id, tenant_id FROM cohorts WHERE name = 'Cohort-2026' LIMIT 1`
  );
  const cohortId = cohort.rows[0]?.id;
  const tenantId = cohort.rows[0]?.tenant_id;

  console.log(`Using cohort: ${cohortId}, tenant: ${tenantId}`);

  const users = [
    { name: 'Demo Executive',   email: 'executive@yzone.com',  password: 'exec123',        role: 'tynExecutive',    cohort_id: null },
    { name: 'Demo Facilitator', email: 'demo.facilitator@yzone.com', password: 'facilitator123', role: 'facilitator', cohort_id: cohortId },
    { name: 'Demo Faculty',     email: 'demo.faculty@yzone.com',     password: 'faculty123',     role: 'facultyPrincipal', cohort_id: cohortId },
    { name: 'Demo Mentor',      email: 'demo.mentor@yzone.com',      password: 'mentor123',      role: 'industryMentor',   cohort_id: cohortId },
    { name: 'Demo Student',     email: 'demo.student@yzone.com',     password: 'student123',     role: 'student',          cohort_id: cohortId },
  ];

  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 10);
    // Delete existing if present, then insert fresh
    await pool.query(`DELETE FROM users WHERE email = $1`, [u.email]);
    await pool.query(
      `INSERT INTO users (tenant_id, cohort_id, name, email, password_hash, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, true)`,
      [tenantId, u.cohort_id, u.name, u.email, hash, u.role]
    );
    console.log(`✅ ${u.role.padEnd(20)} ${u.email}  /  ${u.password}`);
  }

  // Also update facilitator_id on cohort for demo facilitator
  const facilitator = await pool.query(
    `SELECT id FROM users WHERE email = 'demo.facilitator@yzone.com'`
  );
  if (facilitator.rows[0]) {
    await pool.query(
      `UPDATE cohorts SET facilitator_id = $1 WHERE id = $2`,
      [facilitator.rows[0].id, cohortId]
    );
    console.log(`\n✅ Cohort-2026 facilitator_id set to demo facilitator`);
  }

  await pool.end();
}

create().catch(console.error);
