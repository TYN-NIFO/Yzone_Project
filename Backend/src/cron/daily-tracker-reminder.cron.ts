import cron from 'node-cron';
import logger from '../config/logger';
import { ReminderSchedulerService } from '../services/reminder-scheduler.service';
import { StudentValidationService } from '../services/student-validation.service';

/**
 * Daily Tracker Reminder Cron Job
 * Runs every day at 10:00 PM (22:00)
 * Sends WhatsApp reminders to students who haven't submitted their tracker
 */
export class DailyTrackerReminderCron {
  private static cronJob: any | null = null;

  /**
   * Start the cron job
   * Schedule: Every day at 10:00 PM (22:00)
   * Cron expression: '0 22 * * *'
   */
  static start(): void {
    // Stop existing job if running
    this.stop();

    logger.info('Initializing Daily Tracker Reminder Cron Job...');

    // Schedule: Run at 10:00 PM every day
    // Cron format: minute hour day month weekday
    // '0 22 * * *' = At 22:00 (10 PM) every day
    this.cronJob = cron.schedule('0 22 * * *', async () => {
      logger.info('='.repeat(60));
      logger.info('Daily Tracker Reminder Job Started');
      logger.info(`Execution Time: ${new Date().toLocaleString()}`);
      logger.info('='.repeat(60));

      try {
        // Get tracker statistics before sending reminders
        const statsBefore = await StudentValidationService.getTrackerStatistics();
        logger.info('Tracker Statistics:');
        logger.info(`  Total Students: ${statsBefore.total_students}`);
        logger.info(`  Submitted Today: ${statsBefore.submitted_today}`);
        logger.info(`  Not Submitted: ${statsBefore.not_submitted_today}`);
        logger.info(`  Submission Rate: ${statsBefore.submission_rate}%`);

        // Send reminders
        const result = await ReminderSchedulerService.sendDailyTrackerReminders();

        // Log results
        logger.info('-'.repeat(60));
        logger.info('Reminder Job Results:');
        logger.info(`  Total Students Without Tracker: ${result.total_students}`);
        logger.info(`  Reminders Sent Successfully: ${result.reminders_sent}`);
        logger.info(`  Reminders Failed: ${result.reminders_failed}`);
        logger.info(`  Students Without Valid Numbers: ${result.students_without_numbers}`);
        logger.info('-'.repeat(60));

        // Get reminder statistics
        const reminderStats = await ReminderSchedulerService.getTodayReminderStats();
        logger.info('Today\'s Reminder Statistics:');
        logger.info(`  Total Reminders: ${reminderStats.total_reminders_sent}`);
        logger.info(`  Successful: ${reminderStats.successful}`);
        logger.info(`  Failed: ${reminderStats.failed}`);
        logger.info(`  Success Rate: ${reminderStats.success_rate}%`);

        logger.info('='.repeat(60));
        logger.info('Daily Tracker Reminder Job Completed Successfully');
        logger.info('='.repeat(60));
      } catch (error) {
        logger.error('='.repeat(60));
        logger.error('Daily Tracker Reminder Job Failed');
        logger.error('Error:', error);
        logger.error('='.repeat(60));
      }
    });

    logger.info('✓ Daily Tracker Reminder Cron Job scheduled');
    logger.info('  Schedule: Every day at 10:00 PM (22:00)');
    logger.info('  Timezone: Asia/Kolkata');
    logger.info('  Next execution: ' + this.getNextExecutionTime());
  }

  /**
   * Stop the cron job
   */
  static stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      logger.info('Daily Tracker Reminder Cron Job stopped');
    }
  }

  /**
   * Check if cron job is running
   */
  static isRunning(): boolean {
    return this.cronJob !== null;
  }

  /**
   * Get next execution time
   */
  static getNextExecutionTime(): string {
    const now = new Date();
    const next = new Date(now);
    
    // Set to 10 PM today
    next.setHours(22, 0, 0, 0);
    
    // If 10 PM has passed, set to tomorrow
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }
    
    return next.toLocaleString();
  }

  /**
   * Run the job manually (for testing)
   */
  static async runManually(): Promise<void> {
    logger.info('Running Daily Tracker Reminder Job manually...');
    
    try {
      const result = await ReminderSchedulerService.sendDailyTrackerReminders();
      
      logger.info('Manual execution completed:');
      logger.info(`  Reminders sent: ${result.reminders_sent}`);
      logger.info(`  Reminders failed: ${result.reminders_failed}`);
      
      return;
    } catch (error) {
      logger.error('Manual execution failed:', error);
      throw error;
    }
  }
}

// Auto-start when module is imported (can be disabled if needed)
if (process.env.ENABLE_TRACKER_REMINDERS !== 'false') {
  DailyTrackerReminderCron.start();
  logger.info('Daily Tracker Reminder Cron Job auto-started');
}
