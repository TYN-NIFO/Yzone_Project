import * as jwt from 'jsonwebtoken';
import { pool } from '../src/config/db';

async function testApiCall() {
  try {
    console.log('Testing API call...');

    // Get the tynExecutive user
    const userResult = await pool.query(
      "SELECT id, name, email, role, tenant_id FROM users WHERE role = 'tynExecutive' AND deleted_at IS NULL LIMIT 1"
    );

    if (userResult.rows.length === 0) {
      console.log('❌ No tynExecutive user found');
      return;
    }

    const user = userResult.rows[0];
    console.log('✅ Found user:', user);

    // Create a JWT token
    const payload = {
      id: user.id,
      role: user.role,
      tenantId: user.tenant_id,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || "fallback-secret");
    console.log('✅ Generated token');

    // Make API call to create tenant
    const tenantData = {
      name: 'API Test Tenant',
      institutionCode: 'API001',
      contactEmail: 'apitest@example.com',
      contactPhone: '9876543210',
      address: 'API Test Address'
    };

    const response = await fetch('http://localhost:5000/api/executive/tenants', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(tenantData),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const responseData = await response.json();
    console.log('Response data:', responseData);

    if (response.ok) {
      console.log('✅ Tenant created successfully via API');
    } else {
      console.log('❌ API call failed:', responseData);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

testApiCall();