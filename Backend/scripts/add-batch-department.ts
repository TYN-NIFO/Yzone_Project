import { pool } from '../src/config/db';

async function run() {
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS batch VARCHAR(100)`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(100)`);
  console.log('✅ batch and department columns added');
  await pool.end();
}

run().catch(e => { console.error(e.message); process.exit(1); });
