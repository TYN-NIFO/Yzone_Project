/**
 * Seed script for Neon DB
 * Creates one complete dataset: tenant → cohort → all 5 roles → sample data
 * Run: npx ts-node scripts/seed-neon.ts
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

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('🌱 Seeding Neon DB...\n');

    // ─── 1. TENANT ───────────────────────────────────────────────
    const tenantRes = await client.query(`
      INSERT INTO tenants (name, institution_code, contact_email, contact_phone, address, is_active)
      VALUES ('YZone Institute', 'YZONE001', 'admin@yzone.com', '+91-9876543210', '123 Tech Park, Bangalore', true)
      ON CONFLICT (institution_code) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `);
    const tenantId = tenantRes.rows[0].id;
    console.log('✅ Tenant:', tenantId);

    // ─── 2. EXECUTIVE (tynExecutive) ─────────────────────────────
    const execRes = await client.query(`
      INSERT INTO users (tenant_id, name, email, password_hash, role, phone, is_active)
      VALUES ($1, 'Admin Executive', 'admin@yzone.com', $2, 'tynExecutive', '+91-9000000001', true)
      ON CONFLICT (tenant_id, email) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `, [tenantId, await hash('admin123')]);
    const execId = execRes.rows[0].id;
    console.log('✅ Executive (admin@yzone.com / admin123):', execId);

    // ─── 3. FACILITATOR ──────────────────────────────────────────
    const facRes = await client.query(`
      INSERT INTO users (tenant_id, name, email, password_hash, role, phone, is_active)
      VALUES ($1, 'Ravi Kumar', 'facilitator@yzone.com', $2, 'facilitator', '+91-9000000002', true)
      ON CONFLICT (tenant_id, email) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `, [tenantId, await hash('facilitator123')]);
    const facilitatorId = facRes.rows[0].id;
    console.log('✅ Facilitator (facilitator@yzone.com / facilitator123):', facilitatorId);

    // ─── 4. COHORT ───────────────────────────────────────────────
    const cohortRes = await client.query(`
      INSERT INTO cohorts (tenant_id, name, cohort_code, start_date, end_date, facilitator_id, is_active)
      VALUES ($1, 'Batch 2025 - Full Stack', 'BATCH2025', '2025-01-01', '2025-12-31', $2, true)
      ON CONFLICT (tenant_id, cohort_code) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `, [tenantId, facilitatorId]);
    const cohortId = cohortRes.rows[0].id;
    console.log('✅ Cohort:', cohortId);

    // ─── 5. FACULTY PRINCIPAL ────────────────────────────────────
    const facultyRes = await client.query(`
      INSERT INTO users (tenant_id, cohort_id, name, email, password_hash, role, phone, is_active)
      VALUES ($1, $2, 'Dr. Priya Sharma', 'faculty@yzone.com', $3, 'facultyPrincipal', '+91-9000000003', true)
      ON CONFLICT (tenant_id, email) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `, [tenantId, cohortId, await hash('faculty123')]);
    const facultyId = facultyRes.rows[0].id;
    console.log('✅ Faculty (faculty@yzone.com / faculty123):', facultyRes.rows[0].id);

    // ─── 6. INDUSTRY MENTOR ──────────────────────────────────────
    const mentorRes = await client.query(`
      INSERT INTO users (tenant_id, cohort_id, name, email, password_hash, role, phone, is_active)
      VALUES ($1, $2, 'Arjun Mehta', 'mentor@yzone.com', $3, 'industryMentor', '+91-9000000004', true)
      ON CONFLICT (tenant_id, email) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `, [tenantId, cohortId, await hash('mentor123')]);
    const mentorId = mentorRes.rows[0].id;
    console.log('✅ Mentor (mentor@yzone.com / mentor123):', mentorId);

    // ─── 7. STUDENTS (3) ─────────────────────────────────────────
    const students = [
      { name: 'Alice Johnson',  email: 'alice@yzone.com',  pw: 'student123' },
      { name: 'Bob Williams',   email: 'bob@yzone.com',    pw: 'student123' },
      { name: 'Carol Davis',    email: 'carol@yzone.com',  pw: 'student123' },
    ];
    const studentIds: string[] = [];
    for (const s of students) {
      const r = await client.query(`
        INSERT INTO users (tenant_id, cohort_id, name, email, password_hash, role, phone, is_active)
        VALUES ($1, $2, $3, $4, $5, 'student', '+91-9000000010', true)
        ON CONFLICT (tenant_id, email) DO UPDATE SET name = EXCLUDED.name
        RETURNING id
      `, [tenantId, cohortId, s.name, s.email, await hash(s.pw)]);
      studentIds.push(r.rows[0].id);
      console.log(`✅ Student (${s.email} / ${s.pw}):`, r.rows[0].id);
    }

    // ─── 8. PROJECT (before team, since teams.project_id is NOT NULL) ──
    const projectRes = await client.query(`
      INSERT INTO projects (cohort_id, tenant_id, name, title, description, type, status, start_date, end_date)
      VALUES ($1, $2, 'E-Commerce Platform', 'E-Commerce Platform', 'Build a full-stack e-commerce app with React, Node.js and PostgreSQL', 'MAJOR', 'IN_PROGRESS', '2025-03-01', '2025-06-30')
      RETURNING id
    `, [cohortId, tenantId]);
    const projectId = projectRes.rows[0].id;
    console.log('✅ Project created:', projectId);

    // ─── 9. TEAM ─────────────────────────────────────────────────
    const teamRes = await client.query(`
      INSERT INTO teams (cohort_id, tenant_id, project_id, name)
      VALUES ($1, $2, $3, 'Team Alpha')
      RETURNING id
    `, [cohortId, tenantId, projectId]);
    const teamId = teamRes.rows[0].id;

    // Link project to team
    await client.query(`UPDATE projects SET team_id = $1 WHERE id = $2`, [teamId, projectId]);

    // Add all students to team
    for (const sid of studentIds) {
      await client.query(`
        INSERT INTO team_members (team_id, student_id)
        VALUES ($1, $2)
        ON CONFLICT (team_id, student_id) DO NOTHING
      `, [teamId, sid]);
    }
    console.log('✅ Team Alpha created with', studentIds.length, 'members');

    // ─── 9. MENTOR ASSIGNMENTS ───────────────────────────────────
    for (const sid of studentIds) {
      await client.query(`
        INSERT INTO mentor_assignments (mentor_id, student_id, tenant_id, cohort_id, team_id, is_active)
        VALUES ($1, $2, $3, $4, $5, true)
        ON CONFLICT (mentor_id, student_id, cohort_id) DO NOTHING
      `, [mentorId, sid, tenantId, cohortId, teamId]);
    }
    console.log('✅ Mentor assigned to all students');

    // ─── 10. SESSIONS ────────────────────────────────────────────
    const sessionDates = [
      { date: '2025-03-10', title: 'HTML & CSS Fundamentals' },
      { date: '2025-03-11', title: 'JavaScript Basics' },
      { date: '2025-03-12', title: 'React Introduction' },
      { date: '2025-03-13', title: 'Node.js & Express' },
      { date: '2025-03-14', title: 'Database Design' },
    ];
    const sessionIds: string[] = [];
    for (const s of sessionDates) {
      const r = await client.query(`
        INSERT INTO sessions (cohort_id, tenant_id, facilitator_id, session_date, session_time, topic, title, start_time, end_time, is_completed)
        VALUES ($1, $2, $3, $4, '09:00', $5, $5, '09:00', '17:00', true)
        RETURNING id
      `, [cohortId, tenantId, facilitatorId, s.date, s.title]);
      sessionIds.push(r.rows[0].id);
    }
    console.log('✅ 5 sessions created');

    // ─── 11. ATTENDANCE ──────────────────────────────────────────
    for (const sessionId of sessionIds) {
      for (let i = 0; i < studentIds.length; i++) {
        const isPresent = i < 2; // Alice & Bob present, Carol absent on some
        await client.query(`
          INSERT INTO attendance (session_id, student_id, tenant_id, cohort_id, is_present, marked_by, marked_at)
          VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
          ON CONFLICT (session_id, student_id) DO NOTHING
        `, [sessionId, studentIds[i], tenantId, cohortId, isPresent, facilitatorId]);
      }
    }
    console.log('✅ Attendance marked for all sessions');

    // ─── 12. TRACKER ENTRIES ─────────────────────────────────────
    const trackerDays = [
      { date: '2025-03-10', tasks: 'Built HTML forms, styled with CSS', summary: 'Learned flexbox and grid layouts', hours: 6 },
      { date: '2025-03-11', tasks: 'JS arrays, functions, DOM manipulation', summary: 'Understood event listeners and callbacks', hours: 7 },
      { date: '2025-03-12', tasks: 'React components, props, state', summary: 'Built first React app with hooks', hours: 8 },
      { date: '2025-03-13', tasks: 'REST API with Express, middleware', summary: 'Created CRUD endpoints', hours: 7 },
      { date: '2025-03-14', tasks: 'PostgreSQL schema design, queries', summary: 'Designed normalized DB schema', hours: 6 },
    ];
    for (const sid of studentIds) {
      for (const t of trackerDays) {
        await client.query(`
          INSERT INTO tracker_entries (student_id, tenant_id, cohort_id, entry_date, tasks_completed, learning_summary, hours_spent, challenges)
          VALUES ($1, $2, $3, $4, $5, $6, $7, 'Time management and debugging')
          ON CONFLICT (student_id, entry_date) DO NOTHING
        `, [sid, tenantId, cohortId, t.date, t.tasks, t.summary, t.hours]);
      }
    }
    console.log('✅ Tracker entries created (5 per student)');

    // ─── 13. TRACKER FEEDBACK ────────────────────────────────────
    const trackerRows = await client.query(
      `SELECT id FROM tracker_entries WHERE student_id = $1 ORDER BY entry_date LIMIT 3`,
      [studentIds[0]]
    );
    for (const row of trackerRows.rows) {
      await client.query(`
        INSERT INTO tracker_feedback (tracker_entry_id, facilitator_id, tenant_id, feedback, rating, suggestions, is_approved)
        VALUES ($1, $2, $3, 'Great work! Keep it up.', 4, 'Try to add more detail in challenges section.', true)
        ON CONFLICT DO NOTHING
      `, [row.id, facilitatorId, tenantId]);
    }
    console.log('✅ Tracker feedback added');

    // ─── 14. MENTOR REVIEWS ──────────────────────────────────────
    for (const sid of studentIds) {
      await client.query(`
        INSERT INTO mentor_reviews (mentor_id, student_id, tenant_id, cohort_id, rating, feedback, review_date)
        VALUES ($1, $2, $3, $4, 4, 'Strong technical skills. Good communication. Needs to improve on time management.', CURRENT_DATE)
        ON CONFLICT DO NOTHING
      `, [mentorId, sid, tenantId, cohortId]);
    }
    console.log('✅ Mentor reviews added');

    // ─── 15. FACULTY FEEDBACK ────────────────────────────────────
    for (const sid of studentIds) {
      await client.query(`
        INSERT INTO faculty_feedback (faculty_id, student_id, tenant_id, cohort_id, academic_rating, behavior_rating, participation_rating, feedback, academic_comments, behavior_comments, recommendations, feedback_date)
        VALUES ($1, $2, $3, $4, 4, 5, 4, 'Excellent student with strong fundamentals.', 'Consistently scores above average.', 'Respectful and collaborative.', 'Consider advanced electives.', CURRENT_DATE)
        ON CONFLICT DO NOTHING
      `, [facultyId, sid, tenantId, cohortId]);
    }
    console.log('✅ Faculty feedback added');

    // ─── 16. SUBMISSION ──────────────────────────────────────────
    await client.query(`
      INSERT INTO submissions (project_id, student_id, tenant_id, notes, status, submitted_at)
      VALUES ($1, $2, $3, 'Phase 1 complete - frontend done, backend in progress', 'UNDER_REVIEW', CURRENT_TIMESTAMP)
      ON CONFLICT DO NOTHING
    `, [projectId, studentIds[0], tenantId]);
    console.log('✅ Sample submission added (Alice)');

    // ─── 17. LEADERBOARD ─────────────────────────────────────────
    const scores = [87.5, 75.0, 68.0];
    for (let i = 0; i < studentIds.length; i++) {
      await client.query(`
        INSERT INTO leaderboard (student_id, tenant_id, cohort_id, rank, total_score, tracker_consistency_score, performance_score, attendance_score, mentor_rating_score)
        VALUES ($1, $2, $3, $4, $5, 25, 20, 22, 20)
        ON CONFLICT (cohort_id, student_id) DO UPDATE SET rank = $4, total_score = $5
      `, [studentIds[i], tenantId, cohortId, i + 1, scores[i]]);
    }
    console.log('✅ Leaderboard populated');

    // ─── 18. NOTIFICATIONS ───────────────────────────────────────
    for (const sid of studentIds) {
      await client.query(`
        INSERT INTO notifications (user_id, tenant_id, type, title, message, is_read)
        VALUES 
          ($1, $2, 'tracker_reminder', 'Tracker Reminder', 'Don''t forget to submit your daily tracker!', false),
          ($1, $2, 'mentor_comment', 'New Mentor Feedback', 'Your mentor has left feedback on your progress.', false),
          ($1, $2, 'system_alert', 'Project Deadline', 'Phase 1 submission due in 7 days.', true)
      `, [sid, tenantId]);
    }
    console.log('✅ Notifications added');

    await client.query('COMMIT');

    console.log('\n🎉 Seed complete!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  CREDENTIALS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  Executive   : admin@yzone.com        / admin123');
    console.log('  Facilitator : facilitator@yzone.com  / facilitator123');
    console.log('  Faculty     : faculty@yzone.com      / faculty123');
    console.log('  Mentor      : mentor@yzone.com       / mentor123');
    console.log('  Student 1   : alice@yzone.com        / student123');
    console.log('  Student 2   : bob@yzone.com          / student123');
    console.log('  Student 3   : carol@yzone.com        / student123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err.message);
    console.error(err);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
