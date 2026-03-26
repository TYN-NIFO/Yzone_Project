import { pool } from '../src/config/db';
async function run() {
  const s = await pool.query(`SELECT column_name, is_nullable, column_default FROM information_schema.columns WHERE table_name='sessions' ORDER BY ordinal_position`);
  console.log('SESSIONS:');
  s.rows.forEach(r => console.log(' ', r.column_name, '| nullable:', r.is_nullable, '| default:', r.column_default));
  const t = await pool.query(`SELECT column_name, is_nullable, column_default FROM information_schema.columns WHERE table_name='teams' ORDER BY ordinal_position`);
  console.log('TEAMS:');
  t.rows.forEach(r => console.log(' ', r.column_name, '| nullable:', r.is_nullable, '| default:', r.column_default));
  await pool.end();
}
run().catch(console.error);
