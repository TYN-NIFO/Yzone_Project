import dotenv from 'dotenv';
import { TwilioWhatsAppService } from '../src/services/twilio-whatsapp.service';
import logger from '../src/config/logger';

dotenv.config();

async function testWhatsAppNotification() {
  console.log('\n=== Testing WhatsApp Notification ===\n');

  // Check if Twilio is configured
  if (!TwilioWhatsAppService.isConfigured()) {
    console.error('❌ Twilio is not properly configured!');
    console.log('Please check your .env file for valid Twilio credentials.');
    return;
  }

  console.log('✅ Twilio is configured');

  // Test phone number - format: +[country_code][phone_number]
  // Example: +917550347147 (India) or +14155238886 (US)
  const testPhoneNumber = process.argv[2];

  if (!testPhoneNumber) {
    console.error('❌ Please provide a phone number as argument');
    console.log('Usage: npm run test:whatsapp +917550347147');
    console.log('Note: Phone number must include country code with + prefix');
    return;
  }

  if (!testPhoneNumber.startsWith('+')) {
    console.error('❌ Phone number must start with + and country code');
    console.log('Example: +917550347147 (India) or +14155238886 (US)');
    return;
  }

  console.log(`\n📱 Sending test message to: ${testPhoneNumber}`);

  try {
    // Send test tracker reminder
    const result = await TwilioWhatsAppService.sendTrackerReminder(
      'Test Student',
      testPhoneNumber
    );

    if (result.success) {
      console.log('\n✅ Message sent successfully!');
      console.log(`Message ID: ${result.messageId}`);
      console.log(`Timestamp: ${result.timestamp}`);
      console.log('\n📨 Message content:');
      console.log('Hi Test Student, you have not submitted your daily tracker today. Please submit it before 11:59 PM to avoid being marked absent.');
    } else {
      console.log('\n❌ Failed to send message');
      console.log(`Error: ${result.error}`);
    }
  } catch (error: any) {
    console.error('\n❌ Error occurred:', error.message);
  }

  console.log('\n=== Test Complete ===\n');
}

testWhatsAppNotification();
