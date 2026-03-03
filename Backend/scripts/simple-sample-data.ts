import { pool } from "../src/config/db";
import * as bcrypt from "bcryptjs";

async function createSimpleSampleData() {
  try {
    console.log("🚀 Creating simple sample data...");

    // Get existing tenant and cohort
    const tenantResult = await pool.query("SELECT id FROM tenants LIMIT 1");
    const cohortResult = await pool.query("SELECT id FROM cohorts LIMIT 1");
    
    if (tenantResult.rows.length === 0 || cohortResult.rows.length === 0) {
      console.log("❌ No tenant or cohort found. Please create them first.");
      return;
    }

    const tenantId = tenantResult.rows[0].id;
    const cohortId = cohortResult.rows[0].id;

    // Create additional students
    const additionalStudents = [
      { name: "Alice Johnson", email: "alice@yzone.com" },
      { name: "Bob Smith", email: "bob@yzone.com" },
      { name: "Carol Davis", email: "carol@yzone.com" },
      { name: "David Wilson", email: "david@yzone.com" },
      { name: "Eva Brown", email: "eva@yzone.com" },
    ];

    const hashedPassword = await bcrypt.hash("student123", 10);

    for (const student of additionalStudents) {
      await pool.query(
        `INSERT INTO users (tenant_id, cohort_id, name, email, password_hash, role, is_active)
         VALUES ($1, $2, $3, $4, $5, 'student', true)
         ON CONFLICT (tenant_id, email) DO NOTHING`,
        [tenantId, cohortId, student.name, student.email, hashedPassword]
      );
    }

    console.log("✅ Additional students created");

    // Get all students
    const studentsResult = await pool.query(
      "SELECT id, name FROM users WHERE role = 'student' AND tenant_id = $1",
      [tenantId]
    );
    const students = studentsResult.rows;

    // Create sample tracker entries for the last 5 days
    const today = new Date();
    for (let i = 0; i < 5; i++) {
      const entryDate = new Date(today);
      entryDate.setDate(today.getDate() - i);
      
      for (const student of students.slice(0, Math.floor(Math.random() * students.length) + 2)) {
        const tasks = [
          "Completed React components tutorial",
          "Built responsive navigation bar", 
          "Implemented user authentication",
          "Created database schema",
          "Fixed CSS styling issues"
        ];
        
        const learnings = [
          "Learned about React hooks and state management",
          "Understanding of responsive design principles",
          "JWT authentication implementation",
          "Database relationships and normalization",
          "CSS Grid and Flexbox layouts"
        ];

        await pool.query(
          `INSERT INTO tracker_entries (student_id, tenant_id, cohort_id, entry_date, tasks_completed, learning_summary, hours_spent, challenges)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (student_id, entry_date) DO NOTHING`,
          [
            student.id,
            tenantId,
            cohortId,
            entryDate.toISOString().split('T')[0],
            tasks[Math.floor(Math.random() * tasks.length)],
            learnings[Math.floor(Math.random() * learnings.length)],
            Math.floor(Math.random() * 6) + 3, // 3-8 hours
            Math.random() > 0.5 ? "Some minor challenges with syntax" : null
          ]
        );
      }
    }

    console.log("✅ Sample tracker entries created");

    // Create sample notifications
    for (const student of students.slice(0, 3)) {
      await pool.query(
        `INSERT INTO notifications (user_id, tenant_id, type, title, message, is_read)
         VALUES ($1, $2, 'tracker_reminder', 'Daily Tracker Reminder', 'Don''t forget to submit your daily tracker!', false),
                ($1, $2, 'system_alert', 'Welcome!', 'Welcome to the YZone platform!', true)
         ON CONFLICT DO NOTHING`,
        [student.id, tenantId]
      );
    }

    console.log("✅ Sample notifications created");

    // Simple leaderboard calculation
    await pool.query(`
      INSERT INTO leaderboard (student_id, tenant_id, cohort_id, rank, total_score, tracker_consistency_score, performance_score, attendance_score, mentor_rating_score, calculated_at)
      SELECT 
        u.id,
        u.tenant_id,
        u.cohort_id,
        ROW_NUMBER() OVER (PARTITION BY u.cohort_id ORDER BY 
          COALESCE((SELECT COUNT(*) * 20.0 FROM tracker_entries WHERE student_id = u.id AND entry_date >= CURRENT_DATE - INTERVAL '7 days'), 0) +
          COALESCE((SELECT AVG(hours_spent) * 10 FROM tracker_entries WHERE student_id = u.id), 0) + 45.0 DESC
        ) as rank,
        COALESCE((SELECT COUNT(*) * 20.0 FROM tracker_entries WHERE student_id = u.id AND entry_date >= CURRENT_DATE - INTERVAL '7 days'), 0) +
        COALESCE((SELECT AVG(hours_spent) * 10 FROM tracker_entries WHERE student_id = u.id), 0) + 45.0 as total_score,
        COALESCE((SELECT COUNT(*) * 20.0 FROM tracker_entries WHERE student_id = u.id AND entry_date >= CURRENT_DATE - INTERVAL '7 days'), 0) as tracker_consistency_score,
        COALESCE((SELECT AVG(hours_spent) * 10 FROM tracker_entries WHERE student_id = u.id), 0) as performance_score,
        25.0 as attendance_score,
        20.0 as mentor_rating_score,
        CURRENT_TIMESTAMP
      FROM users u
      WHERE u.role = 'student' AND u.tenant_id = $1
      ON CONFLICT (cohort_id, student_id) DO UPDATE SET
        rank = EXCLUDED.rank,
        total_score = EXCLUDED.total_score,
        tracker_consistency_score = EXCLUDED.tracker_consistency_score,
        performance_score = EXCLUDED.performance_score,
        attendance_score = EXCLUDED.attendance_score,
        mentor_rating_score = EXCLUDED.mentor_rating_score,
        calculated_at = EXCLUDED.calculated_at,
        updated_at = CURRENT_TIMESTAMP
    `, [tenantId]);

    console.log("✅ Leaderboard calculated");

    console.log("🎉 Simple sample data creation completed successfully!");
    console.log("\n📊 Summary:");
    console.log("- Additional students created");
    console.log("- 5 days of tracker entries");
    console.log("- Sample notifications");
    console.log("- Updated leaderboard");

  } catch (error) {
    console.error("❌ Error creating sample data:", error);
  } finally {
    await pool.end();
  }
}

createSimpleSampleData();