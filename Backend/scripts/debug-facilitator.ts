import { pool } from '../src/config/db';

async function check() {
  // All facilitators and their linked cohorts
  const f = await pool.query(`
    SELECT u.id, u.name, u.email, u.tenant_id,
           c.id as cohort_id, c.name as cohort_name, c.facilitator_id
    FROM users u
    LEFT JOIN cohorts c ON c.facilitator_id = u.id
    WHERE u.role = 'facilitator' AND u.deleted_at IS NULL
  `);
  console.log('\n=== FACILITATORS + COHORTS ===');
  f.rows.forEach(r => console.log(JSON.stringify(r)));

  // All cohorts
  const c = await pool.query(`SELECT id, name, facilitator_id, tenant_id FROM cohorts WHERE deleted_at IS NULL`);
  console.log('\n=== ALL COHORTS ===');
  c.rows.forEach(r => console.log(JSON.stringify(r)));

  // Students per cohort
  const s = await pool.query(`
    SELECT u.cohort_id, c.name as cohort_name, COUNT(*) as student_count
    FROM users u
    JOIN cohorts c ON u.cohort_id = c.id
    WHERE u.role = 'student' AND u.deleted_at IS NULL
    GROUP BY u.cohort_id, c.name
  `);
  console.log('\n=== STUDENTS PER COHORT ===');
  s.rows.forEach(r => console.log(JSON.stringify(r)));

  await pool.end();
}
check().catch(console.error);
