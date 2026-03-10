import { pool } from '../src/config/db';
import * as fs from 'fs';
import * as path from 'path';

async function runDatabaseFixes() {
  try {
    console.log('🔧 Running database schema fixes...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'fix-database-schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    await pool.query(sql);
    
    console.log('✅ Database schema fixes completed successfully!');
    console.log('   - Added mentor_id column to teams table');
    console.log('   - Added team_id column to mentor_assignments table');
    console.log('   - Created tracker_reminders table');
    console.log('   - Added necessary indexes and triggers');
    
  } catch (error) {
    console.error('❌ Error running database fixes:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the fixes
runDatabaseFixes().catch(console.error);