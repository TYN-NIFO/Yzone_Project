import { pool } from '../src/config/db';
import { TwilioWhatsAppService } from '../src/services/twilio-whatsapp.service';

async function sendToAll() {
  const result = await pool.query(
    `SELECT id, name, phone, whatsapp_number 
     FROM users 
     WHERE role = 'student' AND is_active = true AND deleted_at IS NULL
     ORDER BY name`
  );

  const students = result.rows;
  console.log(`Found ${students.length} students\n`);

  let sent = 0, failed = 0, skipped = 0;

  for (const student of students) {
    let number = student.whatsapp_number || student.phone;
    if (!number) {
      console.log(`⚠️  SKIP  ${student.name} — no phone number`);
      skipped++;
      continue;
    }

    // Auto-prefix +91 if no country code
    if (!number.startsWith('+')) number = `+91${number}`;

    const message = `Hi ${student.name}, this is a reminder from Yzone to fill your daily tracker. Please log in and submit today's entry. Thank you!`;
    const res = await TwilioWhatsAppService.sendMessage(number, message);

    if (res.success) {
      console.log(`✅ SENT  ${student.name} → ${number}`);
      sent++;
    } else {
      console.log(`❌ FAIL  ${student.name} → ${number} | ${res.error}`);
      failed++;
    }

    // small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\n=== DONE ===`);
  console.log(`Sent: ${sent} | Failed: ${failed} | Skipped (no number): ${skipped}`);
  await pool.end();
}

sendToAll().catch(console.error);
