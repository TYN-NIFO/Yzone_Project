import { pool } from '../src/config/db';

async function check() {
  const cohorts = await pool.query(
    `SELECT id, name, facilitator_id, tenant_id FROM cohorts WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 10`
  );
  console.log('=== COHORTS ===');
  cohorts.rows.forEach(r => console.log(JSON.stringify(r)));

  const vishnu = await pool.query(
    `SELECT id, name, email, role, cohort_id, tenant_id FROM users WHERE name ILIKE '%vishnu%' OR email ILIKE '%vishnu%'`
  );
  console.log('=== VISHNU USER ===');
  vishnu.rows.forEach(r => console.log(JSON.stringify(r)));

  const students = await pool.query(
    `SELECT id, name, email, cohort_id FROM users WHERE role = 'student' AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 15`
  );
  console.log('=== STUDENTS ===');
  students.rows.forEach(r => console.log(JSON.stringify(r)));

  await pool.end();
}

check().catch(console.error);
