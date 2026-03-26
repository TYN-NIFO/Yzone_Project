import { pool } from '../src/config/db';

async function check() {
  const r = await pool.query(
    `SELECT name, phone, whatsapp_number FROM users 
     WHERE deleted_at IS NULL AND (phone IS NOT NULL OR whatsapp_number IS NOT NULL) 
     ORDER BY name`
  );
  console.log(`Total users with phone/whatsapp: ${r.rows.length}\n`);
  r.rows.forEach(u => {
    const phoneOk = !u.phone || u.phone.startsWith('+');
    const waOk = !u.whatsapp_number || u.whatsapp_number.startsWith('+');
    const status = phoneOk && waOk ? '✅' : '❌';
    console.log(`${status} ${u.name.padEnd(25)} phone: ${(u.phone || '-').padEnd(15)} wa: ${u.whatsapp_number || '-'}`);
  });
  await pool.end();
}
check().catch(console.error);
