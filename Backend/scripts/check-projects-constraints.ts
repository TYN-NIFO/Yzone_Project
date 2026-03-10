import { pool } from '../src/config/db';

async function checkProjectsConstraints() {
  try {
    console.log('🔍 Checking projects table constraints...');
    
    // Get table constraints
    const constraints = await pool.query(`
      SELECT conname, contype, pg_get_constraintdef(oid) as definition
      FROM pg_constraint 
      WHERE conrelid = 'projects'::regclass
    `);
    
    console.log('📋 Projects table constraints:');
    constraints.rows.forEach(constraint => {
      console.log(`   ${constraint.conname} (${constraint.contype}): ${constraint.definition}`);
    });
    
    // Get sample data to see what values exist
    const sampleData = await pool.query('SELECT * FROM projects LIMIT 3');
    console.log('\n📋 Sample projects data:');
    sampleData.rows.forEach((project, index) => {
      console.log(`   ${index + 1}. ${JSON.stringify(project, null, 2)}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking constraints:', error);
  } finally {
    await pool.end();
  }
}

checkProjectsConstraints().catch(console.error);