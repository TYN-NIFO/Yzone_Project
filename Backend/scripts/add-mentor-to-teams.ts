import { pool } from '../src/config/db';
import * as fs from 'fs';
import * as path from 'path';

async function addMentorToTeams() {
  try {
    console.log('\n🔧 Adding mentor support to teams...\n');

    // Read and execute the SQL migration
    const sqlPath = path.join(__dirname, 'add-mentor-to-teams.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    await pool.query(sql);

    console.log('✅ Successfully added mentor_id column to teams table');
    console.log('✅ Successfully added team_id column to mentor_assignments table');
    console.log('✅ Created indexes for better query performance');
    console.log('✅ Updated existing mentor assignments with team links');

    // Verify the changes
    const teamsCheck = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'teams' AND column_name = 'mentor_id'
    `);

    const mentorAssignmentsCheck = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'mentor_assignments' AND column_name = 'team_id'
    `);

    if (teamsCheck.rows.length > 0) {
      console.log('\n✅ Verified: teams.mentor_id column exists');
    }

    if (mentorAssignmentsCheck.rows.length > 0) {
      console.log('✅ Verified: mentor_assignments.team_id column exists');
    }

    console.log('\n🎉 Migration completed successfully!\n');
    console.log('Now mentors can be assigned to specific teams.');
    console.log('Each team will have one mentor who guides all students in that team.\n');

  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

addMentorToTeams();
