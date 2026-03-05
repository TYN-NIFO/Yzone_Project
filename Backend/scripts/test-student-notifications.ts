import dotenv from 'dotenv';
import { TwilioWhatsAppService } from '../src/services/twilio-whatsapp.service';
import logger from '../src/config/logger';

dotenv.config();

async function testStudentNotifications() {
  console.log('\n=== Testing WhatsApp Notifications for Students ===\n');

  // Check if Twilio is configured
  if (!TwilioWhatsAppService.isConfigured()) {
    console.error('❌ Twilio is not properly configured!');
    console.log('Please check your .env file for valid Twilio credentials.');
    console.log('\nCurrent configuration:');
    console.log(`TWILIO_ACCOUNT_SID: ${process.env.TWILIO_ACCOUNT_SID?.substring(0, 10)}...`);
    console.log(`TWILIO_WHATSAPP_NUMBER: ${process.env.TWILIO_WHATSAPP_NUMBER}`);
    return;
  }

  console.log('✅ Twilio is configured');
  console.log(`Using WhatsApp number: ${process.env.TWILIO_WHATSAPP_NUMBER}\n`);

  // Test students with Indian country code (+91)
  const students = [
    { name: 'Student 1', phone: '+917550347147' },
    { name: 'Student 2', phone: '+919344795474' }
  ];

  console.log('📱 Sending notifications to students:\n');

  for (const student of students) {
    console.log(`\n--- Testing ${student.name} (${student.phone}) ---`);
    
    try {
      const result = await TwilioWhatsAppService.sendTrackerReminder(
        student.name,
        student.phone
      );

      if (result.success) {
        console.log('✅ Message sent successfully!');
        console.log(`   Message ID: ${result.messageId}`);
        console.log(`   Timestamp: ${result.timestamp}`);
      } else {
        console.log('❌ Failed to send message');
        console.log(`   Error: ${result.error}`);
      }
    } catch (error: any) {
      console.error('❌ Error occurred:', error.message);
    }

    // Add delay between messages to avoid rate limiting
    if (students.indexOf(student) < students.length - 1) {
      console.log('\n⏳ Waiting 2 seconds before next message...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log('\n\n=== Test Complete ===');
  console.log('\n📨 Message sent:');
  console.log('Hi [Student Name], you have not submitted your daily tracker today.');
  console.log('Please submit it before 11:59 PM to avoid being marked absent.\n');
  
  console.log('📝 Note: Students must have WhatsApp installed and connected to Twilio Sandbox');
  console.log('To connect to Twilio Sandbox, students should send:');
  console.log(`"join <sandbox-keyword>" to ${process.env.TWILIO_WHATSAPP_NUMBER}\n`);
}

testStudentNotifications();
