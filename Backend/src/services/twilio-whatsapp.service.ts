import twilio from 'twilio';
import dotenv from 'dotenv';
import logger from '../config/logger';

dotenv.config();

// Twilio Configuration
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER;

// Validate Twilio credentials are real (not placeholders)
const isValidTwilioConfig = 
  TWILIO_ACCOUNT_SID && 
  TWILIO_AUTH_TOKEN && 
  TWILIO_WHATSAPP_NUMBER &&
  TWILIO_ACCOUNT_SID.startsWith('AC') && // Twilio Account SID must start with AC
  !TWILIO_ACCOUNT_SID.includes('your_') && // Not a placeholder
  !TWILIO_AUTH_TOKEN.includes('your_'); // Not a placeholder

if (!isValidTwilioConfig) {
  logger.warn('Twilio WhatsApp credentials not properly configured. WhatsApp reminders will be disabled.');
  logger.warn('To enable WhatsApp reminders, configure valid Twilio credentials in .env file');
}

// Initialize Twilio client only with valid credentials
const twilioClient = isValidTwilioConfig
  ? twilio(TWILIO_ACCOUNT_SID!, TWILIO_AUTH_TOKEN!)
  : null;

export interface WhatsAppMessage {
  to: string;
  body: string;
}

export interface WhatsAppResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp: Date;
}

export class TwilioWhatsAppService {
  /**
   * Send WhatsApp message via Twilio
   * @param to - Recipient phone number with country code (e.g., +911234567890)
   * @param body - Message content
   * @returns WhatsAppResponse with success status and message ID
   */
  static async sendMessage(to: string, body: string): Promise<WhatsAppResponse> {
    const timestamp = new Date();

    // Check if Twilio is configured
    if (!twilioClient || !TWILIO_WHATSAPP_NUMBER) {
      logger.warn('Twilio not configured. Skipping WhatsApp message.');
      return {
        success: false,
        error: 'Twilio WhatsApp service not configured',
        timestamp
      };
    }

    // Validate phone number format
    if (!to.startsWith('+')) {
      logger.error(`Invalid phone number format: ${to}. Must start with +`);
      return {
        success: false,
        error: 'Invalid phone number format. Must include country code with +',
        timestamp
      };
    }

    try {
      // Send message via Twilio
      const message = await twilioClient.messages.create({
        from: `whatsapp:${TWILIO_WHATSAPP_NUMBER}`,
        to: `whatsapp:${to}`,
        body: body
      });

      logger.info(`WhatsApp message sent successfully to ${to}. SID: ${message.sid}`);

      return {
        success: true,
        messageId: message.sid,
        timestamp
      };
    } catch (error: any) {
      logger.error(`Failed to send WhatsApp message to ${to}:`, error);

      return {
        success: false,
        error: error.message || 'Unknown error occurred',
        timestamp
      };
    }
  }

  /**
   * Send tracker reminder to student
   * @param studentName - Student's name
   * @param phoneNumber - Student's WhatsApp number
   * @returns WhatsAppResponse
   */
  static async sendTrackerReminder(
    studentName: string, 
    phoneNumber: string
  ): Promise<WhatsAppResponse> {
    const message = `Hi ${studentName}, you have not submitted your daily tracker today. Please submit it before 11:59 PM to avoid being marked absent.`;
    
    return this.sendMessage(phoneNumber, message);
  }

  /**
   * Send custom reminder message
   * @param studentName - Student's name
   * @param phoneNumber - Student's WhatsApp number
   * @param customMessage - Custom message template
   * @returns WhatsAppResponse
   */
  static async sendCustomReminder(
    studentName: string,
    phoneNumber: string,
    customMessage: string
  ): Promise<WhatsAppResponse> {
    const message = customMessage.replace('{student_name}', studentName);
    
    return this.sendMessage(phoneNumber, message);
  }

  /**
   * Send bulk messages (with rate limiting)
   * @param messages - Array of WhatsApp messages
   * @param delayMs - Delay between messages in milliseconds (default: 1000ms)
   * @returns Array of WhatsAppResponse
   */
  static async sendBulkMessages(
    messages: WhatsAppMessage[],
    delayMs: number = 1000
  ): Promise<WhatsAppResponse[]> {
    const responses: WhatsAppResponse[] = [];

    for (const msg of messages) {
      const response = await this.sendMessage(msg.to, msg.body);
      responses.push(response);

      // Add delay to avoid rate limiting
      if (delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    return responses;
  }

  /**
   * Check if Twilio is properly configured
   * @returns boolean
   */
  static isConfigured(): boolean {
    return !!(twilioClient && TWILIO_WHATSAPP_NUMBER);
  }
}
