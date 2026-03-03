import { pool } from '../src/config/db';

async function debugForeignKey() {
  try {
    console.log('🔍 Debugging foreign key constraint...\n');

    // 1. Check attendance table foreign keys
    console.log('1. Checking attendance table foreign keys...');
    const fkInfo = await pool.query(`
      SELECT
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'attendance'
    `);

    console.log('   Foreign keys:');
    fkInfo.rows.forEach(fk => {
      console.log(`   - ${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
    });

    // 2. Check if the foreign key references 'students' table instead of 'users'
    const wrongFK = fkInfo.rows.find(fk => 
      fk.column_name === 'student_id' && fk.foreign_table_name === 'students'
    );

    if (wrongFK) {
      console.log('\n2. Found incorrect foreign key referencing "students" table!');
      console.log('   Fixing foreign key constraint...');

      // Drop the incorrect foreign key
      await pool.query(`
        ALTER TABLE attendance 
        DROP CONSTRAINT IF EXISTS ${wrongFK.constraint_name}
      `);
      console.log(`   ✅ Dropped constraint: ${wrongFK.constraint_name}`);

      // Add correct foreign key to users table
      await pool.query(`
        ALTER TABLE attendance 
        ADD CONSTRAINT attendance_student_id_fkey 
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
      `);
      console.log('   ✅ Added correct foreign key to users table');
    } else {
      console.log('\n2. Foreign key is correctly referencing users table ✅');
    }

    // 3. Verify the fix
    console.log('\n3. Verifying foreign key fix...');
    const verifyFK = await pool.query(`
      SELECT
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'attendance'
        AND kcu.column_name = 'student_id'
    `);

    if (verifyFK.rows.length > 0) {
      const fk = verifyFK.rows[0];
      console.log(`   ✅ student_id -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
    }

    // 4. Test attendance insertion again
    console.log('\n4. Testing attendance insertion...');
    
    const testSession = await pool.query(
      'SELECT id FROM sessions WHERE session_date = CURRENT_DATE LIMIT 1'
    );

    const testStudent = await pool.query(
      "SELECT id FROM users WHERE role = 'student' AND deleted_at IS NULL LIMIT 1"
    );

    if (testSession.rows.length > 0 && testStudent.rows.length > 0) {
      console.log(`   Session ID: ${testSession.rows[0].id}`);
      console.log(`   Student ID: ${testStudent.rows[0].id}`);

      try {
        const result = await pool.query(
          `INSERT INTO attendance (id, session_id, student_id, is_present, marked_by, marked_at)
           VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
           ON CONFLICT (session_id, student_id) DO UPDATE 
           SET is_present = $4, marked_by = $5, marked_at = CURRENT_TIMESTAMP
           RETURNING *`,
          [
            require('crypto').randomUUID(),
            testSession.rows[0].id,
            testStudent.rows[0].id,
            true,
            testStudent.rows[0].id
          ]
        );
        console.log('   ✅ Attendance insertion test: PASS');
        console.log('   Created attendance record:', result.rows[0].id);
      } catch (error: any) {
        console.log('   ❌ Attendance insertion test: FAIL');
        console.log('   Error:', error.message);
        console.log('   Detail:', error.detail);
      }
    } else {
      console.log('   ℹ️  No sessions or students available for testing');
    }

    console.log('\n🎉 Foreign key debugging completed!');

  } catch (error) {
    console.error('❌ Error during foreign key debugging:', error);
  } finally {
    await pool.end();
  }
}

debugForeignKey();