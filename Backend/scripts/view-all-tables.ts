import { pool } from '../src/config/db';

async function viewAllTables() {
  try {
    console.log('\n🗄️  DATABASE TABLES VIEWER\n');
    console.log('='.repeat(120));

    // First, get all table names
    console.log('\n📋 AVAILABLE TABLES:');
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    const tables = tablesResult.rows.map(row => row.table_name);
    console.log(`Found ${tables.length} tables:`, tables.join(', '));

    // Get table sizes
    console.log('\n📊 TABLE SIZES:');
    for (const table of tables) {
      try {
        const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
        const count = countResult.rows[0].count;
        console.log(`  ${table}: ${count} records`);
      } catch (error) {
        console.log(`  ${table}: Error getting count`);
      }
    }

    console.log('\n' + '='.repeat(120));

    // Show each table's data
    for (const table of tables) {
      try {
        console.log(`\n📊 TABLE: ${table.toUpperCase()}`);
        console.log('-'.repeat(120));

        // Get table structure first
        const structureResult = await pool.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_name = $1
          ORDER BY ordinal_position
        `, [table]);

        console.log('\n🏗️  Table Structure:');
        structureResult.rows.forEach(col => {
          console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : '(NULLABLE)'}`);
        });

        // Get sample data
        const dataResult = await pool.query(`SELECT * FROM ${table} LIMIT 10`);
        
        if (dataResult.rows.length > 0) {
          console.log(`\n📄 Sample Data (showing ${Math.min(dataResult.rows.length, 10)} of ${dataResult.rowCount} records):`);
          
          // For better readability, let's format the data
          if (table === 'tenants') {
            console.table(dataResult.rows.map(row => ({
              id: row.id?.substring(0, 8) + '...',
              name: row.name,
              institution_code: row.institution_code,
              contact_email: row.contact_email,
              is_active: row.is_active,
              created_at: row.created_at?.toISOString().split('T')[0]
            })));
          } else if (table === 'cohorts') {
            console.table(dataResult.rows.map(row => ({
              id: row.id?.substring(0, 8) + '...',
              name: row.name,
              cohort_code: row.cohort_code,
              start_date: row.start_date?.toISOString().split('T')[0],
              end_date: row.end_date?.toISOString().split('T')[0],
              is_active: row.is_active
            })));
          } else if (table === 'users') {
            console.table(dataResult.rows.map(row => ({
              id: row.id?.substring(0, 8) + '...',
              name: row.name,
              email: row.email,
              role: row.role,
              is_active: row.is_active,
              created_at: row.created_at?.toISOString().split('T')[0]
            })));
          } else if (table === 'sessions') {
            console.table(dataResult.rows.map(row => ({
              id: row.id?.substring(0, 8) + '...',
              title: row.title || row.topic,
              session_date: row.session_date?.toISOString().split('T')[0],
              session_time: row.session_time,
              created_at: row.created_at?.toISOString().split('T')[0]
            })));
          } else if (table === 'attendance') {
            console.table(dataResult.rows.map(row => ({
              id: row.id?.substring(0, 8) + '...',
              session_id: row.session_id?.substring(0, 8) + '...',
              student_id: row.student_id?.substring(0, 8) + '...',
              is_present: row.is_present,
              status: row.status,
              marked_at: row.marked_at?.toISOString().split('T')[0]
            })));
          } else if (table === 'tracker_entries') {
            console.table(dataResult.rows.map(row => ({
              id: row.id?.substring(0, 8) + '...',
              student_id: row.student_id?.substring(0, 8) + '...',
              entry_date: row.entry_date?.toISOString().split('T')[0],
              hours_spent: row.hours_spent,
              tasks: row.tasks_completed?.substring(0, 30) + '...'
            })));
          } else if (table === 'mentor_reviews') {
            console.table(dataResult.rows.map(row => ({
              id: row.id?.substring(0, 8) + '...',
              mentor_id: row.mentor_id?.substring(0, 8) + '...',
              student_id: row.student_id?.substring(0, 8) + '...',
              rating: row.rating,
              feedback: row.feedback?.substring(0, 30) + '...',
              review_date: row.review_date?.toISOString().split('T')[0]
            })));
          } else if (table === 'leaderboard') {
            console.table(dataResult.rows.map(row => ({
              student_id: row.student_id?.substring(0, 8) + '...',
              rank: row.rank,
              total_score: row.total_score,
              tracker_score: row.tracker_score,
              performance_score: row.performance_score
            })));
          } else if (table === 'teams') {
            console.table(dataResult.rows.map(row => ({
              id: row.id?.substring(0, 8) + '...',
              name: row.name,
              cohort_id: row.cohort_id?.substring(0, 8) + '...',
              created_at: row.created_at?.toISOString().split('T')[0]
            })));
          } else if (table === 'projects') {
            console.table(dataResult.rows.map(row => ({
              id: row.id?.substring(0, 8) + '...',
              title: row.title,
              type: row.type,
              status: row.status,
              team_id: row.team_id?.substring(0, 8) + '...'
            })));
          } else if (table === 'notifications') {
            console.table(dataResult.rows.map(row => ({
              id: row.id?.substring(0, 8) + '...',
              user_id: row.user_id?.substring(0, 8) + '...',
              type: row.type,
              title: row.title,
              is_read: row.is_read,
              created_at: row.created_at?.toISOString().split('T')[0]
            })));
          } else {
            // For other tables, show raw data but limit long fields
            const formattedRows = dataResult.rows.map(row => {
              const formatted: any = {};
              Object.keys(row).forEach(key => {
                if (typeof row[key] === 'string' && row[key].length > 36 && key.includes('id')) {
                  formatted[key] = row[key].substring(0, 8) + '...';
                } else if (typeof row[key] === 'string' && row[key].length > 50) {
                  formatted[key] = row[key].substring(0, 47) + '...';
                } else if (row[key] instanceof Date) {
                  formatted[key] = row[key].toISOString().split('T')[0];
                } else {
                  formatted[key] = row[key];
                }
              });
              return formatted;
            });
            console.table(formattedRows);
          }
        } else {
          console.log('  📭 No data in this table');
        }

      } catch (error: any) {
        console.log(`  ❌ Error reading table ${table}:`, error.message);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(120));
    console.log('\n📈 DATABASE SUMMARY:');
    
    const summary = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM tenants WHERE deleted_at IS NULL) as active_tenants,
        (SELECT COUNT(*) FROM cohorts WHERE deleted_at IS NULL) as active_cohorts,
        (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL) as active_users,
        (SELECT COUNT(*) FROM sessions) as total_sessions,
        (SELECT COUNT(*) FROM attendance) as attendance_records,
        (SELECT COUNT(*) FROM tracker_entries) as tracker_entries,
        (SELECT COUNT(*) FROM mentor_reviews) as mentor_reviews,
        (SELECT COUNT(*) FROM teams) as teams,
        (SELECT COUNT(*) FROM projects) as projects,
        (SELECT COUNT(*) FROM notifications) as notifications
    `);

    const s = summary.rows[0];
    console.log(`
  🏢 Active Tenants: ${s.active_tenants}
  🎓 Active Cohorts: ${s.active_cohorts}
  👥 Active Users: ${s.active_users}
  📅 Total Sessions: ${s.total_sessions}
  ✅ Attendance Records: ${s.attendance_records}
  📝 Tracker Entries: ${s.tracker_entries}
  ⭐ Mentor Reviews: ${s.mentor_reviews}
  👥 Teams: ${s.teams}
  🚀 Projects: ${s.projects}
  🔔 Notifications: ${s.notifications}
    `);

    console.log('='.repeat(120));
    console.log('\n✅ All tables viewed successfully!\n');

  } catch (error) {
    console.error('❌ Error viewing tables:', error);
  } finally {
    await pool.end();
  }
}

viewAllTables();