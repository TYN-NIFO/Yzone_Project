import { pool } from '../src/config/db';
import * as fs from 'fs';
import * as path from 'path';

async function fixTeamsTable() {
  try {
    console.log('🔧 Fixing teams table structure...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'fix-teams-table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    await pool.query(sql);
    
    console.log('✅ Teams table structure fixed successfully!');
    console.log('   - Added tenant_id column');
    console.log('   - Added project_id column');
    console.log('   - Added created_at column');
    console.log('   - Added updated_at column');
    console.log('   - Added necessary indexes and triggers');
    
    // Verify the fix
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'teams'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Updated teams table columns:');
    columns.rows.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
  } catch (error) {
    console.error('❌ Error fixing teams table:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the fix
fixTeamsTable().catch(console.error);