import { pool } from '../src/config/db';

async function viewAllData() {
  try {
    console.log('\n📊 DATABASE DATA VIEWER\n');
    console.log('='.repeat(100));

    // Get summary counts
    const summary = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM tenants WHERE deleted_at IS NULL) as tenants,
        (SELECT COUNT(*) FROM cohorts WHERE deleted_at IS NULL) as cohorts,
        (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL) as users,
        (SELECT COUNT(*) FROM sessions) as sessions,
        (SELECT COUNT(*) FROM attendance) as attendance,
        (SELECT COUNT(*) FROM tracker_entries) as trackers,
        (SELECT COUNT(*) FROM mentor_reviews) as reviews,
        (SELECT COUNT(*) FROM teams) as teams,
        (SELECT COUNT(*) FROM projects) as projects
    `);

    const s = summary.rows[0];
    console.log('\n📈 QUICK SUMMARY:');
    console.log(`  Tenants: ${s.tenants} | Cohorts: ${s.cohorts} | Users: ${s.users}`);
    console.log(`  Sessions: ${s.sessions} | Attendance: ${s.attendance} | Trackers: ${s.trackers}`);
    console.log(`  Reviews: ${s.reviews} | Teams: ${s.teams} | Projects: ${s.projects}`);

    // Show all tables with data
    console.log('\n' + '='.repeat(100));
    console.log('\n1️⃣  TENANTS:');
    const tenants = await pool.query('SELECT id, name, institution_code, contact_email FROM tenants WHERE deleted_at IS NULL');
    console.table(tenants.rows);

    console.log('\n2️⃣  COHORTS:');
    const cohorts = await pool.query(`
      SELECT c.id, c.name, c.cohort_code, t.name as tenant, 
             TO_CHAR(c.start_date, 'YYYY-MM-DD') as start_date,
             TO_CHAR(c.end_date, 'YYYY-MM-DD') as end_date
      FROM cohorts c
      LEFT JOIN tenants t ON c.tenant_id = t.id
      WHERE c.deleted_at IS NULL
    `);
    console.table(cohorts.rows);

    console.log('\n3️⃣  USERS (by role):');
    const users = await pool.query(`
      SELECT role, u.name, u.email, c.name as cohort, u.is_active
      FROM users u
      LEFT JOIN cohorts c ON u.cohort_id = c.id
      WHERE u.deleted_at IS NULL
      ORDER BY role, u.name
    `);
    console.table(users.rows);

    console.log('\n4️⃣  SESSIONS (last 10):');
    const sessions = await pool.query(`
      SELECT s.title, TO_CHAR(s.session_date, 'YYYY-MM-DD') as date, 
             c.name as cohort,
             (SELECT COUNT(*) FROM attendance WHERE session_id = s.id) as attendance_count
      FROM sessions s
      LEFT JOIN cohorts c ON s.cohort_id = c.id
      ORDER BY s.session_date DESC, s.created_at DESC
      LIMIT 10
    `);
    console.table(sessions.rows);

    console.log('\n5️⃣  ATTENDANCE (last 10):');
    const attendance = await pool.query(`
      SELECT u.name as student, s.title as session, a.is_present,
             TO_CHAR(a.marked_at, 'YYYY-MM-DD HH24:MI') as marked_at
      FROM attendance a
      JOIN users u ON a.student_id = u.id
      JOIN sessions s ON a.session_id = s.id
      ORDER BY a.marked_at DESC
      LIMIT 10
    `);
    console.table(attendance.rows);

    console.log('\n6️⃣  TRACKER ENTRIES (last 10):');
    const trackers = await pool.query(`
      SELECT u.name as student, TO_CHAR(t.entry_date, 'YYYY-MM-DD') as date,
             t.hours_spent, LEFT(t.tasks_completed, 50) as tasks
      FROM tracker_entries t
      JOIN users u ON t.student_id = u.id
      ORDER BY t.created_at DESC
      LIMIT 10
    `);
    console.table(trackers.rows);

    console.log('\n7️⃣  MENTOR REVIEWS:');
    const reviews = await pool.query(`
      SELECT m.name as mentor, s.name as student, mr.rating,
             LEFT(mr.feedback, 50) as feedback,
             TO_CHAR(mr.review_date, 'YYYY-MM-DD') as date
      FROM mentor_reviews mr
      JOIN users m ON mr.mentor_id = m.id
      JOIN users s ON mr.student_id = s.id
      ORDER BY mr.created_at DESC
    `);
    console.table(reviews.rows);

    console.log('\n8️⃣  TEAMS:');
    const teams = await pool.query(`
      SELECT t.name, c.name as cohort,
             (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) as members
      FROM teams t
      LEFT JOIN cohorts c ON t.cohort_id = c.id
    `);
    console.table(teams.rows);

    console.log('\n9️⃣  PROJECTS:');
    const projects = await pool.query(`
      SELECT p.title, p.type, p.status, c.name as cohort, t.name as team
      FROM projects p
      LEFT JOIN cohorts c ON p.cohort_id = c.id
      LEFT JOIN teams t ON p.team_id = t.id
      ORDER BY p.created_at DESC
      LIMIT 10
    `);
    console.table(projects.rows);

    console.log('\n' + '='.repeat(100));
    console.log('\n✅ Data view completed!\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

viewAllData();