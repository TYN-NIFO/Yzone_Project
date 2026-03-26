import { pool } from '../src/config/db';
async function run() {
  for (const table of ['attendance', 'projects']) {
    const r = await pool.query(
      `SELECT column_name, is_nullable, column_default 
       FROM information_schema.columns WHERE table_name=$1 ORDER BY ordinal_position`, [table]
    );
    console.log(`\n${table.toUpperCase()}:`);
    r.rows.forEach(row => console.log(`  ${row.column_name.padEnd(20)} nullable:${row.is_nullable} default:${row.column_default}`));
  }
  await pool.end();
}
run().catch(console.error);
