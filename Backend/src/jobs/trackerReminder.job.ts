import cron from "node-cron";
import { pool } from "../config/db";
import { sendWhatsAppMessage } from "../config/whatsapp";
import { getStudentsWhoMissedToday } from "../modules/student/services/tracker.service";

export const startTrackerReminderJob = (): void => {
    // Run every day at 10:00 PM (22:00)
    cron.schedule("0 22 * * *", async () => {
        console.log("⏰ [Cron] Tracker reminder job started");

        try {
            const missedStudents = await getStudentsWhoMissedToday();

            for (const student of missedStudents) {
                if (!student.phone) continue;

                // Send WhatsApp reminder to student
                const studentMsg = `Hi ${student.name} 👋,\n\nYou haven't submitted your daily tracker today. Please submit it now to keep up your streak!\n\n🔗 Access your dashboard and submit your tracker entry.\n\n- Yzone Team`;

                try {
                    const response = await sendWhatsAppMessage(student.phone, studentMsg);

                    await pool.query(
                        `INSERT INTO whatsapp_logs (student_id, tenant_id, phone, message, message_status, delivery_response)
             VALUES ($1,$2,$3,$4,$5,$6)`,
                        [student.id, student.tenant_id, student.phone, studentMsg, "SENT", JSON.stringify(response)]
                    );

                    // Insert notification
                    await pool.query(
                        `INSERT INTO notifications (user_id, tenant_id, type, title, message)
             VALUES ($1,$2,'TRACKER_REMINDER','Tracker Reminder',$3)`,
                        [student.id, student.tenant_id, "Please submit your daily tracker!"]
                    );

                    // Check consecutive missed days for escalation
                    const missedDays = student.missed_days || 0;

                    if (missedDays >= 5) {
                        // Notify assigned industry mentor
                        const mentorResult = await pool.query(
                            `SELECT u.phone, u.name, u.id FROM mentor_assignments ma
               JOIN users u ON u.id = ma.mentor_id
               WHERE ma.student_id = $1`,
                            [student.id]
                        );

                        for (const mentor of mentorResult.rows) {
                            if (!mentor.phone) continue;
                            const mentorMsg = `📢 Yzone Alert: ${student.name} has missed tracker submissions for ${missedDays} consecutive days. Please follow up with them.`;
                            await sendWhatsAppMessage(mentor.phone, mentorMsg);
                            await pool.query(
                                `INSERT INTO notifications (user_id, tenant_id, type, title, message)
                 VALUES ($1,$2,'WHATSAPP_ALERT','Student Missed Tracker - 5+ Days',$3)`,
                                [mentor.id, student.tenant_id, `${student.name} has missed ${missedDays} days`]
                            );
                        }
                    } else if (missedDays >= 3) {
                        // Notify assigned facilitator
                        const facResult = await pool.query(
                            `SELECT u.phone, u.name, u.id FROM facilitator_cohorts fc
               JOIN users u ON u.id = fc.facilitator_id
               WHERE fc.cohort_id = $1`,
                            [student.cohort_id]
                        );

                        for (const facilitator of facResult.rows) {
                            if (!facilitator.phone) continue;
                            const facMsg = `📢 Yzone Alert: ${student.name} has missed tracker submissions for ${missedDays} consecutive days.`;
                            await sendWhatsAppMessage(facilitator.phone, facMsg);
                            await pool.query(
                                `INSERT INTO notifications (user_id, tenant_id, type, title, message)
                 VALUES ($1,$2,'WHATSAPP_ALERT','Student Missed Tracker - 3+ Days',$3)`,
                                [facilitator.id, student.tenant_id, `${student.name} has missed ${missedDays} days`]
                            );
                        }
                    }
                } catch (sendErr) {
                    console.error(`Failed to send WhatsApp to ${student.phone}:`, sendErr);
                }
            }

            console.log(`✅ [Cron] Sent reminders to ${missedStudents.length} students`);
        } catch (err) {
            console.error("❌ [Cron] Tracker reminder job failed:", err);
        }
    }, {
        timezone: "Asia/Kolkata",
    });

    console.log("✅ Tracker reminder cron job scheduled (10:00 PM IST daily)");
};

export const startLeaderboardRecalcJob = (): void => {
    // Run every day at midnight
    cron.schedule("0 0 * * *", async () => {
        const { recalculateLeaderboard } = await import("../modules/leaderboard/leaderboard.service");
        await recalculateLeaderboard();
    }, { timezone: "Asia/Kolkata" });

    console.log("✅ Leaderboard recalculation cron scheduled (midnight IST daily)");
};
