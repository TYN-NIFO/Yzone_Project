import { pool } from "../src/config/db";
import * as bcrypt from "bcryptjs";

async function populateSampleData() {
  try {
    console.log("🚀 Starting sample data population...");

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
      { name: "Alice Johnson", email: "alice@yzone.com", phone: "+1234567890", whatsapp: "+1234567890" },
      { name: "Bob Smith", email: "bob@yzone.com", phone: "+1234567891", whatsapp: "+1234567891" },
      { name: "Carol Davis", email: "carol@yzone.com", phone: "+1234567892", whatsapp: "+1234567892" },
      { name: "David Wilson", email: "david@yzone.com", phone: "+1234567893", whatsapp: "+1234567893" },
      { name: "Eva Brown", email: "eva@yzone.com", phone: "+1234567894", whatsapp: "+1234567894" },
      { name: "Frank Miller", email: "frank@yzone.com", phone: "+1234567895", whatsapp: "+1234567895" },
      { name: "Grace Lee", email: "grace@yzone.com", phone: "+1234567896", whatsapp: "+1234567896" },
      { name: "Henry Taylor", email: "henry@yzone.com", phone: "+1234567897", whatsapp: "+1234567897" },
    ];

    const hashedPassword = await bcrypt.hash("student123", 10);

    for (const student of additionalStudents) {
      await pool.query(
        `INSERT INTO users (tenant_id, cohort_id, name, email, password_hash, role, phone, whatsapp_number, is_active)
         VALUES ($1, $2, $3, $4, $5, 'student', $6, $7, true)
         ON CONFLICT (tenant_id, email) DO NOTHING`,
        [tenantId, cohortId, student.name, student.email, hashedPassword, student.phone, student.whatsapp]
      );
    }

    console.log("✅ Additional students created");

    // Get all students
    const studentsResult = await pool.query(
      "SELECT id, name FROM users WHERE role = 'student' AND tenant_id = $1",
      [tenantId]
    );
    const students = studentsResult.rows;

    // Create sample tracker entries for the last 7 days
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const entryDate = new Date(today);
      entryDate.setDate(today.getDate() - i);
      
      for (const student of students.slice(0, Math.floor(Math.random() * students.length) + 3)) {
        const tasks = [
          "Completed React components tutorial",
          "Built responsive navigation bar",
          "Implemented user authentication",
          "Created database schema",
          "Fixed CSS styling issues",
          "Added form validation",
          "Integrated API endpoints",
          "Wrote unit tests"
        ];
        
        const learnings = [
          "Learned about React hooks and state management",
          "Understanding of responsive design principles",
          "JWT authentication implementation",
          "Database relationships and normalization",
          "CSS Grid and Flexbox layouts",
          "Form handling and validation techniques",
          "RESTful API design patterns",
          "Testing methodologies and best practices"
        ];

        const challenges = [
          "Struggled with async/await syntax",
          "CSS positioning was confusing",
          "Database connection issues",
          "CORS errors in API calls",
          "State management complexity",
          "Responsive design breakpoints",
          "Authentication token handling",
          "Test case scenarios"
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
            Math.floor(Math.random() * 8) + 2, // 2-10 hours
            Math.random() > 0.3 ? challenges[Math.floor(Math.random() * challenges.length)] : null
          ]
        );
      }
    }

    console.log("✅ Sample tracker entries created");

    // Create sample mentor reviews
    const mentorResult = await pool.query(
      "SELECT id FROM users WHERE role = 'industryMentor' AND tenant_id = $1 LIMIT 1",
      [tenantId]
    );

    if (mentorResult.rows.length > 0) {
      const mentorId = mentorResult.rows[0].id;
      
      // Assign students to mentor
      for (const student of students.slice(0, 5)) {
        await pool.query(
          `INSERT INTO mentor_assignments (mentor_id, student_id, tenant_id, cohort_id, assigned_at)
           VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
           ON CONFLICT (mentor_id, student_id, cohort_id) DO NOTHING`,
          [mentorId, student.id, tenantId, cohortId]
        );
      }

      // Create sample reviews
      const feedbacks = [
        "Excellent progress in understanding core concepts. Shows great initiative.",
        "Good technical skills but needs to improve communication during presentations.",
        "Consistent performer with attention to detail. Keep up the good work!",
        "Shows creativity in problem-solving. Could benefit from more practice with algorithms.",
        "Strong team player with good collaboration skills. Technical skills are developing well."
      ];

      for (let i = 0; i < 3; i++) {
        const student = students[i];
        await pool.query(
          `INSERT INTO mentor_reviews (mentor_id, student_id, tenant_id, cohort_id, rating, feedback, review_date)
           VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE - INTERVAL '${i} days')`,
          [
            mentorId,
            student.id,
            tenantId,
            cohortId,
            Math.floor(Math.random() * 2) + 4, // 4-5 rating
            feedbacks[Math.floor(Math.random() * feedbacks.length)]
          ]
        );
      }

      console.log("✅ Sample mentor reviews created");
    }

    // Create sample sessions
    const facilitatorResult = await pool.query(
      "SELECT id FROM users WHERE role = 'facilitator' AND tenant_id = $1 LIMIT 1",
      [tenantId]
    );

    if (facilitatorResult.rows.length > 0) {
      const facilitatorId = facilitatorResult.rows[0].id;
      
      const sessions = [
        { title: "React Fundamentals", type: "lecture" },
        { title: "Database Design Workshop", type: "workshop" },
        { title: "Project Presentation", type: "presentation" },
        { title: "Code Review Session", type: "review" },
        { title: "Team Building Activity", type: "activity" }
      ];

      for (let i = 0; i < sessions.length; i++) {
        const session = sessions[i];
        const sessionDate = new Date(today);
        sessionDate.setDate(today.getDate() - i);
        
        const sessionResult = await pool.query(
          `INSERT INTO sessions (cohort_id, facilitator_id, tenant_id, title, session_type, session_date, start_time, end_time)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id`,
          [
            cohortId,
            facilitatorId,
            tenantId,
            session.title,
            session.type,
            sessionDate.toISOString().split('T')[0],
            '09:00:00',
            '12:00:00'
          ]
        );

        const sessionId = sessionResult.rows[0].id;

        // Create attendance records
        for (const student of students.slice(0, Math.floor(Math.random() * students.length) + 5)) {
          await pool.query(
            `INSERT INTO attendance (session_id, student_id, cohort_id, tenant_id, is_present, marked_at)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT DO NOTHING`,
            [
              sessionId,
              student.id,
              cohortId,
              tenantId,
              Math.random() > 0.2, // 80% attendance rate
              new Date()
            ]
          );
        }
      }

      console.log("✅ Sample sessions and attendance created");
    }

    // Create sample teams
    await pool.query(
      `INSERT INTO teams (cohort_id, tenant_id, name, description, max_members)
       VALUES ($1, $2, 'Team Alpha', 'Frontend development team', 4),
              ($1, $2, 'Team Beta', 'Backend development team', 4),
              ($1, $2, 'Team Gamma', 'Full-stack development team', 5)
       ON CONFLICT DO NOTHING`,
      [cohortId, tenantId]
    );

    // Assign students to teams
    const teamsResult = await pool.query("SELECT id FROM teams WHERE cohort_id = $1", [cohortId]);
    const teams = teamsResult.rows;

    let studentIndex = 0;
    for (const team of teams) {
      const teamSize = Math.floor(Math.random() * 3) + 3; // 3-5 members
      for (let i = 0; i < teamSize && studentIndex < students.length; i++) {
        await pool.query(
          `INSERT INTO team_members (team_id, student_id, tenant_id, joined_date)
           VALUES ($1, $2, $3, CURRENT_DATE)
           ON CONFLICT DO NOTHING`,
          [team.id, students[studentIndex].id, tenantId]
        );
        studentIndex++;
      }
    }

    console.log("✅ Sample teams created");

    // Create sample projects
    const projects = [
      {
        title: "E-commerce Website",
        description: "Build a full-stack e-commerce platform with React and Node.js",
        requirements: "User authentication, product catalog, shopping cart, payment integration"
      },
      {
        title: "Task Management App",
        description: "Create a collaborative task management application",
        requirements: "User roles, task assignment, progress tracking, notifications"
      },
      {
        title: "Social Media Dashboard",
        description: "Develop a social media analytics dashboard",
        requirements: "Data visualization, real-time updates, responsive design"
      }
    ];

    for (let i = 0; i < projects.length; i++) {
      const project = projects[i];
      const startDate = new Date(today);
      startDate.setDate(today.getDate() + i * 7);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 21); // 3 weeks duration

      await pool.query(
        `INSERT INTO projects (cohort_id, tenant_id, title, description, requirements, start_date, end_date, max_score)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 100)
         ON CONFLICT DO NOTHING`,
        [
          cohortId,
          tenantId,
          project.title,
          project.description,
          project.requirements,
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        ]
      );
    }

    console.log("✅ Sample projects created");

    // Create sample notifications
    for (const student of students.slice(0, 5)) {
      await pool.query(
        `INSERT INTO notifications (user_id, tenant_id, type, title, message, is_read)
         VALUES ($1, $2, 'reminder', 'Tracker Reminder', 'Don''t forget to submit your daily tracker!', false),
                ($1, $2, 'feedback', 'New Feedback', 'You have received new feedback from your mentor.', false),
                ($1, $2, 'announcement', 'Project Deadline', 'Project submission deadline is approaching.', true)
         ON CONFLICT DO NOTHING`,
        [student.id, tenantId]
      );
    }

    console.log("✅ Sample notifications created");

    // Recalculate leaderboard
    await pool.query(`
      INSERT INTO leaderboard (student_id, tenant_id, cohort_id, tracker_score, performance_score, attendance_score, mentor_score, total_score, rank, last_updated)
      SELECT 
        u.id,
        u.tenant_id,
        u.cohort_id,
        COALESCE((SELECT COUNT(*) * 25.0 / 7 FROM tracker_entries WHERE student_id = u.id AND entry_date >= CURRENT_DATE - INTERVAL '7 days'), 0) as tracker_score,
        COALESCE((SELECT AVG(hours_spent) * 5 FROM tracker_entries WHERE student_id = u.id), 0) as performance_score,
        COALESCE((SELECT COUNT(*) FILTER (WHERE is_present = true) * 25.0 / NULLIF(COUNT(*), 0) FROM attendance WHERE student_id = u.id), 0) as attendance_score,
        COALESCE((SELECT AVG(rating) * 5 FROM mentor_reviews WHERE student_id = u.id), 0) as mentor_score,
        COALESCE((SELECT COUNT(*) * 25.0 / 7 FROM tracker_entries WHERE student_id = u.id AND entry_date >= CURRENT_DATE - INTERVAL '7 days'), 0) +
        COALESCE((SELECT AVG(hours_spent) * 5 FROM tracker_entries WHERE student_id = u.id), 0) +
        COALESCE((SELECT COUNT(*) FILTER (WHERE is_present = true) * 25.0 / NULLIF(COUNT(*), 0) FROM attendance WHERE student_id = u.id), 0) +
        COALESCE((SELECT AVG(rating) * 5 FROM mentor_reviews WHERE student_id = u.id), 0) as total_score,
        ROW_NUMBER() OVER (PARTITION BY u.cohort_id ORDER BY 
          COALESCE((SELECT COUNT(*) * 25.0 / 7 FROM tracker_entries WHERE student_id = u.id AND entry_date >= CURRENT_DATE - INTERVAL '7 days'), 0) +
          COALESCE((SELECT AVG(hours_spent) * 5 FROM tracker_entries WHERE student_id = u.id), 0) +
          COALESCE((SELECT COUNT(*) FILTER (WHERE is_present = true) * 25.0 / NULLIF(COUNT(*), 0) FROM attendance WHERE student_id = u.id), 0) +
          COALESCE((SELECT AVG(rating) * 5 FROM mentor_reviews WHERE student_id = u.id), 0) DESC
        ) as rank,
        CURRENT_TIMESTAMP
      FROM users u
      WHERE u.role = 'student' AND u.tenant_id = $1
      ON CONFLICT (student_id) DO UPDATE SET
        tracker_score = EXCLUDED.tracker_score,
        performance_score = EXCLUDED.performance_score,
        attendance_score = EXCLUDED.attendance_score,
        mentor_score = EXCLUDED.mentor_score,
        total_score = EXCLUDED.total_score,
        rank = EXCLUDED.rank,
        last_updated = EXCLUDED.last_updated
    `, [tenantId]);

    console.log("✅ Leaderboard calculated");

    console.log("🎉 Sample data population completed successfully!");
    console.log("\n📊 Summary:");
    console.log("- Additional students created");
    console.log("- 7 days of tracker entries");
    console.log("- Mentor reviews and assignments");
    console.log("- Sessions with attendance records");
    console.log("- Teams with member assignments");
    console.log("- Sample projects");
    console.log("- Notifications");
    console.log("- Updated leaderboard");

  } catch (error) {
    console.error("❌ Error populating sample data:", error);
  } finally {
    await pool.end();
  }
}

populateSampleData();