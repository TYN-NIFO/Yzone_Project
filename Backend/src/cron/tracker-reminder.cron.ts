import cron from "node-cron";
import { pool } from "../config/db";
import { WhatsAppService } from "../services/whatsapp.service";
import { LeaderboardService } from "../services/leaderboard.service";

const whatsappService = new WhatsAppService();
const leaderboardService = new LeaderboardService();

export function startTrackerReminderCron() {
  const cronExpression = process.env.CRON_TRACKER_REMINDER || "0 22 * * *";

  cron.schedule(cronExpression, async () => {
    console.log("Running tracker reminder cron job at", new Date());

    try {
      const studentsResult = await pool.query(`
        SELECT u.id, u.name, u.email, u.whatsapp_number, u.tenant_id, u.cohort_id
        FROM users u
        WHERE u.role = 'student' 
          AND u.is_active = true
          AND u.deleted_at IS NULL
          AND u.whatsapp_number IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM tracker_entries te 
            WHERE te.student_id = u.id 
              AND te.entry_date = CURRENT_DATE
          )
      `);

      const students = studentsResult.rows;
      console.log(`Found ${students.length} students without today's tracker`);

      await whatsappService.sendBulkReminders(students);

      for (const student of students) {
        await pool.query(
          `INSERT INTO notifications (user_id, tenant_id, type, title, message)
           VALUES ($1, $2, 'tracker_reminder', 'Tracker Reminder', 'Please submit your daily tracker for today')`,
          [student.id, student.tenant_id]
        );
      }

      const missedStudents = await pool.query(`
        SELECT DISTINCT u.id, u.name, u.cohort_id, u.tenant_id, f.id as facilitator_id, f.whatsapp_number as facilitator_phone
        FROM users u
        JOIN cohorts c ON u.cohort_id = c.id
        JOIN users f ON c.facilitator_id = f.id
        WHERE u.role = 'student'
          AND u.is_active = true
          AND u.deleted_at IS NULL
          AND (
            SELECT COUNT(*) FROM tracker_entries te 
            WHERE te.student_id = u.id 
              AND te.entry_date >= CURRENT_DATE - INTERVAL '3 days'
          ) = 0
      `);

      for (const student of missedStudents.rows) {
        if (student.facilitator_phone) {
          await whatsappService.sendMessage(
            student.facilitator_phone,
            `Alert: Student ${student.name} has not submitted tracker for 3 consecutive days.`,
            student.facilitator_id,
            student.tenant_id,
            "facilitator_alert"
          );
        }
      }

      const mentorAlerts = await pool.query(`
        SELECT DISTINCT u.id, u.name, ma.mentor_id, m.whatsapp_number as mentor_phone, u.tenant_id
        FROM users u
        JOIN mentor_assignments ma ON u.id = ma.student_id
        JOIN users m ON ma.mentor_id = m.id
        WHERE u.role = 'student'
          AND u.is_active = true
          AND u.deleted_at IS NULL
          AND ma.is_active = true
          AND (
            SELECT COUNT(*) FROM tracker_entries te 
            WHERE te.student_id = u.id 
              AND te.entry_date >= CURRENT_DATE - INTERVAL '5 days'
          ) = 0
      `);

      for (const student of mentorAlerts.rows) {
        if (student.mentor_phone) {
          await whatsappService.sendMessage(
            student.mentor_phone,
            `Alert: Your mentee ${student.name} has not submitted tracker for 5 consecutive days.`,
            student.mentor_id,
            student.tenant_id,
            "mentor_alert"
          );
        }
      }

      console.log("Tracker reminder cron job completed successfully");
    } catch (error) {
      console.error("Error in tracker reminder cron job:", error);
    }
  });

  console.log(`Tracker reminder cron job scheduled: ${cronExpression}`);
}

export function startLeaderboardCalculationCron() {
  cron.schedule("0 0 * * *", async () => {
    console.log("Running leaderboard calculation at", new Date());

    try {
      const cohorts = await pool.query(`
        SELECT id, tenant_id FROM cohorts WHERE is_active = true AND deleted_at IS NULL
      `);

      for (const cohort of cohorts.rows) {
        await leaderboardService.calculateLeaderboard(cohort.id, cohort.tenant_id);
      }

      console.log("Leaderboard calculation completed successfully");
    } catch (error) {
      console.error("Error in leaderboard calculation:", error);
    }
  });

  console.log("Leaderboard calculation cron job scheduled: Daily at midnight");
}
