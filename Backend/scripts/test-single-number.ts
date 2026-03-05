import dotenv from 'dotenv';
import { TwilioWhatsAppService } from '../src/services/twilio-whatsapp.service';

dotenv.config();

async function testSingleNumber() {
  const phoneNumber = '+917550347146';
  
  console.log('\n=== Sending WhatsApp Notification ===\n');
  console.log(`📱 Sending to: ${phoneNumber}\n`);

  try {
    const result = await TwilioWhatsAppService.sendTrackerReminder(
      'Student',
      phoneNumber
    );

    if (result.success) {
      console.log('✅ Message sent successfully!');
      console.log(`Message ID: ${result.messageId}`);
      console.log(`Timestamp: ${result.timestamp}`);
    } else {
      console.log('❌ Failed to send message');
      console.log(`Error: ${result.error}`);
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n=== Complete ===\n');
}

testSingleNumber();
