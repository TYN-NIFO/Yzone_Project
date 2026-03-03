import axios from "axios";
import { pool } from "../config/db";

export class WhatsAppService {
  private apiUrl: string;
  private phoneNumberId: string;
  private accessToken: string;

  constructor() {
    this.apiUrl = process.env.WHATSAPP_API_URL || "";
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || "";
  }

  async sendMessage(phoneNumber: string, message: string, userId: string, tenantId: string, messageType: string = "tracker_reminder") {
    try {
      const response = await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: "whatsapp",
          to: phoneNumber,
          type: "text",
          text: { body: message },
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      await pool.query(
        `INSERT INTO whatsapp_logs (user_id, tenant_id, phone_number, message, message_type, message_status, whatsapp_message_id, delivery_response)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          userId,
          tenantId,
          phoneNumber,
          message,
          messageType,
          "sent",
          response.data.messages[0].id,
          JSON.stringify(response.data),
        ]
      );

      return response.data;
    } catch (error: any) {
      await pool.query(
        `INSERT INTO whatsapp_logs (user_id, tenant_id, phone_number, message, message_type, message_status, failed_reason)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [userId, tenantId, phoneNumber, message, messageType, "failed", error.message]
      );

      throw error;
    }
  }

  async sendTrackerReminder(userId: string, tenantId: string, phoneNumber: string, studentName: string) {
    const message = `Hi ${studentName}, this is a reminder to submit your daily tracker for today. Please complete it before end of day. - Yzone Team`;
    return await this.sendMessage(phoneNumber, message, userId, tenantId, "tracker_reminder");
  }

  async sendBulkReminders(students: any[]) {
    const results = [];
    for (const student of students) {
      try {
        await this.sendTrackerReminder(student.id, student.tenant_id, student.whatsapp_number, student.name);
        results.push({ studentId: student.id, status: "sent" });
      } catch (error) {
        results.push({ studentId: student.id, status: "failed" });
      }
    }
    return results;
  }
}
