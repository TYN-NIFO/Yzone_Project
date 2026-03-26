import { pool } from '../src/config/db';
import bcrypt from 'bcryptjs';

async function seed() {
  // ── Tenant ──────────────────────────────────────────────
  let tenantRes = await pool.query(`SELECT id FROM tenants WHERE name = 'GCT Yzone' LIMIT 1`);
  let tenantId: string;
  if (tenantRes.rows.length === 0) {
    const t = await pool.query(
      `INSERT INTO tenants (name, institution_code, contact_email, is_active)
       VALUES ('GCT Yzone', 'GCT2026', 'admin@gctyzone.com', true) RETURNING id`
    );
    tenantId = t.rows[0].id;
  } else {
    tenantId = tenantRes.rows[0].id;
  }
  console.log(`✅ Tenant: GCT Yzone`);

  // ── Cohort ───────────────────────────────────────────────
  let cohortRes = await pool.query(`SELECT id FROM cohorts WHERE name = 'Cohort 2026' AND tenant_id = $1 LIMIT 1`, [tenantId]);
  let cohortId: string;
  if (cohortRes.rows.length === 0) {
    const c = await pool.query(
      `INSERT INTO cohorts (tenant_id, name, cohort_code, start_date, end_date, is_active)
       VALUES ($1, 'Cohort 2026', 'C2026', '2026-01-01', '2026-12-31', true) RETURNING id`,
      [tenantId]
    );
    cohortId = c.rows[0].id;
  } else {
    cohortId = cohortRes.rows[0].id;
  }
  console.log(`✅ Cohort: Cohort 2026`);

  // ── Clean up old users with same emails ──────────────────
  const emails = ['admin@gctyzone.com','ravi@gctyzone.com','priya@gctyzone.com','karthik@gctyzone.com','arun@gctyzone.com','divya@gctyzone.com','surya@gctyzone.com'];
  const oldRes = await pool.query(`SELECT id FROM users WHERE email = ANY($1)`, [emails]);
  const oldIds = oldRes.rows.map(r => r.id);
  if (oldIds.length > 0) {
    await pool.query(`UPDATE cohorts SET facilitator_id = NULL WHERE facilitator_id = ANY($1)`, [oldIds]);
    await pool.query(`DELETE FROM attendance WHERE student_id = ANY($1) OR marked_by = ANY($1)`, [oldIds]);
    await pool.query(`DELETE FROM tracker_entries WHERE student_id = ANY($1)`, [oldIds]);
    await pool.query(`DELETE FROM mentor_assignments WHERE mentor_id = ANY($1) OR student_id = ANY($1)`, [oldIds]);
    await pool.query(`DELETE FROM faculty_feedback WHERE faculty_id = ANY($1) OR student_id = ANY($1)`, [oldIds]);
    await pool.query(`DELETE FROM notifications WHERE user_id = ANY($1)`, [oldIds]);
    await pool.query(`DELETE FROM team_members WHERE student_id = ANY($1)`, [oldIds]);
    for (const email of emails) await pool.query(`DELETE FROM users WHERE email = $1`, [email]);
  }

  // ── Create Users ─────────────────────────────────────────
  const users = [
    { name: 'Admin Executive',   email: 'admin@gctyzone.com',   password: 'admin123',    role: 'tynExecutive',     cohort_id: null },
    { name: 'Ravi Facilitator',  email: 'ravi@gctyzone.com',    password: 'ravi123',     role: 'facilitator',      cohort_id: cohortId },
    { name: 'Dr. Priya Faculty', email: 'priya@gctyzone.com',   password: 'priya123',    role: 'facultyPrincipal', cohort_id: cohortId },
    { name: 'Karthik Mentor',    email: 'karthik@gctyzone.com', password: 'karthik123',  role: 'industryMentor',   cohort_id: cohortId },
    { name: 'Arun Student',      email: 'arun@gctyzone.com',    password: 'arun123',     role: 'student',          cohort_id: cohortId },
    { name: 'Divya Student',     email: 'divya@gctyzone.com',   password: 'divya123',    role: 'student',          cohort_id: cohortId },
    { name: 'Surya Student',     email: 'surya@gctyzone.com',   password: 'surya123',    role: 'student',          cohort_id: cohortId },
  ];

  const ids: Record<string, string> = {};
  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 10);
    const r = await pool.query(
      `INSERT INTO users (tenant_id, cohort_id, name, email, password_hash, role, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,true) RETURNING id`,
      [tenantId, u.cohort_id, u.name, u.email, hash, u.role]
    );
    ids[u.email] = r.rows[0].id;
  }
  console.log(`✅ Created 7 users`);

  // ── Set facilitator on cohort ────────────────────────────
  await pool.query(`UPDATE cohorts SET facilitator_id = $1 WHERE id = $2`, [ids['ravi@gctyzone.com'], cohortId]);

  // ── Team ─────────────────────────────────────────────────
  await pool.query(`DELETE FROM teams WHERE cohort_id = $1 AND name = 'Team Alpha'`, [cohortId]);
  const teamRes = await pool.query(
    `INSERT INTO teams (cohort_id, tenant_id, name, mentor_id) VALUES ($1,$2,'Team Alpha',$3) RETURNING id`,
    [cohortId, tenantId, ids['karthik@gctyzone.com']]
  );
  const teamId = teamRes.rows[0].id;
  console.log(`✅ Team: Team Alpha`);

  // ── Team members ─────────────────────────────────────────
  for (const email of ['arun@gctyzone.com','divya@gctyzone.com','surya@gctyzone.com']) {
    await pool.query(
      `INSERT INTO team_members (team_id, student_id, role) VALUES ($1,$2,'member') ON CONFLICT DO NOTHING`,
      [teamId, ids[email]]
    );
  }

  // ── Project ──────────────────────────────────────────────
  await pool.query(`DELETE FROM projects WHERE cohort_id = $1 AND name = 'Smart Campus App'`, [cohortId]);
  const projRes = await pool.query(
    `INSERT INTO projects (cohort_id, team_id, tenant_id, name, title, description, status, start_date, end_date)
     VALUES ($1,$2,$3,'Smart Campus App','Smart Campus App','A mobile app to manage campus activities','IN_PROGRESS','2026-01-15','2026-06-30')
     RETURNING id`,
    [cohortId, teamId, tenantId]
  );
  console.log(`✅ Project: Smart Campus App`);

  // ── Session (today) ──────────────────────────────────────
  await pool.query(`DELETE FROM sessions WHERE cohort_id = $1 AND session_date = CURRENT_DATE`, [cohortId]);
  const sessRes = await pool.query(
    `INSERT INTO sessions (cohort_id, tenant_id, facilitator_id, title, topic, session_date, session_time, description)
     VALUES ($1,$2,$3,'Daily Standup','Project Progress Review',CURRENT_DATE,'10:00','Daily team sync and tracker review')
     RETURNING id`,
    [cohortId, tenantId, ids['ravi@gctyzone.com']]
  );
  const sessionId = sessRes.rows[0].id;
  console.log(`✅ Session: Today's Daily Standup`);

  // ── Attendance ───────────────────────────────────────────
  for (const email of ['arun@gctyzone.com','divya@gctyzone.com','surya@gctyzone.com']) {
    await pool.query(
      `INSERT INTO attendance (session_id, student_id, tenant_id, cohort_id, is_present, marked_by)
       VALUES ($1,$2,$3,$4,true,$5) ON CONFLICT DO NOTHING`,
      [sessionId, ids[email], tenantId, cohortId, ids['ravi@gctyzone.com']]
    );
  }
  console.log(`✅ Attendance marked for 3 students`);

  // ── Tracker entries ──────────────────────────────────────
  const trackerData = [
    { email: 'arun@gctyzone.com',  hours: 6, task: 'Completed login module UI',    learning: 'Learned React hooks and state management', challenge: 'None' },
    { email: 'divya@gctyzone.com', hours: 5, task: 'Designed database schema',     learning: 'Understood PostgreSQL relationships',       challenge: 'None' },
    { email: 'surya@gctyzone.com', hours: 4, task: 'API integration in progress',  learning: 'REST API design patterns',                  challenge: 'Need backend endpoint' },
  ];
  for (const t of trackerData) {
    await pool.query(
      `INSERT INTO tracker_entries (student_id, tenant_id, cohort_id, entry_date, hours_spent, tasks_completed, learning_summary, challenges, submitted_at)
       VALUES ($1,$2,$3,CURRENT_DATE,$4,$5,$6,$7,NOW())`,
      [ids[t.email], tenantId, cohortId, t.hours, t.task, t.learning, t.challenge]
    );
  }
  console.log(`✅ Tracker entries for 3 students`);

  // ── Mentor assignments ───────────────────────────────────
  for (const email of ['arun@gctyzone.com','divya@gctyzone.com','surya@gctyzone.com']) {
    await pool.query(
      `INSERT INTO mentor_assignments (mentor_id, student_id, tenant_id, cohort_id, is_active)
       VALUES ($1,$2,$3,$4,true) ON CONFLICT DO NOTHING`,
      [ids['karthik@gctyzone.com'], ids[email], tenantId, cohortId]
    );
  }
  console.log(`✅ Mentor assigned to all students`);

  // ── Faculty feedback ─────────────────────────────────────
  try {
    await pool.query(
      `INSERT INTO faculty_feedback (faculty_id, student_id, cohort_id, tenant_id, feedback, academic_rating, behavior_rating, participation_rating, feedback_date)
       VALUES ($1,$2,$3,$4,'Excellent progress on the project. Keep it up!',5,5,5,CURRENT_DATE)`,
      [ids['priya@gctyzone.com'], ids['arun@gctyzone.com'], cohortId, tenantId]
    );
    console.log(`✅ Faculty feedback added`);
  } catch(e: any) { console.log(`⚠️  Faculty feedback: ${e.message}`); }

  // ── Notifications ────────────────────────────────────────
  for (const email of ['arun@gctyzone.com','divya@gctyzone.com','surya@gctyzone.com']) {
    await pool.query(
      `INSERT INTO notifications (user_id, tenant_id, type, title, message, is_read)
       VALUES ($1,$2,'system_alert','Welcome to Cohort 2026','Your cohort has started. Please fill your daily tracker every day.',false)`,
      [ids[email], tenantId]
    );
  }
  console.log(`✅ Notifications created`);

  console.log(`
╔══════════════════════════════════════════════════════════════╗
║           LOGIN CREDENTIALS — GCT YZONE                     ║
╠══════════════════════════════════════════════════════════════╣
║  URL: http://localhost:5173                                  ║
╠══════════════════════════════════════════════════════════════╣
║  Dashboard          Email                    Password        ║
║  ─────────────────────────────────────────────────────────  ║
║  Tyn Executive      admin@gctyzone.com        admin123       ║
║  Facilitator        ravi@gctyzone.com         ravi123        ║
║  Faculty/Principal  priya@gctyzone.com        priya123       ║
║  Industry Mentor    karthik@gctyzone.com      karthik123     ║
║  Student (Arun)     arun@gctyzone.com         arun123        ║
║  Student (Divya)    divya@gctyzone.com        divya123       ║
║  Student (Surya)    surya@gctyzone.com        surya123       ║
╚══════════════════════════════════════════════════════════════╝`);

  await pool.end();
}

seed().catch(console.error);
