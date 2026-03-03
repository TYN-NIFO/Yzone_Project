import { pool } from '../src/config/db';
import * as jwt from 'jsonwebtoken';

async function testTenantCreation() {
  try {
    console.log('Testing tenant creation...');

    // First, let's check if we have a tynExecutive user
    const userResult = await pool.query(
      "SELECT id, name, email, role, tenant_id FROM users WHERE role = 'tynExecutive' AND deleted_at IS NULL LIMIT 1"
    );

    if (userResult.rows.length === 0) {
      console.log('❌ No tynExecutive user found');
      return;
    }

    const user = userResult.rows[0];
    console.log('✅ Found tynExecutive user:', user);

    // Create a JWT token for this user
    const payload = {
      id: user.id,
      role: user.role,
      tenantId: user.tenant_id,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || "fallback-secret");
    console.log('✅ Generated JWT token');

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret");
    console.log('✅ Token verification successful:', decoded);

    // Test tenant creation directly
    const tenantData = {
      name: 'Test Tenant from Script',
      institutionCode: 'TEST001',
      contactEmail: 'test@example.com',
      contactPhone: '1234567890',
      address: 'Test Address'
    };

    const tenantResult = await pool.query(
      `INSERT INTO tenants (name, institution_code, contact_email, contact_phone, address)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [tenantData.name, tenantData.institutionCode, tenantData.contactEmail, tenantData.contactPhone, tenantData.address]
    );

    console.log('✅ Tenant created successfully:', tenantResult.rows[0]);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

testTenantCreation();