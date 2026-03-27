import { pool } from '../src/config/db';

async function fix() {
  // Get Vishnu's id
  const vishnu = await pool.query(
    `SELECT id, name, tenant_id FROM users WHERE email = 'vishnu@gmail.com' AND deleted_at IS NULL`
  );
  if (vishnu.rows.length === 0) {
    console.log('❌ Vishnu not found');
    await pool.end(); return;
  }
  const vishnuId = vishnu.rows[0].id;
  const vishnuTenantId = vishnu.rows[0].tenant_id;
  console.log(`Vishnu id: ${vishnuId}, tenant: ${vishnuTenantId}`);

  // Find the GCT_YZone cohort
  const cohort = await pool.query(
    `SELECT id, name, facilitator_id, tenant_id FROM cohorts WHERE name ILIKE '%GCT_YZone%' OR name ILIKE '%Intern%'`
  );
  console.log('Matching cohorts:');
  cohort.rows.forEach(r => console.log(JSON.stringify(r)));

  if (cohort.rows.length === 0) {
    console.log('❌ Cohort not found');
    await pool.end(); return;
  }

  const targetCohort = cohort.rows[0];

  // Update cohort facilitator_id to Vishnu
  await pool.query(
    `UPDATE cohorts SET facilitator_id = $1 WHERE id = $2`,
    [vishnuId, targetCohort.id]
  );

  // Also update Vishnu's tenant_id to match the cohort's tenant if different
  if (vishnuTenantId !== targetCohort.tenant_id) {
    console.log(`⚠️  Tenant mismatch — Vishnu: ${vishnuTenantId}, Cohort: ${targetCohort.tenant_id}`);
    console.log(`Updating Vishnu's tenant_id to match cohort...`);
    await pool.query(
      `UPDATE users SET tenant_id = $1 WHERE id = $2`,
      [targetCohort.tenant_id, vishnuId]
    );
  }

  console.log(`\n✅ Set Vishnu as facilitator of "${targetCohort.name}"`);

  // Verify
  const verify = await pool.query(
    `SELECT u.name, c.name as cohort, c.facilitator_id, u.tenant_id, c.tenant_id as cohort_tenant
     FROM users u JOIN cohorts c ON c.facilitator_id = u.id
     WHERE u.email = 'vishnu@gmail.com'`
  );
  console.log('Verification:', verify.rows);

  await pool.end();
}

fix().catch(console.error);
