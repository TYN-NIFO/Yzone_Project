import { pool } from '../src/config/db';

async function checkAllData() {
  try {
    console.log('📊 Checking all data in database tables...\n');
    console.log('='.repeat(80));

    // 1. TENANTS
    console.log('\n1. TENANTS TABLE:');
    console.log('-'.repeat(80));
    const tenants = await pool.query(`
      SELECT id, name, institution_code, contact_email, is_active, created_at
      FROM tenants 
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
    `);
    console.log(`Total Tenants: ${tenants.rows.length}`);
    tenants.rows.forEach((t, i) => {
      console.log(`\n  ${i + 1}. ${t.name} (${t.institution_code})`);
      console.log(`     ID: ${t.id}`);
      console.log(`     Email: ${t.contact_email}`);
      console.log(`     Active: ${t.is_active ? 'Yes' : 'No'}`);
      console.log(`     Created: ${new Date(t.created_at).toLocaleDateString()}`);
    });

    // 2. COHORTS
    console.log('\n\n2. COHORTS TABLE:');
    console.log('-'.repeat(80));
    const cohorts = await pool.query(`
      SELECT c.id, c.name, c.cohort_code, c.start_date, c.end_date, 
             t.name as tenant_name, u.name as facilitator_name,
             (SELECT COUNT(*) FROM users WHERE cohort_id = c.id AND role = 'student' AND deleted_at IS NULL) as student_count
      FROM cohorts c
      LEFT JOIN tenants t ON c.tenant_id = t.id
      LEFT JOIN users u ON c.facilitator_id = u.id
      WHERE c.deleted_at IS NULL
      ORDER BY c.created_at DESC
    `);
    console.log(`Total Cohorts: ${cohorts.rows.length}`);
    cohorts.rows.forEach((c, i) => {
      console.log(`\n  ${i + 1}. ${c.name} (${c.cohort_code})`);
      console.log(`     ID: ${c.id}`);
      console.log(`     Tenant: ${c.tenant_name}`);
      console.log(`     Facilitator: ${c.facilitator_name || 'Not assigned'}`);
      console.log(`     Students: ${c.student_count}`);
      console.log(`     Duration: ${new Date(c.start_date).toLocaleDateString()} - ${new Date(c.end_date).toLocaleDateString()}`);
    });

    // 3. USERS (by role)
    console.log('\n\n3. USERS TABLE (by role):');
    console.log('-'.repeat(80));
    const usersByRole = await pool.query(`
      SELECT role, COUNT(*) as count
      FROM users
      WHERE deleted_at IS NULL
      GROUP BY role
      ORDER BY role
    `);
    console.log('User Distribution:');
    usersByRole.rows.forEach(r => {
      console.log(`  - ${r.role}: ${r.count} users`);
    });

    // Show sample users from each role
    const roles = ['tynExecutive', 'facilitator', 'facultyPrincipal', 'industryMentor', 'student'];
    for (const role of roles) {
      const users = await pool.query(`
        SELECT u.id, u.name, u.email, u.is_active, c.name as cohort_name
        FROM users u
        LEFT JOIN cohorts c ON u.cohort_id = c.id
        WHERE u.role = $1 AND u.deleted_at IS NULL
        ORDER BY u.created_at DESC
        LIMIT 3
      `, [role]);
      
      if (users.rows.length > 0) {
        console.log(`\n  ${role.toUpperCase()}:`);
        users.rows.forEach((u, i) => {
          console.log(`    ${i + 1}. ${u.name} (${u.email})`);
          console.log(`       ID: ${u.id}`);
          console.log(`       Cohort: ${u.cohort_name || 'N/A'}`);
          console.log(`       Active: ${u.is_active ? 'Yes' : 'No'}`);
        });
      }
    }

    // 4. SESSIONS
    console.log('\n\n4. SESSIONS TABLE:');
    console.log('-'.repeat(80));
    const sessions = await pool.query(`
      SELECT s.id, s.title, s.session_date, c.name as cohort_name,
             (SELECT COUNT(*) FROM attendance WHERE session_id = s.id) as attendance_count
      FROM sessions s
      LEFT JOIN cohorts c ON s.cohort_id = c.id
      ORDER BY s.session_date DESC, s.created_at DESC
      LIMIT 10
    `);
    console.log(`Total Sessions (showing last 10): ${sessions.rows.length}`);
    sessions.rows.forEach((s, i) => {
      console.log(`\n  ${i + 1}. ${s.title}`);
      console.log(`     ID: ${s.id}`);
      console.log(`     Date: ${new Date(s.session_date).toLocaleDateString()}`);
      console.log(`     Cohort: ${s.cohort_name}`);
      console.log(`     Attendance Records: ${s.attendance_count}`);
    });

    // 5. ATTENDANCE
    console.log('\n\n5. ATTENDANCE TABLE:');
    console.log('-'.repeat(80));
    const attendanceStats = await pool.query(`
      SELECT 
        COUNT(*) as total_records,
        COUNT(CASE WHEN is_present = true THEN 1 END) as present_count,
        COUNT(CASE WHEN is_present = false THEN 1 END) as absent_count
      FROM attendance
    `);
    const stats = attendanceStats.rows[0];
    console.log(`Total Attendance Records: ${stats.total_records}`);
    console.log(`  - Present: ${stats.present_count}`);
    console.log(`  - Absent: ${stats.absent_count}`);

    // Recent attendance
    const recentAttendance = await pool.query(`
      SELECT a.id, s.title as session_title, u.name as student_name, 
             a.is_present, a.marked_at
      FROM attendance a
      JOIN sessions s ON a.session_id = s.id
      JOIN users u ON a.student_id = u.id
      ORDER BY a.marked_at DESC
      LIMIT 5
    `);
    if (recentAttendance.rows.length > 0) {
      console.log('\nRecent Attendance Records:');
      recentAttendance.rows.forEach((a, i) => {
        console.log(`  ${i + 1}. ${a.student_name} - ${a.session_title}`);
        console.log(`     Status: ${a.is_present ? '✅ Present' : '❌ Absent'}`);
        console.log(`     Marked: ${new Date(a.marked_at).toLocaleString()}`);
      });
    }

    // 6. TRACKER ENTRIES
    console.log('\n\n6. TRACKER ENTRIES TABLE:');
    console.log('-'.repeat(80));
    const trackerStats = await pool.query(`
      SELECT 
        COUNT(*) as total_entries,
        COUNT(DISTINCT student_id) as students_with_entries,
        AVG(hours_spent) as avg_hours,
        MAX(entry_date) as latest_entry
      FROM tracker_entries
    `);
    const tStats = trackerStats.rows[0];
    console.log(`Total Tracker Entries: ${tStats.total_entries}`);
    console.log(`Students with Entries: ${tStats.students_with_entries}`);
    console.log(`Average Hours Spent: ${tStats.avg_hours ? parseFloat(tStats.avg_hours).toFixed(2) : 'N/A'}`);
    console.log(`Latest Entry: ${tStats.latest_entry ? new Date(tStats.latest_entry).toLocaleDateString() : 'N/A'}`);

    // Recent tracker entries
    const recentTrackers = await pool.query(`
      SELECT t.id, u.name as student_name, t.entry_date, t.hours_spent, 
             t.tasks_completed, t.created_at
      FROM tracker_entries t
      JOIN users u ON t.student_id = u.id
      ORDER BY t.created_at DESC
      LIMIT 5
    `);
    if (recentTrackers.rows.length > 0) {
      console.log('\nRecent Tracker Entries:');
      recentTrackers.rows.forEach((t, i) => {
        console.log(`  ${i + 1}. ${t.student_name} - ${new Date(t.entry_date).toLocaleDateString()}`);
        console.log(`     Hours: ${t.hours_spent}`);
        console.log(`     Tasks: ${t.tasks_completed.substring(0, 50)}...`);
      });
    }

    // 7. MENTOR REVIEWS
    console.log('\n\n7. MENTOR REVIEWS TABLE:');
    console.log('-'.repeat(80));
    const reviewStats = await pool.query(`
      SELECT 
        COUNT(*) as total_reviews,
        AVG(rating) as avg_rating,
        MAX(review_date) as latest_review
      FROM mentor_reviews
    `);
    const rStats = reviewStats.rows[0];
    console.log(`Total Mentor Reviews: ${rStats.total_reviews}`);
    console.log(`Average Rating: ${rStats.avg_rating ? parseFloat(rStats.avg_rating).toFixed(2) : 'N/A'}`);
    console.log(`Latest Review: ${rStats.latest_review ? new Date(rStats.latest_review).toLocaleDateString() : 'N/A'}`);

    // Recent reviews
    const recentReviews = await pool.query(`
      SELECT mr.id, m.name as mentor_name, s.name as student_name, 
             mr.rating, mr.feedback, mr.review_date
      FROM mentor_reviews mr
      JOIN users m ON mr.mentor_id = m.id
      JOIN users s ON mr.student_id = s.id
      ORDER BY mr.created_at DESC
      LIMIT 5
    `);
    if (recentReviews.rows.length > 0) {
      console.log('\nRecent Mentor Reviews:');
      recentReviews.rows.forEach((r, i) => {
        console.log(`  ${i + 1}. ${r.mentor_name} → ${r.student_name}`);
        console.log(`     Rating: ${r.rating}/5.0`);
        console.log(`     Feedback: ${r.feedback ? r.feedback.substring(0, 60) + '...' : 'N/A'}`);
        console.log(`     Date: ${new Date(r.review_date).toLocaleDateString()}`);
      });
    }

    // 8. LEADERBOARD
    console.log('\n\n8. LEADERBOARD TABLE:');
    console.log('-'.repeat(80));
    const leaderboard = await pool.query(`
      SELECT l.rank, u.name as student_name, c.name as cohort_name,
             l.total_score, l.tracker_score, l.performance_score, 
             l.attendance_score, l.mentor_rating_score
      FROM leaderboard l
      JOIN users u ON l.student_id = u.id
      LEFT JOIN cohorts c ON l.cohort_id = c.id
      ORDER BY l.rank ASC
      LIMIT 10
    `);
    console.log(`Top 10 Students:`);
    leaderboard.rows.forEach((l, i) => {
      console.log(`\n  ${l.rank}. ${l.student_name} (${l.cohort_name})`);
      console.log(`     Total Score: ${l.total_score ? parseFloat(l.total_score).toFixed(2) : 'N/A'}`);
      console.log(`     Tracker: ${l.tracker_score ? parseFloat(l.tracker_score).toFixed(2) : 'N/A'} | Performance: ${l.performance_score ? parseFloat(l.performance_score).toFixed(2) : 'N/A'}`);
      console.log(`     Attendance: ${l.attendance_score ? parseFloat(l.attendance_score).toFixed(2) : 'N/A'} | Mentor Rating: ${l.mentor_rating_score ? parseFloat(l.mentor_rating_score).toFixed(2) : 'N/A'}`);
    });

    // 9. TEAMS
    console.log('\n\n9. TEAMS TABLE:');
    console.log('-'.repeat(80));
    const teams = await pool.query(`
      SELECT t.id, t.name, c.name as cohort_name,
             (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) as member_count
      FROM teams t
      LEFT JOIN cohorts c ON t.cohort_id = c.id
      ORDER BY t.created_at DESC
      LIMIT 10
    `);
    console.log(`Total Teams (showing last 10): ${teams.rows.length}`);
    teams.rows.forEach((t, i) => {
      console.log(`  ${i + 1}. ${t.name} (${t.cohort_name})`);
      console.log(`     Members: ${t.member_count}`);
    });

    // 10. PROJECTS
    console.log('\n\n10. PROJECTS TABLE:');
    console.log('-'.repeat(80));
    const projects = await pool.query(`
      SELECT p.id, p.title, p.type, p.status, c.name as cohort_name, t.name as team_name
      FROM projects p
      LEFT JOIN cohorts c ON p.cohort_id = c.id
      LEFT JOIN teams t ON p.team_id = t.id
      ORDER BY p.created_at DESC
      LIMIT 10
    `);
    console.log(`Total Projects (showing last 10): ${projects.rows.length}`);
    projects.rows.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.title} (${p.type})`);
      console.log(`     Status: ${p.status}`);
      console.log(`     Cohort: ${p.cohort_name || 'N/A'}`);
      console.log(`     Team: ${p.team_name || 'N/A'}`);
    });

    // 11. NOTIFICATIONS
    console.log('\n\n11. NOTIFICATIONS TABLE:');
    console.log('-'.repeat(80));
    const notificationStats = await pool.query(`
      SELECT 
        COUNT(*) as total_notifications,
        COUNT(CASE WHEN is_read = true THEN 1 END) as read_count,
        COUNT(CASE WHEN is_read = false THEN 1 END) as unread_count
      FROM notifications
    `);
    const nStats = notificationStats.rows[0];
    console.log(`Total Notifications: ${nStats.total_notifications}`);
    console.log(`  - Read: ${nStats.read_count}`);
    console.log(`  - Unread: ${nStats.unread_count}`);

    // 12. SUMMARY
    console.log('\n\n' + '='.repeat(80));
    console.log('📊 DATABASE SUMMARY:');
    console.log('='.repeat(80));
    
    const summary = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM tenants WHERE deleted_at IS NULL) as tenants,
        (SELECT COUNT(*) FROM cohorts WHERE deleted_at IS NULL) as cohorts,
        (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL) as users,
        (SELECT COUNT(*) FROM sessions) as sessions,
        (SELECT COUNT(*) FROM attendance) as attendance_records,
        (SELECT COUNT(*) FROM tracker_entries) as tracker_entries,
        (SELECT COUNT(*) FROM mentor_reviews) as mentor_reviews,
        (SELECT COUNT(*) FROM leaderboard) as leaderboard_entries,
        (SELECT COUNT(*) FROM teams) as teams,
        (SELECT COUNT(*) FROM projects) as projects,
        (SELECT COUNT(*) FROM notifications) as notifications
    `);
    
    const s = summary.rows[0];
    console.log(`
  ✅ Tenants: ${s.tenants}
  ✅ Cohorts: ${s.cohorts}
  ✅ Users: ${s.users}
  ✅ Sessions: ${s.sessions}
  ✅ Attendance Records: ${s.attendance_records}
  ✅ Tracker Entries: ${s.tracker_entries}
  ✅ Mentor Reviews: ${s.mentor_reviews}
  ✅ Leaderboard Entries: ${s.leaderboard_entries}
  ✅ Teams: ${s.teams}
  ✅ Projects: ${s.projects}
  ✅ Notifications: ${s.notifications}
    `);

    console.log('='.repeat(80));
    console.log('\n🎉 Data check completed!\n');

  } catch (error) {
    console.error('❌ Error checking data:', error);
  } finally {
    await pool.end();
  }
}

checkAllData();