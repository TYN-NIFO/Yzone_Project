import bcrypt from 'bcryptjs';
import { pool } from '../src/config/db';

async function createAdmin() {
  try {
    // Hash the password
    const password = 'admin123';
    const passwordHash = await bcrypt.hash(password, 10);
    
    console.log('Password hash:', passwordHash);
    
    // Get tenant
    const tenantResult = await pool.query(
      "SELECT id FROM tenants WHERE institution_code = 'TECH001' LIMIT 1"
    );
    
    let tenantId;
    if (tenantResult.rows.length === 0) {
      // Create tenant
      const newTenant = await pool.query(
        `INSERT INTO tenants (name, institution_code, contact_email, contact_phone)
         VALUES ('Tech University', 'TECH001', 'admin@techuni.edu', '+1234567890')
         RETURNING id`
      );
      tenantId = newTenant.rows[0].id;
      console.log('Created tenant:', tenantId);
    } else {
      tenantId = tenantResult.rows[0].id;
      console.log('Using existing tenant:', tenantId);
    }
    
    // Check if admin exists
    const existingAdmin = await pool.query(
      "SELECT id FROM users WHERE email = 'admin@yzone.com'"
    );
    
    if (existingAdmin.rows.length > 0) {
      // Update existing admin
      await pool.query(
        `UPDATE users 
         SET password_hash = $1, 
             name = 'Admin Executive',
             role = 'tynExecutive',
             is_active = true,
             deleted_at = NULL
         WHERE email = 'admin@yzone.com'`,
        [passwordHash]
      );
      console.log('✅ Admin user updated successfully!');
    } else {
      // Create new admin
      await pool.query(
        `INSERT INTO users (tenant_id, name, email, password_hash, role, phone, whatsapp_number)
         VALUES ($1, 'Admin Executive', 'admin@yzone.com', $2, 'tynExecutive', '+1234567890', '+1234567890')`,
        [tenantId, passwordHash]
      );
      console.log('✅ Admin user created successfully!');
    }
    
    console.log('\nAdmin Credentials:');
    console.log('Email: admin@yzone.com');
    console.log('Password: admin123');
    console.log('Role: tynExecutive');
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createAdmin();
