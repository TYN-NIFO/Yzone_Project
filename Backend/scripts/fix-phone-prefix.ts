import { pool } from '../src/config/db';

async function fix() {
  // Fix phone numbers
  const r1 = await pool.query(
    `UPDATE users 
     SET phone = '+91' || phone 
     WHERE phone IS NOT NULL AND phone != '' AND phone NOT LIKE '+%'
     RETURNING name, phone`
  );
  console.log(`Updated ${r1.rows.length} phone numbers:`);
  r1.rows.forEach(u => console.log(`  ${u.name} → ${u.phone}`));

  // Fix whatsapp numbers
  const r2 = await pool.query(
    `UPDATE users 
     SET whatsapp_number = '+91' || whatsapp_number 
     WHERE whatsapp_number IS NOT NULL AND whatsapp_number != '' AND whatsapp_number NOT LIKE '+%'
     RETURNING name, whatsapp_number`
  );
  console.log(`\nUpdated ${r2.rows.length} whatsapp numbers:`);
  r2.rows.forEach(u => console.log(`  ${u.name} → ${u.whatsapp_number}`));

  await pool.end();
}

fix().catch(console.error);
