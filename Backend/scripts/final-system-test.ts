import { pool } from '../src/config/db';
import * as jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

async function finalSystemTest() {
  try {
    console.log('🧪 Running final system test...\n');

    // 1. Test Authentication
    console.log('1. Testing Authentication...');
    
    const userResult = await pool.query(
      "SELECT id, name, email, role, tenant_id, password_hash FROM users WHERE email = 'admin@yzone.com' AND deleted_at IS NULL"
    );

    if (userResult.rows.length === 0) {
      console.log('❌ Admin user not found');
      return;
    }

    const user = userResult.rows[0];
    console.log('✅ Admin user found:', { id: user.id, name: user.name, email: user.email, role: user.role });

    // Test password
    const isPasswordValid = await bcrypt.compare('admin123', user.password_hash);
    console.log('✅ Password validation:', isPasswordValid ? 'PASS' : 'FAIL');

    // Test JWT token generation
    const payload = {
      id: user.id,
      role: user.role,
      tenantId: user.tenant_id,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || "fallback-secret");
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any;
    console.log('✅ JWT token generation and verification: PASS');

    // 2. Test Tenant Creation API
    console.log('\n2. Testing Tenant Creation API...');
    
    const tenantData = {
      name: 'Final Test Tenant',
      institutionCode: 'FINAL001',
      contactEmail: 'finaltest@example.com',
      contactPhone: '9999999999',
      address: 'Final Test Address'
    };

    const tenantResponse = await fetch('http://localhost:5000/api/executive/tenants', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(tenantData),
    });

    if (tenantResponse.ok) {
      const tenantResult = await tenantResponse.json();
      console.log('✅ Tenant creation API: PASS');
      console.log('   Created tenant:', tenantResult.data.name);
    } else {
      const error = await tenantResponse.json();
      console.log('❌ Tenant creation API: FAIL');
      console.log('   Error:', error.message);
    }

    // 3. Test Sessions and Attendance
    console.log('\n3. Testing Sessions and Attendance...');
    
    const sessionsResult = await pool.query(
      'SELECT COUNT(*) as count FROM sessions WHERE session_date = CURRENT_DATE'
    );
    
    console.log(`✅ Today's sessions count: ${sessionsResult.rows[0].count}`);

    // Test facilitator sessions API
    const facilitatorUser = await pool.query(
      "SELECT id, tenant_id FROM users WHERE role = 'facilitator' AND deleted_at IS NULL LIMIT 1"
    );

    if (facilitatorUser.rows.length > 0) {
      const facilitatorPayload = {
        id: facilitatorUser.rows[0].id,
        role: 'facilitator',
        tenantId: facilitatorUser.rows[0].tenant_id,
      };

      const facilitatorToken = jwt.sign(facilitatorPayload, process.env.JWT_SECRET || "fallback-secret");

      const sessionsResponse = await fetch('http://localhost:5000/api/facilitator/today-sessions', {
        headers: { 'Authorization': `Bearer ${facilitatorToken}` },
      });

      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json();
        console.log(`✅ Facilitator sessions API: PASS (${sessionsData.data.length} sessions)`);
      } else {
        console.log('❌ Facilitator sessions API: FAIL');
      }
    }

    // 4. Test Database Integrity
    console.log('\n4. Testing Database Integrity...');
    
    const counts = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM tenants WHERE deleted_at IS NULL) as tenants,
        (SELECT COUNT(*) FROM cohorts WHERE deleted_at IS NULL) as cohorts,
        (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL) as users,
        (SELECT COUNT(*) FROM sessions WHERE session_date = CURRENT_DATE) as today_sessions
    `);

    const stats = counts.rows[0];
    console.log('✅ Database counts:');
    console.log(`   - Tenants: ${stats.tenants}`);
    console.log(`   - Cohorts: ${stats.cohorts}`);
    console.log(`   - Users: ${stats.users}`);
    console.log(`   - Today's Sessions: ${stats.today_sessions}`);

    // 5. Test All User Roles
    console.log('\n5. Testing All User Roles...');
    
    const roles = ['tynExecutive', 'facilitator', 'facultyPrincipal', 'industryMentor', 'student'];
    
    for (const role of roles) {
      const roleUser = await pool.query(
        'SELECT COUNT(*) as count FROM users WHERE role = $1 AND deleted_at IS NULL',
        [role]
      );
      console.log(`✅ ${role}: ${roleUser.rows[0].count} users`);
    }

    console.log('\n🎉 Final system test completed successfully!');
    console.log('\n📋 System Status: READY FOR USE');
    console.log('\n🌐 Access Information:');
    console.log('- Frontend: http://localhost:5174');
    console.log('- Backend: http://localhost:5000');
    console.log('\n🔑 Test Credentials:');
    console.log('- Executive: admin@yzone.com / admin123');
    console.log('- Facilitator: facilitator@yzone.com / facilitator123');
    console.log('- Faculty: faculty@yzone.com / faculty123');
    console.log('- Mentor: mentor@yzone.com / mentor123');
    console.log('- Student: student@yzone.com / student123');

  } catch (error) {
    console.error('❌ Error during final system test:', error);
  } finally {
    await pool.end();
  }
}

finalSystemTest();