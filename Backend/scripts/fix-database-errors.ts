import { pool } from '../src/config/db';

async function fixDatabaseErrors() {
  try {
    console.log('🔧 Fixing database errors...\n');

    // 1. Fix cohort_code constraint - make it nullable or add default values
    console.log('1. Fixing cohort_code constraint...');
    
    try {
      // First, check if there are any cohorts with null cohort_code
      const nullCohortsResult = await pool.query(
        'SELECT id, name FROM cohorts WHERE cohort_code IS NULL'
      );

      if (nullCohortsResult.rows.length > 0) {
        console.log(`   Found ${nullCohortsResult.rows.length} cohorts with null cohort_code`);
        
        // Update each cohort with a generated code
        for (const cohort of nullCohortsResult.rows) {
          const generatedCode = `COH${Date.now().toString().slice(-6)}`;
          await pool.query(
            'UPDATE cohorts SET cohort_code = $1 WHERE id = $2',
            [generatedCode, cohort.id]
          );
          console.log(`   ✅ Updated cohort "${cohort.name}" with code: ${generatedCode}`);
        }
      } else {
        console.log('   ✅ All cohorts have cohort_code values');
      }
    } catch (error: any) {
      console.log('   ℹ️  Error checking cohort_code:', error.message);
    }

    // 2. Fix attendance foreign key constraint
    console.log('\n2. Fixing attendance foreign key constraint...');
    
    try {
      // Check if there are any orphaned attendance records
      const orphanedAttendance = await pool.query(`
        SELECT a.id, a.student_id 
        FROM attendance a 
        LEFT JOIN users u ON a.student_id = u.id 
        WHERE u.id IS NULL
      `);

      if (orphanedAttendance.rows.length > 0) {
        console.log(`   Found ${orphanedAttendance.rows.length} orphaned attendance records`);
        
        // Delete orphaned records
        await pool.query(`
          DELETE FROM attendance 
          WHERE id IN (
            SELECT a.id 
            FROM attendance a 
            LEFT JOIN users u ON a.student_id = u.id 
            WHERE u.id IS NULL
          )
        `);
        console.log('   ✅ Deleted orphaned attendance records');
      } else {
        console.log('   ✅ No orphaned attendance records found');
      }
    } catch (error: any) {
      console.log('   ℹ️  Error checking attendance:', error.message);
    }

    // 3. Verify database integrity
    console.log('\n3. Verifying database integrity...');
    
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM cohorts WHERE cohort_code IS NULL) as null_cohort_codes,
        (SELECT COUNT(*) FROM cohorts WHERE deleted_at IS NULL) as active_cohorts,
        (SELECT COUNT(*) FROM users WHERE role = 'student' AND deleted_at IS NULL) as active_students,
        (SELECT COUNT(*) FROM sessions WHERE session_date = CURRENT_DATE) as today_sessions,
        (SELECT COUNT(*) FROM attendance) as total_attendance_records
    `);

    const result = stats.rows[0];
    console.log('   Database Statistics:');
    console.log(`   - Cohorts with null code: ${result.null_cohort_codes}`);
    console.log(`   - Active cohorts: ${result.active_cohorts}`);
    console.log(`   - Active students: ${result.active_students}`);
    console.log(`   - Today's sessions: ${result.today_sessions}`);
    console.log(`   - Total attendance records: ${result.total_attendance_records}`);

    // 4. Test attendance insertion
    console.log('\n4. Testing attendance functionality...');
    
    const testSession = await pool.query(
      'SELECT id FROM sessions WHERE session_date = CURRENT_DATE LIMIT 1'
    );

    const testStudent = await pool.query(
      "SELECT id FROM users WHERE role = 'student' AND deleted_at IS NULL LIMIT 1"
    );

    if (testSession.rows.length > 0 && testStudent.rows.length > 0) {
      try {
        // Try to insert a test attendance record
        await pool.query(
          `INSERT INTO attendance (id, session_id, student_id, is_present, marked_by, marked_at)
           VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
           ON CONFLICT (session_id, student_id) DO NOTHING`,
          [
            require('crypto').randomUUID(),
            testSession.rows[0].id,
            testStudent.rows[0].id,
            true,
            testStudent.rows[0].id // Using student as marker for test
          ]
        );
        console.log('   ✅ Attendance insertion test: PASS');
      } catch (error: any) {
        console.log('   ❌ Attendance insertion test: FAIL');
        console.log('   Error:', error.message);
      }
    } else {
      console.log('   ℹ️  No sessions or students available for testing');
    }

    console.log('\n🎉 Database fixes completed!');
    console.log('\n📋 Next Steps:');
    console.log('1. Restart the backend server if it\'s running');
    console.log('2. Test cohort creation from facilitator dashboard');
    console.log('3. Test attendance marking from facilitator dashboard');

  } catch (error) {
    console.error('❌ Error during database fix:', error);
  } finally {
    await pool.end();
  }
}

fixDatabaseErrors();