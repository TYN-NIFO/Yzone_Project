import { pool } from "../src/config/db";

async function populateAliceData() {
  try {
    console.log("🔄 Populating Alice's dashboard data...");

    const aliceId = "c5a751e9-cad0-430d-abfc-f29ec263a3cc";
    const cohortId = "2dd635a3-2d5a-493a-a770-2872b6a8e621";
    const tenantId = "cc05fc11-ee3b-407f-b5f9-00b857358a5e";

    // 1. Clean up duplicate leaderboard entries
    console.log("1️⃣ Cleaning leaderboard...");
    await pool.query(
      "DELETE FROM leaderboard WHERE student_id = $1",
      [aliceId]
    );

    // 2. Create proper leaderboard entry
    await pool.query(
      `INSERT INTO leaderboard (id, student_id, tenant_id, cohort_id, rank, total_score, 
       tracker_consistency_score, performance_score, attendance_score, mentor_rating_score)
       VALUES (gen_random_uuid(), $1, $2, $3, 2, 87.50, 22.00, 23.50, 20.00, 22.00)`,
      [aliceId, tenantId, cohortId]
    );
    console.log("✅ Leaderboard entry created");

    // 3. Add faculty feedback
    console.log("2️⃣ Adding faculty feedback...");
    const facultyResult = await pool.query(
      "SELECT id FROM users WHERE role = 'facultyPrincipal' AND tenant_id = $1 LIMIT 1",
      [tenantId]
    );

    if (facultyResult.rows.length > 0) {
      const facultyId = facultyResult.rows[0].id;
      
      await pool.query(
        `INSERT INTO faculty_feedback (id, faculty_id, student_id, tenant_id, cohort_id,
         academic_rating, behavior_rating, participation_rating, feedback, 
         academic_comments, behavior_comments, recommendations, feedback_date)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, 4, 5, 4,
         'Alice is showing excellent progress in her coursework. Her understanding of core concepts is strong.',
         'Consistently performs well in assignments and tests.',
         'Very professional and respectful in class.',
         'Continue the great work! Consider taking on more challenging projects.',
         CURRENT_DATE - INTERVAL '5 days')
         ON CONFLICT DO NOTHING`,
        [facultyId, aliceId, tenantId, cohortId]
      );
      console.log("✅ Faculty feedback added");
    }

    // 4. Ensure recent tracker entries exist
    console.log("3️⃣ Checking tracker entries...");
    const trackerCount = await pool.query(
      "SELECT COUNT(*) FROM tracker_entries WHERE student_id = $1 AND entry_date >= CURRENT_DATE - INTERVAL '7 days'",
      [aliceId]
    );

    if (parseInt(trackerCount.rows[0].count) < 5) {
      // Add recent tracker entries
      for (let i = 1; i <= 5; i++) {
        await pool.query(
          `INSERT INTO tracker_entries (id, student_id, tenant_id, cohort_id, entry_date,
           tasks_completed, learning_summary, hours_spent, challenges)
           VALUES (gen_random_uuid(), $1, $2, $3, CURRENT_DATE - INTERVAL '${i} days',
           'Completed React components and API integration',
           'Learned about state management and hooks in React. Implemented user authentication.',
           ${6 + i}, 'Had some issues with CORS but resolved them.')
           ON CONFLICT (student_id, entry_date) DO NOTHING`,
          [aliceId, tenantId, cohortId]
        );
      }
      console.log("✅ Recent tracker entries added");
    } else {
      console.log("✅ Tracker entries already exist");
    }

    // 5. Create top leaderboard entries for display
    console.log("4️⃣ Creating leaderboard rankings...");
    
    // Get other students in the cohort
    const studentsResult = await pool.query(
      `SELECT id, name FROM users 
       WHERE cohort_id = $1 AND role = 'student' AND id != $2 
       LIMIT 9`,
      [cohortId, aliceId]
    );

    // Delete existing leaderboard for this cohort
    await pool.query(
      "DELETE FROM leaderboard WHERE cohort_id = $1 AND student_id != $2",
      [cohortId, aliceId]
    );

    // Create top performers
    const topScores = [95.50, 87.50, 82.30, 78.90, 75.20, 72.10, 68.50, 65.30, 62.10];
    
    for (let i = 0; i < studentsResult.rows.length && i < topScores.length; i++) {
      const student = studentsResult.rows[i];
      const score = i === 1 ? 87.50 : topScores[i]; // Alice is rank 2
      const rank = i + 1;
      
      await pool.query(
        `INSERT INTO leaderboard (id, student_id, tenant_id, cohort_id, rank, total_score,
         tracker_consistency_score, performance_score, attendance_score, mentor_rating_score)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 
         ${score * 0.25}, ${score * 0.25}, ${score * 0.25}, ${score * 0.25})
         ON CONFLICT (cohort_id, student_id) DO UPDATE SET
         rank = $4, total_score = $5`,
        [student.id, tenantId, cohortId, rank, score]
      );
    }
    console.log("✅ Leaderboard rankings created");

    // 6. Add notifications
    console.log("5️⃣ Adding notifications...");
    await pool.query(
      `INSERT INTO notifications (id, user_id, tenant_id, type, title, message, is_read)
       VALUES 
       (gen_random_uuid(), $1, $2, 'system_alert', 'New Project Assigned', 
        'You have been assigned to AI & ML Batch 2024 - Data Analytics Dashboard project', false),
       (gen_random_uuid(), $1, $2, 'mentor_comment', 'Mentor Review Received', 
        'Your mentor has reviewed your recent work. Check the feedback section.', false),
       (gen_random_uuid(), $1, $2, 'system_alert', 'Tracker Reminder', 
        'Don''t forget to submit your daily tracker!', true)
       ON CONFLICT DO NOTHING`,
      [aliceId, tenantId]
    );
    console.log("✅ Notifications added");

    console.log("\n✅ All data populated successfully!");
    console.log("\n📊 Summary:");
    console.log("- Leaderboard: Rank 2 with score 87.50");
    console.log("- Tracker entries: Recent 5 days");
    console.log("- Faculty feedback: 1 entry");
    console.log("- Mentor reviews: 3 entries (existing)");
    console.log("- Notifications: 3 entries");
    console.log("- Projects: 3 assigned");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

populateAliceData();
