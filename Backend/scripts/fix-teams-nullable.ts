import { pool } from '../src/config/db';
async function fix() {
  await pool.query(`ALTER TABLE teams ALTER COLUMN project_id DROP NOT NULL`);
  console.log('✅ teams.project_id is now nullable');
  await pool.end();
}
fix().catch(console.error);
