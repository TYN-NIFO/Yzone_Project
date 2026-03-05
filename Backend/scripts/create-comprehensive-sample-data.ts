import { pool } from '../src/config/db';
import bcrypt from 'bcryptjs';

async function createComprehensiveSampleData() {
  try {
    console.log('\n🚀 Creating Comprehensive Sample Data...\n');

    // Get existing tenant
    const tenantResult = await pool.query(
      `SELECT id FROM tenants WHERE institution_code = 'TECH001' LIMIT 1`
    );

    if (tenantResult.rows.length === 0) {
      console.error('❌ No tenant found. Please create a tenant first.');
      return;
    }

    const tenantId = tenantResult.rows[0].id;
    console.log(`✅ Using tenant: ${tenantId}`);

    // Get or create cohort
    let cohortResult = await pool.query(
      `SELECT id FROM cohorts WHERE tenant_id = $1 AND name = 'Sample Cohort 2024' LIMIT 1`,
      [tenantId]
    );

    let cohortId;
    if (cohortResult.rows.length === 0) {
      cohortResult = await pool.query(
        `INSERT INTO cohorts (tenant_id, name, cohort_code, start_date, end_date, is_active)
         VALUES ($1, 'Sample Cohort 2024', 'SC2024', CURRENT_DATE, CURRENT_DATE + INTERVAL '6 months', true)
         RETURNING id`,
        [tenantId]
      );
      cohortId = cohortResult.rows[0].id;
      console.log(`✅ Created cohort: ${cohortId}`);
    } else {
      cohortId = cohortResult.rows[0].id;
      console.log(`✅ Using existing cohort: ${cohortId}`);
    }

    // Create users (if they don't exist)
    const password = await bcrypt.hash('password123', 10);

    // Create facilitator
    let facilitatorId;
    const facilitatorCheck = await pool.query(
      `SELECT id FROM users WHERE email = 'sample.facilitator@yzone.com' AND tenant_id = $1`,
      [tenantId]
    );

    if (facilitatorCheck.rows.length === 0) {
      const facilitatorResult = await pool.query(
        `INSERT INTO users (tenant_id, cohort_id, name, email, password_hash, role, phone, whatsapp_number, is_active)
         VALUES ($1, $2, 'Sample Facilitator', 'sample.facilitator@yzone.com', $3, 'facilitator', '+911234567890', '+911234567890', true)
         RETURNING id`,
        [tenantId, cohortId, password]
      );
      facilitatorId = facilitatorResult.rows[0].id;
      console.log(`✅ Created facilitator: ${facilitatorId}`);
    } else {
      facilitatorId = facilitatorCheck.rows[0].id;
      console.log(`✅ Using existing facilitator: ${facilitatorId}`);
    }

    // Create mentor
    let mentorId;
    const mentorCheck = await pool.query(
      `SELECT id FROM users WHERE email = 'sample.mentor@yzone.com' AND tenant_id = $1`,
      [tenantId]
    );

    if (mentorCheck.rows.length === 0) {
      const mentorResult = await pool.query(
        `INSERT INTO users (tenant_id, cohort_id, name, email, password_hash, role, phone, whatsapp_number, is_active)
         VALUES ($1, $2, 'Sample Mentor', 'sample.mentor@yzone.com', $3, 'industryMentor', '+911234567891', '+911234567891', true)
         RETURNING id`,
        [tenantId, cohortId, password]
      );
      mentorId = mentorResult.rows[0].id;
      console.log(`✅ Created mentor: ${mentorId}`);
    } else {
      mentorId = mentorCheck.rows[0].id;
      console.log(`✅ Using existing mentor: ${mentorId}`);
    }

    // Create faculty
    let facultyId;
    const facultyCheck = await pool.query(
      `SELECT id FROM users WHERE email = 'sample.faculty@yzone.com' AND tenant_id = $1`,
      [tenantId]
    );

    if (facultyCheck.rows.length === 0) {
      const facultyResult = await pool.query(
        `INSERT INTO users (tenant_id, cohort_id, name, email, password_hash, role, phone, whatsapp_number, is_active)
         VALUES ($1, $2, 'Sample Faculty', 'sample.faculty@yzone.com', $3, 'facultyPrincipal', '+911234567892', '+911234567892', true)
         RETURNING id`,
        [tenantId, cohortId, password]
      );
      facultyId = facultyResult.rows[0].id;
      console.log(`✅ Created faculty: ${facultyId}`);
    } else {
      facultyId = facultyCheck.rows[0].id;
      console.log(`✅ Using existing faculty: ${facultyId}`);
    }

    // Create 15 students
    const studentNames = [
      'Rahul Kumar', 'Priya Sharma', 'Amit Patel', 'Sneha Reddy', 'Vikram Singh',
      'Anjali Gupta', 'Rohan Mehta', 'Pooja Iyer', 'Karthik Rao', 'Divya Nair',
      'Arjun Desai', 'Kavya Krishnan', 'Siddharth Joshi', 'Meera Pillai', 'Aditya Verma'
    ];

    const studentIds: string[] = [];

    for (let i = 0; i < studentNames.length; i++) {
      const email = `student${i + 1}@yzone.com`;
      const studentCheck = await pool.query(
        `SELECT id FROM users WHERE email = $1 AND tenant_id = $2`,
        [email, tenantId]
      );

      let studentId;
      if (studentCheck.rows.length === 0) {
        const studentResult = await pool.query(
          `INSERT INTO users (tenant_id, cohort_id, name, email, password_hash, role, phone, whatsapp_number, is_active)
           VALUES ($1, $2, $3, $4, $5, 'student', $6, $6, true)
           RETURNING id`,
          [tenantId, cohortId, studentNames[i], email, password, `+9198765432${10 + i}`]
        );
        studentId = studentResult.rows[0].id;
      } else {
        studentId = studentCheck.rows[0].id;
      }
      studentIds.push(studentId);
    }
    console.log(`✅ Created/verified ${studentIds.length} students`);

    // Create sessions for the past 7 days and today
    const sessionTitles = [
      'Introduction to Programming',
      'Data Structures Basics',
      'Algorithm Design',
      'Web Development Fundamentals',
      'Database Management',
      'Software Testing',
      'Project Planning',
      'Code Review Session'
    ];

    const sessionIds: string[] = [];
    for (let i = 0; i < 8; i++) {
      const sessionDate = new Date();
      sessionDate.setDate(sessionDate.getDate() - (7 - i));

      const sessionCheck = await pool.query(
        `SELECT id FROM sessions WHERE cohort_id = $1 AND title = $2 AND session_date = $3`,
        [cohortId, sessionTitles[i], sessionDate.toISOString().split('T')[0]]
      );

      let sessionId;
      if (sessionCheck.rows.length === 0) {
        const sessionResult = await pool.query(
          `INSERT INTO sessions (id, cohort_id, title, session_date, created_at)
           VALUES (gen_random_uuid(), $1, $2, $3, CURRENT_TIMESTAMP)
           RETURNING id`,
          [cohortId, sessionTitles[i], sessionDate.toISOString().split('T')[0]]
        );
        sessionId = sessionResult.rows[0].id;
      } else {
        sessionId = sessionCheck.rows[0].id;
      }
      sessionIds.push(sessionId);
    }
    console.log(`✅ Created ${sessionIds.length} sessions`);

    // Mark attendance for all sessions (80-95% attendance rate)
    let attendanceCount = 0;
    for (const sessionId of sessionIds) {
      for (const studentId of studentIds) {
        const isPresent = Math.random() > 0.15; // 85% attendance rate
        
        await pool.query(
          `INSERT INTO attendance (id, session_id, student_id, is_present, marked_by, marked_at)
           VALUES (gen_random_uuid(), $1, $2, $3, $4, CURRENT_TIMESTAMP)
           ON CONFLICT (session_id, student_id) DO NOTHING`,
          [sessionId, studentId, isPresent, facilitatorId]
        );
        attendanceCount++;
      }
    }
    console.log(`✅ Created ${attendanceCount} attendance records`);

    // Create tracker entries for past 7 days
    const tasks = [
      'Completed module exercises and practiced coding problems',
      'Built a small project to apply learned concepts',
      'Reviewed documentation and created study notes',
      'Participated in group discussions and peer learning',
      'Worked on assignment and debugged issues',
      'Attended workshop and implemented examples',
      'Prepared presentation and practiced delivery'
    ];

    const learnings = [
      'Understood core concepts and their practical applications',
      'Learned best practices and coding standards',
      'Gained insights into problem-solving approaches',
      'Discovered new tools and techniques',
      'Improved debugging and testing skills',
      'Enhanced understanding of system design',
      'Developed better collaboration skills'
    ];

    let trackerCount = 0;
    for (let day = 0; day < 7; day++) {
      const entryDate = new Date();
      entryDate.setDate(entryDate.getDate() - (6 - day));

      for (const studentId of studentIds) {
        // 90% of students submit trackers
        if (Math.random() > 0.1) {
          const hoursSpent = 4 + Math.floor(Math.random() * 5); // 4-8 hours
          
          await pool.query(
            `INSERT INTO tracker_entries (
              id, student_id, tenant_id, cohort_id, entry_date, 
              tasks_completed, learning_summary, hours_spent, 
              challenges, submitted_at
            ) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT DO NOTHING`,
            [
              studentId, tenantId, cohortId, entryDate.toISOString().split('T')[0],
              tasks[day], learnings[day], hoursSpent,
              day % 3 === 0 ? 'Faced some challenges with complex concepts' : null,
              entryDate
            ]
          );
          trackerCount++;
        }
      }
    }
    console.log(`✅ Created ${trackerCount} tracker entries`);

    // Assign mentor to students
    let assignmentCount = 0;
    for (const studentId of studentIds) {
      await pool.query(
        `INSERT INTO mentor_assignments (mentor_id, student_id, tenant_id, cohort_id, is_active)
         VALUES ($1, $2, $3, $4, true)
         ON CONFLICT (mentor_id, student_id, cohort_id) DO NOTHING`,
        [mentorId, studentId, tenantId, cohortId]
      );
      assignmentCount++;
    }
    console.log(`✅ Created ${assignmentCount} mentor assignments`);

    // Create mentor reviews for some students
    let reviewCount = 0;
    for (let i = 0; i < Math.min(10, studentIds.length); i++) {
      const rating = 3 + Math.random() * 2; // 3-5 rating
      const feedbacks = [
        'Excellent progress and consistent effort',
        'Good understanding of concepts, needs more practice',
        'Shows great potential, keep up the good work',
        'Improving steadily, focus on fundamentals',
        'Outstanding performance and dedication'
      ];

      await pool.query(
        `INSERT INTO mentor_reviews (
          mentor_id, student_id, tenant_id, cohort_id, 
          rating, feedback, review_date
        ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE)
        ON CONFLICT DO NOTHING`,
        [mentorId, studentIds[i], tenantId, cohortId, rating.toFixed(2), feedbacks[i % feedbacks.length]]
      );
      reviewCount++;
    }
    console.log(`✅ Created ${reviewCount} mentor reviews`);

    // Create teams
    const teamNames = ['Team Alpha', 'Team Beta', 'Team Gamma'];
    const teamIds: string[] = [];

    for (let i = 0; i < teamNames.length; i++) {
      const teamCheck = await pool.query(
        `SELECT id FROM teams WHERE name = $1 AND cohort_id = $2`,
        [teamNames[i], cohortId]
      );

      let teamId;
      if (teamCheck.rows.length === 0) {
        const teamResult = await pool.query(
          `INSERT INTO teams (id, cohort_id, name)
           VALUES (gen_random_uuid(), $1, $2)
           RETURNING id`,
          [cohortId, teamNames[i]]
        );
        teamId = teamResult.rows[0].id;
      } else {
        teamId = teamCheck.rows[0].id;
      }
      teamIds.push(teamId);
    }
    console.log(`✅ Created ${teamIds.length} teams`);

    // Assign students to teams
    let teamMemberCount = 0;
    for (let i = 0; i < studentIds.length; i++) {
      const teamId = teamIds[i % teamIds.length];
      await pool.query(
        `INSERT INTO team_members (id, team_id, student_id, role, joined_at)
         VALUES (gen_random_uuid(), $1, $2, $3, CURRENT_TIMESTAMP)
         ON CONFLICT (team_id, student_id) DO NOTHING`,
        [teamId, studentIds[i], i % 5 === 0 ? 'Team Lead' : 'Member']
      );
      teamMemberCount++;
    }
    console.log(`✅ Assigned ${teamMemberCount} students to teams`);

    // Create projects
    const projectTitles = ['E-commerce Platform', 'Task Management System', 'Social Media Dashboard'];
    const projectIds: string[] = [];

    for (let i = 0; i < projectTitles.length; i++) {
      const projectCheck = await pool.query(
        `SELECT id FROM projects WHERE title = $1 AND cohort_id = $2`,
        [projectTitles[i], cohortId]
      );

      let projectId;
      if (projectCheck.rows.length === 0) {
        const projectResult = await pool.query(
          `INSERT INTO projects (id, cohort_id, team_id, title, status)
           VALUES (gen_random_uuid(), $1, $2, $3, 'IN_PROGRESS')
           RETURNING id`,
          [cohortId, teamIds[i], projectTitles[i]]
        );
        projectId = projectResult.rows[0].id;
      } else {
        projectId = projectCheck.rows[0].id;
      }
      projectIds.push(projectId);
    }
    console.log(`✅ Created ${projectIds.length} projects`);

    // Create notifications
    let notificationCount = 0;
    for (const studentId of studentIds) {
      await pool.query(
        `INSERT INTO notifications (id, user_id, tenant_id, type, title, message, is_read)
         VALUES 
         (gen_random_uuid(), $1, $2, 'system_alert', 'Welcome to YZone!', 'Start your learning journey today', true),
         (gen_random_uuid(), $1, $2, 'tracker_reminder', 'Daily Tracker Reminder', 'Don''t forget to submit your daily tracker', false)
         ON CONFLICT DO NOTHING`,
        [studentId, tenantId]
      );
      notificationCount += 2;
    }
    console.log(`✅ Created ${notificationCount} notifications`);

    // Calculate leaderboard
    console.log('\n📊 Calculating leaderboard...');
    await pool.query(`DELETE FROM leaderboard WHERE cohort_id = $1`, [cohortId]);

    const leaderboardData = await pool.query(
      `SELECT 
        u.id as student_id,
        u.tenant_id,
        u.cohort_id,
        COALESCE(COUNT(DISTINCT te.id) * 25, 0) as tracker_score,
        COALESCE(AVG(te.hours_spent) * 10, 0) as performance_score,
        COALESCE(
          (COUNT(CASE WHEN a.is_present = true THEN 1 END) * 100.0 / 
           NULLIF(COUNT(a.id), 0)) * 0.25, 0
        ) as attendance_score,
        COALESCE(AVG(mr.rating) * 20, 0) as mentor_rating_score
       FROM users u
       LEFT JOIN tracker_entries te ON u.id = te.student_id
       LEFT JOIN attendance a ON u.id = a.student_id
       LEFT JOIN mentor_reviews mr ON u.id = mr.student_id
       WHERE u.role = 'student' AND u.cohort_id = $1
       GROUP BY u.id, u.tenant_id, u.cohort_id`,
      [cohortId]
    );

    const rankedStudents = leaderboardData.rows
      .map(row => ({
        ...row,
        total_score: parseFloat(row.tracker_score) + parseFloat(row.performance_score) + 
                     parseFloat(row.attendance_score) + parseFloat(row.mentor_rating_score)
      }))
      .sort((a, b) => b.total_score - a.total_score);

    for (let i = 0; i < rankedStudents.length; i++) {
      const student = rankedStudents[i];
      await pool.query(
        `INSERT INTO leaderboard (
          id, student_id, tenant_id, cohort_id, rank, total_score,
          tracker_consistency_score, performance_score, 
          attendance_score, mentor_rating_score, calculated_at
        ) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)`,
        [
          student.student_id, student.tenant_id, student.cohort_id, i + 1,
          student.total_score, student.tracker_score, student.performance_score,
          student.attendance_score, student.mentor_rating_score
        ]
      );
    }
    console.log(`✅ Calculated leaderboard for ${rankedStudents.length} students`);

    console.log('\n✅ Comprehensive sample data created successfully!\n');
    console.log('📝 Summary:');
    console.log(`   - Cohort: Sample Cohort 2024`);
    console.log(`   - Students: ${studentIds.length}`);
    console.log(`   - Sessions: ${sessionIds.length}`);
    console.log(`   - Attendance Records: ${attendanceCount}`);
    console.log(`   - Tracker Entries: ${trackerCount}`);
    console.log(`   - Mentor Reviews: ${reviewCount}`);
    console.log(`   - Teams: ${teamIds.length}`);
    console.log(`   - Projects: ${projectIds.length}`);
    console.log(`   - Notifications: ${notificationCount}`);
    console.log('\n🔐 Login Credentials:');
    console.log(`   - Facilitator: sample.facilitator@yzone.com / password123`);
    console.log(`   - Mentor: sample.mentor@yzone.com / password123`);
    console.log(`   - Faculty: sample.faculty@yzone.com / password123`);
    console.log(`   - Students: student1@yzone.com to student15@yzone.com / password123`);
    console.log('');

  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  } finally {
    await pool.end();
  }
}

createComprehensiveSampleData();
