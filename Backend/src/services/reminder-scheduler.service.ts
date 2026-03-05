import { pool } from '../config/db';
import logger from '../config/logger';
import { TwilioWhatsAppService } from './twilio-whatsapp.service';
import { StudentValidationService, StudentTrackerStatus } from './student-validation.service';

export interface ReminderLog {
  id?: string;
  student_id: string;
  student_name: string;
  phone_number: string;
  message_sent: boolean;
  message_id?: string;
  error_message?: string;
  sent_at: Date;
}

export class ReminderSchedulerService {
  /**
   * Send tracker reminders to all students who haven't submitted today
   * @returns Summary of reminder sending operation
   */
  static async sendDailyTrackerReminders(): Promise<{
    total_students: number;
    reminders_sent: number;
    reminders_failed: number;
    students_without_numbers: number;
    logs: ReminderLog[];
  }> {
    logger.info('Starting daily tracker reminder job...');

    try {
      // Check if Twilio is configured
      if (!TwilioWhatsAppService.isConfigured()) {
        logger.warn('Twilio not configured. Skipping reminder job.');
        return {
          total_students: 0,
          reminders_sent: 0,
          reminders_failed: 0,
          students_without_numbers: 0,
          logs: []
        };
      }

      // Get students without today's tracker
      const allStudents = await StudentValidationService.getStudentsWithoutTodayTracker();
      
      // Filter students with valid WhatsApp numbers
      const studentsWithNumbers = StudentValidationService.filterStudentsWithValidNumbers(allStudents);
      const studentsWithoutNumbers = allStudents.length - studentsWithNumbers.length;

      logger.info(`Total students without tracker: ${allStudents.length}`);
      logger.info(`Students with valid numbers: ${studentsWithNumbers.length}`);
      logger.info(`Students without valid numbers: ${studentsWithoutNumbers}`);

      // Check if reminders already sent today
      const alreadySent = await this.getRemindersAlreadySentToday(
        studentsWithNumbers.map(s => s.id)
      );

      // Filter out students who already received reminder today
      const studentsToRemind = studentsWithNumbers.filter(
        student => !alreadySent.includes(student.id)
      );

      logger.info(`Students to remind (excluding already sent): ${studentsToRemind.length}`);

      if (studentsToRemind.length === 0) {
        logger.info('No students to remind. Job completed.');
        return {
          total_students: allStudents.length,
          reminders_sent: 0,
          reminders_failed: 0,
          students_without_numbers: studentsWithoutNumbers,
          logs: []
        };
      }

      // Send reminders
      const logs: ReminderLog[] = [];
      let successCount = 0;
      let failureCount = 0;

      for (const student of studentsToRemind) {
        const whatsappNumber = StudentValidationService.getWhatsAppNumber(student);
        
        if (!whatsappNumber) {
          continue;
        }

        // Send reminder
        const response = await TwilioWhatsAppService.sendTrackerReminder(
          student.name,
          whatsappNumber
        );

        // Create log entry
        const log: ReminderLog = {
          student_id: student.id,
          student_name: student.name,
          phone_number: whatsappNumber,
          message_sent: response.success,
          message_id: response.messageId,
          error_message: response.error,
          sent_at: response.timestamp
        };

        logs.push(log);

        // Save to database
        await this.saveReminderLog(log);

        if (response.success) {
          successCount++;
          logger.info(`✓ Reminder sent to ${student.name} (${whatsappNumber})`);
        } else {
          failureCount++;
          logger.error(`✗ Failed to send reminder to ${student.name}: ${response.error}`);
        }

        // Add delay to avoid rate limiting (1 second between messages)
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      logger.info(`Reminder job completed. Sent: ${successCount}, Failed: ${failureCount}`);

      return {
        total_students: allStudents.length,
        reminders_sent: successCount,
        reminders_failed: failureCount,
        students_without_numbers: studentsWithoutNumbers,
        logs
      };
    } catch (error) {
      logger.error('Error in daily tracker reminder job:', error);
      throw error;
    }
  }

  /**
   * Get student IDs who already received reminder today
   * @param studentIds - Array of student IDs to check
   * @returns Array of student IDs who already received reminder
   */
  private static async getRemindersAlreadySentToday(
    studentIds: string[]
  ): Promise<string[]> {
    if (studentIds.length === 0) {
      return [];
    }

    try {
      const query = `
        SELECT DISTINCT student_id
        FROM tracker_reminders
        WHERE student_id = ANY($1)
          AND DATE(sent_at) = CURRENT_DATE
          AND message_sent = true
      `;

      const result = await pool.query(query, [studentIds]);
      return result.rows.map(row => row.student_id);
    } catch (error) {
      logger.error('Error checking already sent reminders:', error);
      return [];
    }
  }

  /**
   * Save reminder log to database
   * @param log - Reminder log entry
   */
  private static async saveReminderLog(log: ReminderLog): Promise<void> {
    try {
      // Create tracker_reminders table if not exists
      await this.ensureReminderTableExists();

      const query = `
        INSERT INTO tracker_reminders (
          student_id,
          student_name,
          phone_number,
          message_sent,
          message_id,
          error_message,
          sent_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;

      await pool.query(query, [
        log.student_id,
        log.student_name,
        log.phone_number,
        log.message_sent,
        log.message_id || null,
        log.error_message || null,
        log.sent_at
      ]);
    } catch (error) {
      logger.error('Error saving reminder log:', error);
      // Don't throw - we don't want to stop the reminder process if logging fails
    }
  }

  /**
   * Ensure tracker_reminders table exists
   */
  private static async ensureReminderTableExists(): Promise<void> {
    try {
      const query = `
        CREATE TABLE IF NOT EXISTS tracker_reminders (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          student_name VARCHAR(255) NOT NULL,
          phone_number VARCHAR(20) NOT NULL,
          message_sent BOOLEAN NOT NULL DEFAULT false,
          message_id VARCHAR(255),
          error_message TEXT,
          sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_tracker_reminders_student 
          ON tracker_reminders(student_id);
        
        CREATE INDEX IF NOT EXISTS idx_tracker_reminders_sent_at 
          ON tracker_reminders(sent_at);
      `;

      await pool.query(query);
    } catch (error) {
      logger.error('Error creating tracker_reminders table:', error);
    }
  }

  /**
   * Get reminder statistics for today
   * @returns Today's reminder statistics
   */
  static async getTodayReminderStats(): Promise<{
    total_reminders_sent: number;
    successful: number;
    failed: number;
    success_rate: number;
  }> {
    try {
      await this.ensureReminderTableExists();

      const query = `
        SELECT 
          COUNT(*) as total_reminders_sent,
          COUNT(CASE WHEN message_sent = true THEN 1 END) as successful,
          COUNT(CASE WHEN message_sent = false THEN 1 END) as failed
        FROM tracker_reminders
        WHERE DATE(sent_at) = CURRENT_DATE
      `;

      const result = await pool.query(query);
      const stats = result.rows[0];

      const successRate = stats.total_reminders_sent > 0
        ? (stats.successful / stats.total_reminders_sent) * 100
        : 0;

      return {
        total_reminders_sent: parseInt(stats.total_reminders_sent),
        successful: parseInt(stats.successful),
        failed: parseInt(stats.failed),
        success_rate: Math.round(successRate * 100) / 100
      };
    } catch (error) {
      logger.error('Error fetching reminder stats:', error);
      throw error;
    }
  }

  /**
   * Get reminder history for a student
   * @param studentId - Student ID
   * @param limit - Number of records to fetch
   * @returns Array of reminder logs
   */
  static async getStudentReminderHistory(
    studentId: string,
    limit: number = 10
  ): Promise<ReminderLog[]> {
    try {
      await this.ensureReminderTableExists();

      const query = `
        SELECT *
        FROM tracker_reminders
        WHERE student_id = $1
        ORDER BY sent_at DESC
        LIMIT $2
      `;

      const result = await pool.query(query, [studentId, limit]);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching student reminder history:', error);
      throw error;
    }
  }
}
