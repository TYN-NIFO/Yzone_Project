import { pool } from '../src/config/db';

async function fixAttendanceSchema() {
  try {
    console.log('🔧 Fixing attendance table schema...\n');

    // Check current attendance table structure
    console.log('1. Checking current attendance table structure...');
    const tableInfo = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'attendance'
      ORDER BY ordinal_position
    `);

    console.log('   Current columns:');
    tableInfo.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // Check if we need to migrate from status to is_present
    const hasStatus = tableInfo.rows.some(col => col.column_name === 'status');
    const hasIsPresent = tableInfo.rows.some(col => col.column_name === 'is_present');

    if (hasStatus && !hasIsPresent) {
      console.log('\n2. Migrating from status to is_present...');
      
      // Add is_present column
      await pool.query(`
        ALTER TABLE attendance 
        ADD COLUMN IF NOT EXISTS is_present BOOLEAN DEFAULT false
      `);
      console.log('   ✅ Added is_present column');

      // Migrate data from status to is_present
      await pool.query(`
        UPDATE attendance 
        SET is_present = (status = 'PRESENT')
        WHERE status IS NOT NULL
      `);
      console.log('   ✅ Migrated data from status to is_present');

      // Drop status column
      await pool.query(`
        ALTER TABLE attendance 
        DROP COLUMN IF EXISTS status
      `);
      console.log('   ✅ Dropped status column');

      // Drop reason column if it exists
      await pool.query(`
        ALTER TABLE attendance 
        DROP COLUMN IF EXISTS reason
      `);
      console.log('   ✅ Dropped reason column');

    } else if (hasIsPresent) {
      console.log('\n2. Attendance table already has is_present column ✅');
    } else {
      console.log('\n2. Adding is_present column...');
      await pool.query(`
        ALTER TABLE attendance 
        ADD COLUMN IF NOT EXISTS is_present BOOLEAN DEFAULT false
      `);
      console.log('   ✅ Added is_present column');
    }

    // Ensure marked_by column exists
    const hasMarkedBy = tableInfo.rows.some(col => col.column_name === 'marked_by');
    if (!hasMarkedBy) {
      console.log('\n3. Adding marked_by column...');
      await pool.query(`
        ALTER TABLE attendance 
        ADD COLUMN IF NOT EXISTS marked_by UUID
      `);
      console.log('   ✅ Added marked_by column');
    }

    // Verify final structure
    console.log('\n4. Verifying final attendance table structure...');
    const finalTableInfo = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'attendance'
      ORDER BY ordinal_position
    `);

    console.log('   Final columns:');
    finalTableInfo.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // Test attendance insertion
    console.log('\n5. Testing attendance insertion...');
    
    const testSession = await pool.query(
      'SELECT id FROM sessions WHERE session_date = CURRENT_DATE LIMIT 1'
    );

    const testStudent = await pool.query(
      "SELECT id FROM users WHERE role = 'student' AND deleted_at IS NULL LIMIT 1"
    );

    if (testSession.rows.length > 0 && testStudent.rows.length > 0) {
      try {
        await pool.query(
          `INSERT INTO attendance (id, session_id, student_id, is_present, marked_by, marked_at)
           VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
           ON CONFLICT (session_id, student_id) DO UPDATE 
           SET is_present = $4, marked_by = $5, marked_at = CURRENT_TIMESTAMP`,
          [
            require('crypto').randomUUID(),
            testSession.rows[0].id,
            testStudent.rows[0].id,
            true,
            testStudent.rows[0].id
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

    console.log('\n🎉 Attendance schema fix completed!');

  } catch (error) {
    console.error('❌ Error during attendance schema fix:', error);
  } finally {
    await pool.end();
  }
}

fixAttendanceSchema();