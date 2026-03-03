import bcrypt from 'bcryptjs';
import { pool } from '../src/config/db';

async function createTestUsers() {
  try {
    // Get tenant
    const tenantResult = await pool.query(
      "SELECT id FROM tenants LIMIT 1"
    );
    
    if (tenantResult.rows.length === 0) {
      console.error('No tenant found. Please create a tenant first.');
      process.exit(1);
    }
    
    const tenantId = tenantResult.rows[0].id;
    console.log('Using tenant:', tenantId);
    
    // Get or create cohort
    let cohortResult = await pool.query(
      "SELECT id FROM cohorts WHERE tenant_id = $1 LIMIT 1",
      [tenantId]
    );
    
    let cohortId;
    if (cohortResult.rows.length === 0) {
      const newCohort = await pool.query(
        `INSERT INTO cohorts (tenant_id, name, cohort_code, start_date, end_date)
         VALUES ($1, 'Test Cohort 2025', 'TC2025', '2025-01-01', '2025-12-31')
         RETURNING id`,
        [tenantId]
      );
      cohortId = newCohort.rows[0].id;
      console.log('Created cohort:', cohortId);
    } else {
      cohortId = cohortResult.rows[0].id;
      console.log('Using existing cohort:', cohortId);
    }
    
    // Test users to create
    const testUsers = [
      {
        name: 'John Facilitator',
        email: 'facilitator@yzone.com',
        password: 'facilitator123',
        role: 'facilitator',
        phone: '+1234567891',
      },
      {
        name: 'Dr. Sarah Principal',
        email: 'faculty@yzone.com',
        password: 'faculty123',
        role: 'facultyPrincipal',
        phone: '+1234567892',
      },
      {
        name: 'Mike Mentor',
        email: 'mentor@yzone.com',
        password: 'mentor123',
        role: 'industryMentor',
        phone: '+1234567893',
      },
      {
        name: 'Alice Student',
        email: 'student@yzone.com',
        password: 'student123',
        role: 'student',
        phone: '+1234567894',
      },
    ];
    
    console.log('\nCreating test users...\n');
    
    for (const user of testUsers) {
      // Check if user exists
      const existing = await pool.query(
        "SELECT id FROM users WHERE email = $1",
        [user.email]
      );
      
      const passwordHash = await bcrypt.hash(user.password, 10);
      
      if (existing.rows.length > 0) {
        // Update existing user
        await pool.query(
          `UPDATE users 
           SET password_hash = $1, 
               name = $2,
               role = $3,
               phone = $4,
               cohort_id = $5,
               is_active = true,
               deleted_at = NULL
           WHERE email = $6`,
          [passwordHash, user.name, user.role, user.phone, cohortId, user.email]
        );
        console.log(`✅ Updated: ${user.name} (${user.email})`);
      } else {
        // Create new user
        await pool.query(
          `INSERT INTO users (tenant_id, cohort_id, name, email, password_hash, role, phone, whatsapp_number)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [tenantId, cohortId, user.name, user.email, passwordHash, user.role, user.phone, user.phone]
        );
        console.log(`✅ Created: ${user.name} (${user.email})`);
      }
    }
    
    console.log('\n📋 Test User Credentials:\n');
    console.log('1. Tyn Executive (Admin):');
    console.log('   Email: admin@yzone.com');
    console.log('   Password: admin123\n');
    
    console.log('2. Facilitator:');
    console.log('   Email: facilitator@yzone.com');
    console.log('   Password: facilitator123\n');
    
    console.log('3. Faculty/Principal:');
    console.log('   Email: faculty@yzone.com');
    console.log('   Password: faculty123\n');
    
    console.log('4. Industry Mentor:');
    console.log('   Email: mentor@yzone.com');
    console.log('   Password: mentor123\n');
    
    console.log('5. Student:');
    console.log('   Email: student@yzone.com');
    console.log('   Password: student123\n');
    
    console.log('✅ All test users ready!\n');
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createTestUsers();
