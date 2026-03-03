import { pool } from '../src/config/db';
import bcrypt from 'bcryptjs';

async function comprehensiveFix() {
  try {
    console.log('🔧 Starting comprehensive system fix...\n');

    // 1. Fix database schema inconsistencies
    console.log('1. Fixing database schema...');
    
    // Add missing columns to cohorts table
    try {
      await pool.query('ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS cohort_code VARCHAR(50)');
      console.log('✅ Added cohort_code column to cohorts table');
    } catch (error: any) {
      console.log('ℹ️  cohort_code column already exists or error:', error.message);
    }

    // 2. Ensure we have proper test users with correct passwords
    console.log('\n2. Ensuring test users exist with correct credentials...');
    
    const testUsers = [
      {
        email: 'admin@yzone.com',
        password: 'admin123',
        name: 'Admin Executive',
        role: 'tynExecutive'
      },
      {
        email: 'facilitator@yzone.com', 
        password: 'facilitator123',
        name: 'Test Facilitator',
        role: 'facilitator'
      },
      {
        email: 'faculty@yzone.com',
        password: 'faculty123', 
        name: 'Test Faculty',
        role: 'facultyPrincipal'
      },
      {
        email: 'mentor@yzone.com',
        password: 'mentor123',
        name: 'Test Mentor', 
        role: 'industryMentor'
      },
      {
        email: 'student@yzone.com',
        password: 'student123',
        name: 'Test Student',
        role: 'student'
      }
    ];

    // Get or create a tenant first
    let tenantResult = await pool.query('SELECT id FROM tenants WHERE deleted_at IS NULL LIMIT 1');
    let tenantId;
    
    if (tenantResult.rows.length === 0) {
      const newTenant = await pool.query(
        `INSERT INTO tenants (name, institution_code, contact_email, contact_phone, address)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        ['Default Institution', 'DEF001', 'admin@default.com', '1234567890', 'Default Address']
      );
      tenantId = newTenant.rows[0].id;
      console.log('✅ Created default tenant');
    } else {
      tenantId = tenantResult.rows[0].id;
      console.log('✅ Using existing tenant');
    }

    // Get or create a cohort
    let cohortResult = await pool.query('SELECT id FROM cohorts WHERE deleted_at IS NULL LIMIT 1');
    let cohortId;
    
    if (cohortResult.rows.length === 0) {
      const newCohort = await pool.query(
        `INSERT INTO cohorts (tenant_id, name, cohort_code, start_date, end_date)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [tenantId, 'Default Cohort', 'DEF2026', '2026-03-01', '2026-06-30']
      );
      cohortId = newCohort.rows[0].id;
      console.log('✅ Created default cohort');
    } else {
      cohortId = cohortResult.rows[0].id;
      console.log('✅ Using existing cohort');
    }

    for (const user of testUsers) {
      // Check if user exists
      const existingUser = await pool.query(
        'SELECT id, password_hash FROM users WHERE email = $1 AND deleted_at IS NULL',
        [user.email]
      );

      const passwordHash = await bcrypt.hash(user.password, 10);
      const userCohortId = user.role === 'student' ? cohortId : null;

      if (existingUser.rows.length === 0) {
        // Create new user
        await pool.query(
          `INSERT INTO users (tenant_id, cohort_id, name, email, password_hash, role, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, true)`,
          [tenantId, userCohortId, user.name, user.email, passwordHash, user.role]
        );
        console.log(`✅ Created user: ${user.email}`);
      } else {
        // Update existing user password
        await pool.query(
          'UPDATE users SET password_hash = $1, is_active = true WHERE email = $2',
          [passwordHash, user.email]
        );
        console.log(`✅ Updated user: ${user.email}`);
      }
    }

    // 3. Create sample sessions for attendance
    console.log('\n3. Creating sample sessions for attendance...');
    
    // Delete existing sessions to avoid duplicates
    await pool.query('DELETE FROM sessions WHERE session_date = CURRENT_DATE');
    
    const sessions = [
      { title: 'Morning Standup', session_date: new Date().toISOString().split('T')[0] },
      { title: 'Technical Workshop', session_date: new Date().toISOString().split('T')[0] },
      { title: 'Project Review', session_date: new Date().toISOString().split('T')[0] }
    ];

    for (const session of sessions) {
      await pool.query(
        `INSERT INTO sessions (id, title, session_date, cohort_id, created_at)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
        [require('crypto').randomUUID(), session.title, session.session_date, cohortId]
      );
      console.log(`✅ Created session: ${session.title}`);
    }

    // 4. Test authentication and permissions
    console.log('\n4. Testing authentication and permissions...');
    
    const adminUser = await pool.query(
      "SELECT id, name, email, role, tenant_id FROM users WHERE email = 'admin@yzone.com' AND deleted_at IS NULL"
    );

    if (adminUser.rows.length > 0) {
      console.log('✅ Admin user found:', adminUser.rows[0]);
      
      // Test password
      const storedUser = await pool.query(
        "SELECT password_hash FROM users WHERE email = 'admin@yzone.com'"
      );
      
      const isPasswordValid = await bcrypt.compare('admin123', storedUser.rows[0].password_hash);
      console.log('✅ Password validation:', isPasswordValid ? 'PASS' : 'FAIL');
    }

    console.log('\n🎉 Comprehensive fix completed successfully!');
    console.log('\n📋 Test Credentials:');
    console.log('- Executive: admin@yzone.com / admin123');
    console.log('- Facilitator: facilitator@yzone.com / facilitator123');
    console.log('- Faculty: faculty@yzone.com / faculty123');
    console.log('- Mentor: mentor@yzone.com / mentor123');
    console.log('- Student: student@yzone.com / student123');
    
    console.log('\n🌐 Access URLs:');
    console.log('- Frontend: http://localhost:5174');
    console.log('- Backend: http://localhost:5000');

  } catch (error) {
    console.error('❌ Error during comprehensive fix:', error);
  } finally {
    await pool.end();
  }
}

comprehensiveFix();