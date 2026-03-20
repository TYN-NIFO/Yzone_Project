import { pool } from '../src/config/db';

async function fix() {
  // Set facilitator_id on Cohort-2026 to Vishnu's id
  const result = await pool.query(
    `UPDATE cohorts 
     SET facilitator_id = 'f05620fa-68cb-4e68-8b50-f008e90304b2'
     WHERE id = 'd538a55a-626c-4249-a594-916d9e324a83'
     RETURNING id, name, facilitator_id`
  );
  console.log('Updated cohort:', result.rows[0]);
  await pool.end();
}

fix().catch(console.error);
