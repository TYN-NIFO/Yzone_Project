import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

(async () => {
  try {
    const result = await pool.query(
      `SELECT current_database() as db, current_user as "user", 
              split_part(version(), ' ', 1) || ' ' || split_part(version(), ' ', 2) as version`
    );
    const row = result.rows[0];
    console.log('✅ Neon DB connected successfully!');
    console.log('   Database :', row.db);
    console.log('   User     :', row.user);
    console.log('   Version  :', row.version);

    // Check existing tables
    const tables = await pool.query(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`
    );
    console.log(`\n📋 Tables found (${tables.rows.length}):`);
    if (tables.rows.length === 0) {
      console.log('   (none) — you need to run migrations');
    } else {
      tables.rows.forEach((t: any) => console.log('  -', t.tablename));
    }
  } catch (err: any) {
    console.error('❌ Connection failed:', err.message);
  } finally {
    await pool.end();
  }
})();
