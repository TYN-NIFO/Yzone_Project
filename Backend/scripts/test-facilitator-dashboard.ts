import { pool } from '../src/config/db';

async function test() {
  // Simulate what the dashboard controller does for each facilitator
  const facilitators = await pool.query(
    `SELECT id, name, email, tenant_id FROM users WHERE role = 'facilitator' AND deleted_at IS NULL`
  );

  for (const f of facilitators.rows) {
    const cohorts = await pool.query(
      `SELECT id, name FROM cohorts WHERE facilitator_id = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
      [f.id, f.tenant_id]
    );

    const students = cohorts.rows.length > 0 ? await pool.query(
      `SELECT COUNT(*) as count FROM users WHERE cohort_id = ANY($1) AND role = 'student' AND deleted_at IS NULL`,
      [cohorts.rows.map(c => c.id)]
    ) : { rows: [{ count: 0 }] };

    console.log(`\n👤 ${f.name} (${f.email})`);
    console.log(`   tenant_id: ${f.tenant_id}`);
    console.log(`   cohorts: ${cohorts.rows.length > 0 ? cohorts.rows.map(c => c.name).join(', ') : '❌ NONE'}`);
    console.log(`   students: ${students.rows[0].count}`);
  }

  await pool.end();
}
test().catch(console.error);
