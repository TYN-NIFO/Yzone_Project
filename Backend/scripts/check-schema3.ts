import { pool } from '../src/config/db';
async function run() {
  for (const table of ['team_members', 'tracker_entries', 'mentor_assignments', 'faculty_feedback', 'notifications']) {
    const r = await pool.query(
      `SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name=$1 ORDER BY ordinal_position`, [table]
    );
    console.log(`\n${table.toUpperCase()}: ${r.rows.map(x => x.column_name).join(', ')}`);
  }
  await pool.end();
}
run().catch(console.error);
