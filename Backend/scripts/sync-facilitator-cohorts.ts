import { pool } from '../src/config/db';

async function sync() {
  // For every facilitator who has a cohort_id set on their user record,
  // make sure that cohort's facilitator_id points back to them
  const facilitators = await pool.query(
    `SELECT id, name, email, cohort_id, tenant_id 
     FROM users 
     WHERE role = 'facilitator' AND cohort_id IS NOT NULL AND deleted_at IS NULL`
  );

  console.log(`Found ${facilitators.rows.length} facilitators with cohort_id set`);

  for (const f of facilitators.rows) {
    const cohort = await pool.query(
      `SELECT id, name, facilitator_id FROM cohorts WHERE id = $1`, [f.cohort_id]
    );
    if (cohort.rows.length === 0) {
      console.log(`  ⚠️  ${f.name}: cohort ${f.cohort_id} not found`);
      continue;
    }
    const c = cohort.rows[0];
    if (c.facilitator_id === f.id) {
      console.log(`  ✅ ${f.name} → "${c.name}" already correct`);
    } else {
      await pool.query(`UPDATE cohorts SET facilitator_id = $1 WHERE id = $2`, [f.id, f.cohort_id]);
      console.log(`  🔧 Fixed: ${f.name} → "${c.name}" (was: ${c.facilitator_id || 'null'})`);
    }
  }

  console.log('\nDone.');
  await pool.end();
}
sync().catch(console.error);
