/**
 * Full reset + seed for Neon DB
 * Wipes all data, then inserts clean test data for all 5 roles
 * Run: npx ts-node scripts/reset-and-seed.ts
 */

import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const hash = (pw: string) => bcrypt.hash(pw, 10);

async function run() {
  const client = await pool.connect();
  try {
    console.log('🗑️  Clearing all data...');

    // Truncate in dependency order
    await client.query(`
      TRUNCATE TABLE
        password_reset_tokens,
        notifications,
        whatsapp_logs,
        leaderboard,
        submissions,
        tracker_feedback,
        tracker_entries,
        faculty_feedback,
        mentor_reviews,
        mentor_assignments,
        attendance,
        sessions,
        team_members,
        teams,
        projects,
        users,
        cohorts,
        tenants
      RESTART IDENTITY CASCADE
    `);
    console.log('✅ All tables cleared\n');

    await client.query('BEGIN');
    console.log('🌱 Seeding...\n');

    // ── TENANT ──────────────────────────────────────────────────
    const { rows: [tenant] } = await client.query(`
      INSERT INTO tenants (name, institution_code, contact_email, contact_phone, address, is_active)
      VALUES ('YZone Institute', 'YZONE001', 'admin@yzone.com', '+91-9876543210', '123 Tech Park, Bangalore', true)
      RETURNING id
    `);
    const tenantId = tenant.id;
    console.log('✅ Tenant created');

    // ── EXECUTIVE ───────────────────────────────────────────────
    const { rows: [exec] } = await client.query(`
      INSERT INTO users (tenant_id, name, email, password_hash, role, is_active)
      VALUES ($1, 'Admin Executive', 'admin@yzone.com', $2, 'tynExecutive', true)
      RETURNING id
    `, [tenantId, await hash('admin123')]);
    console.log('✅ Executive: admin@yzone.com / admin123');

    // ── FACILITATOR ─────────────────────────────────────────────
    const { rows: [facilitator] } = await client.query(`
      INSERT INTO users (tenant_id, name, email, password_hash, role, is_active)
      VALUES ($1, 'Ravi Kumar', 'facilitator@yzone.com', $2, 'facilitator', true)
      RETURNING id
    `, [tenantId, await hash('facilitator123')]);
    console.log('✅ Facilitator: facilitator@yzone.com / facilitator123');

    // ── COHORT ──────────────────────────────────────────────────
    const { rows: [cohort] } = await client.query(`
      INSERT INTO cohorts (tenant_id, name, cohort_code, start_date, end_date, facilitator_id, is_active)
      VALUES ($1, 'Batch 2025 - Full Stack', 'BATCH2025', '2025-01-01', '2025-12-31', $2, true)
      RETURNING id
    `, [tenantId, facilitator.id]);
    const cohortId = cohort.id;
    console.log('✅ Cohort: Batch 2025 - Full Stack');

    // ── FACULTY ─────────────────────────────────────────────────
    const { rows: [faculty] } = await client.query(`
      INSERT INTO users (tenant_id, cohort_id, name, email, password_hash, role, is_active)
      VALUES ($1, $2, 'Dr. Priya Sharma', 'faculty@yzone.com', $3, 'facultyPrincipal', true)
      RETURNING id
    `, [tenantId, cohortId, await hash('faculty123')]);
    console.log('✅ Faculty: faculty@yzone.com / faculty123');

    // ── MENTOR ──────────────────────────────────────────────────
    const { rows: [mentor] } = await client.query(`
      INSERT INTO users (tenant_id, cohort_id, name, email, password_hash, role, is_active)
      VALUES ($1, $2, 'Arjun Mehta', 'mentor@yzone.com', $3, 'industryMentor', true)
      RETURNING id
    `, [tenantId, cohortId, await hash('mentor123')]);
    console.log('✅ Mentor: mentor@yzone.com / mentor123');

    // ── STUDENTS ────────────────────────────────────────────────
    const studentData = [
      { name: 'Alice Johnson', email: 'alice@yzone.com' },
      { name: 'Bob Williams',  email: 'bob@yzone.com'   },
      { name: 'Carol Davis',   email: 'carol@yzone.com' },
    ];
    const studentIds: string[] = [];
    for (const s of studentData) {
      const { rows: [st] } = await client.query(`
        INSERT INTO users (tenant_id, cohort_id, name, email, password_hash, role, is_active)
        VALUES ($1, $2, $3, $4, $5, 'student', true)
        RETURNING id
      `, [tenantId, cohortId, s.name, s.email, await hash('student123')]);
      studentIds.push(st.id);
      console.log(`✅ Student: ${s.email} / student123`);
    }

    // ── PROJECT ─────────────────────────────────────────────────
    const { rows: [project] } = await client.query(`
      INSERT INTO projects (cohort_id, tenant_id, name, title, description, type, status, start_date, end_date)
      VALUES ($1, $2, 'E-Commerce Platform', 'E-Commerce Platform',
              'Build a full-stack e-commerce app with React, Node.js and PostgreSQL',
              'MAJOR', 'IN_PROGRESS', '2025-03-01', '2025-06-30')
      RETURNING id
    `, [cohortId, tenantId]);
    console.log('✅ Project: E-Commerce Platform');

    // ── TEAM ────────────────────────────────────────────────────
    const { rows: [team] } = await client.query(`
      INSERT INTO teams (cohort_id, tenant_id, project_id, name)
      VALUES ($1, $2, $3, 'Team Alpha')
      RETURNING id
    `, [cohortId, tenantId, project.id]);

    // Link team back to project
    await client.query(`UPDATE projects SET team_id = $1 WHERE id = $2`, [team.id, project.id]);

    for (const sid of studentIds) {
      await client.query(`
        INSERT INTO team_members (team_id, student_id) VALUES ($1, $2)
        ON CONFLICT (team_id, student_id) DO NOTHING
      `, [team.id, sid]);
    }
    console.log('✅ Team Alpha with 3 members');

    // ── MENTOR ASSIGNMENTS ──────────────────────────────────────
    for (const sid of studentIds) {
      await client.query(`
        INSERT INTO mentor_assignments (mentor_id, student_id, tenant_id, cohort_id, team_id, is_active)
        VALUES ($1, $2, $3, $4, $5, true)
        ON CONFLICT (mentor_id, student_id, cohort_id) DO NOTHING
      `, [mentor.id, sid, tenantId, cohortId, team.id]);
    }
    console.log('✅ Mentor assigned to all students');

    // ── SESSIONS ────────────────────────────────────────────────
    const sessionList = [
      { date: '2025-03-10', title: 'HTML & CSS Fundamentals' },
      { date: '2025-03-11', title: 'JavaScript Basics' },
      { date: '2025-03-12', title: 'React Introduction' },
      { date: '2025-03-13', title: 'Node.js & Express' },
      { date: '2025-03-14', title: 'Database Design' },
    ];
    const sessionIds: string[] = [];
    for (const s of sessionList) {
      const { rows: [sess] } = await client.query(`
        INSERT INTO sessions (cohort_id, tenant_id, facilitator_id, session_date, session_time, topic, title, start_time, end_time, is_completed)
        VALUES ($1, $2, $3, $4, '09:00', $5, $5, '09:00', '17:00', true)
        RETURNING id
      `, [cohortId, tenantId, facilitator.id, s.date, s.title]);
      sessionIds.push(sess.id);
    }
    console.log('✅ 5 sessions created');

    // ── ATTENDANCE ──────────────────────────────────────────────
    for (const sessionId of sessionIds) {
      for (let i = 0; i < studentIds.length; i++) {
        await client.query(`
          INSERT INTO attendance (session_id, student_id, tenant_id, cohort_id, is_present, marked_by)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (session_id, student_id) DO NOTHING
        `, [sessionId, studentIds[i], tenantId, cohortId, i < 2, facilitator.id]);
      }
    }
    console.log('✅ Attendance marked');

    // ── TRACKER ENTRIES ─────────────────────────────────────────
    const trackers = [
      { date: '2025-03-10', tasks: 'Built HTML forms, styled with CSS', summary: 'Learned flexbox and grid layouts', hours: 6 },
      { date: '2025-03-11', tasks: 'JS arrays, functions, DOM manipulation', summary: 'Understood event listeners', hours: 7 },
      { date: '2025-03-12', tasks: 'React components, props, state', summary: 'Built first React app with hooks', hours: 8 },
      { date: '2025-03-13', tasks: 'REST API with Express, middleware', summary: 'Created CRUD endpoints', hours: 7 },
      { date: '2025-03-14', tasks: 'PostgreSQL schema design, queries', summary: 'Designed normalized DB schema', hours: 6 },
    ];
    for (const sid of studentIds) {
      for (const t of trackers) {
        await client.query(`
          INSERT INTO tracker_entries (student_id, tenant_id, cohort_id, entry_date, tasks_completed, learning_summary, hours_spent, challenges)
          VALUES ($1, $2, $3, $4, $5, $6, $7, 'Time management and debugging')
          ON CONFLICT (student_id, entry_date) DO NOTHING
        `, [sid, tenantId, cohortId, t.date, t.tasks, t.summary, t.hours]);
      }
    }
    console.log('✅ 5 tracker entries per student');

    // ── TRACKER FEEDBACK ────────────────────────────────────────
    const { rows: trackerRows } = await client.query(
      `SELECT id FROM tracker_entries WHERE student_id = $1 ORDER BY entry_date LIMIT 3`,
      [studentIds[0]]
    );
    for (const row of trackerRows) {
      await client.query(`
        INSERT INTO tracker_feedback (tracker_entry_id, facilitator_id, tenant_id, feedback, rating, suggestions, is_approved)
        VALUES ($1, $2, $3, 'Great work! Keep it up.', 4, 'Add more detail in challenges.', true)
      `, [row.id, facilitator.id, tenantId]);
    }
    console.log('✅ Tracker feedback added');

    // ── MENTOR REVIEWS ──────────────────────────────────────────
    for (const sid of studentIds) {
      await client.query(`
        INSERT INTO mentor_reviews (mentor_id, student_id, tenant_id, cohort_id, rating, feedback, review_date)
        VALUES ($1, $2, $3, $4, 4, 'Strong technical skills. Needs to improve time management.', CURRENT_DATE)
      `, [mentor.id, sid, tenantId, cohortId]);
    }
    console.log('✅ Mentor reviews added');

    // ── FACULTY FEEDBACK ────────────────────────────────────────
    for (const sid of studentIds) {
      await client.query(`
        INSERT INTO faculty_feedback (faculty_id, student_id, tenant_id, cohort_id, academic_rating, behavior_rating, participation_rating, feedback, recommendations, feedback_date)
        VALUES ($1, $2, $3, $4, 4, 5, 4, 'Excellent student with strong fundamentals.', 'Consider advanced electives.', CURRENT_DATE)
      `, [faculty.id, sid, tenantId, cohortId]);
    }
    console.log('✅ Faculty feedback added');

    // ── SUBMISSION ──────────────────────────────────────────────
    await client.query(`
      INSERT INTO submissions (project_id, student_id, tenant_id, notes, status, submitted_at)
      VALUES ($1, $2, $3, 'Phase 1 complete - frontend done, backend in progress', 'UNDER_REVIEW', CURRENT_TIMESTAMP)
    `, [project.id, studentIds[0], tenantId]);
    console.log('✅ Submission added (Alice)');

    // ── LEADERBOARD ─────────────────────────────────────────────
    const scores = [87.5, 75.0, 68.0];
    for (let i = 0; i < studentIds.length; i++) {
      await client.query(`
        INSERT INTO leaderboard (student_id, tenant_id, cohort_id, rank, total_score, tracker_consistency_score, performance_score, attendance_score, mentor_rating_score)
        VALUES ($1, $2, $3, $4, $5, 25, 20, 22, 20)
        ON CONFLICT (cohort_id, student_id) DO UPDATE SET rank = $4, total_score = $5
      `, [studentIds[i], tenantId, cohortId, i + 1, scores[i]]);
    }
    console.log('✅ Leaderboard populated');

    // ── NOTIFICATIONS ───────────────────────────────────────────
    for (const sid of studentIds) {
      await client.query(`
        INSERT INTO notifications (user_id, tenant_id, type, title, message, is_read) VALUES
          ($1, $2, 'tracker_reminder', 'Tracker Reminder', 'Don''t forget to submit your daily tracker!', false),
          ($1, $2, 'mentor_comment',   'New Mentor Feedback', 'Your mentor has left feedback on your progress.', false),
          ($1, $2, 'system_alert',     'Project Deadline', 'Phase 1 submission due in 7 days.', true)
      `, [sid, tenantId]);
    }
    console.log('✅ Notifications added');

    await client.query('COMMIT');

    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🎉 DONE — LOGIN CREDENTIALS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Executive   : admin@yzone.com        / admin123
  Facilitator : facilitator@yzone.com  / facilitator123
  Faculty     : faculty@yzone.com      / faculty123
  Mentor      : mentor@yzone.com       / mentor123
  Student 1   : alice@yzone.com        / student123
  Student 2   : bob@yzone.com          / student123
  Student 3   : carol@yzone.com        / student123
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('❌ Failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
