import { pool } from '../src/config/db';
async function run() {
  const r = await pool.query(
    `SELECT column_name, is_nullable, column_default 
     FROM information_schema.columns WHERE table_name='tenants' ORDER BY ordinal_position`
  );
  console.log('TENANTS columns:');
  r.rows.forEach(row => console.log(`  ${row.column_name.padEnd(25)} nullable:${row.is_nullable}`));
  await pool.end();
}
run().catch(console.error);
