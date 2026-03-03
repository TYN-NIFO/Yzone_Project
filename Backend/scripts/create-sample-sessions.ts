import { pool } from '../src/config/db';

async function createSampleSessions() {
  try {
    console.log('Creating sample sessions...');

    // Get existing cohorts and facilitators
    const cohortsResult = await pool.query(
      'SELECT id, name, tenant_id FROM cohorts WHERE deleted_at IS NULL LIMIT 3'
    );

    const facilitatorsResult = await pool.query(
      'SELECT id, tenant_id FROM users WHERE role = $1 AND deleted_at IS NULL LIMIT 2',
      ['facilitator']
    );

    if (cohortsResult.rows.length === 0) {
      console.log('No cohorts found. Please create cohorts first.');
      return;
    }

    if (facilitatorsResult.rows.length === 0) {
      console.log('No facilitators found. Please create facilitators first.');
      return;
    }

    const cohorts = cohortsResult.rows;
    const facilitators = facilitatorsResult.rows;

    // Create sessions for today and next few days
    const sessions = [
      {
        topic: 'Morning Standup',
        description: 'Daily standup meeting to discuss progress and blockers',
        session_date: new Date().toISOString().split('T')[0], // Today
        session_time: '09:00:00',
      },
      {
        topic: 'Technical Workshop',
        description: 'Hands-on technical workshop on React fundamentals',
        session_date: new Date().toISOString().split('T')[0], // Today
        session_time: '10:00:00',
      },
      {
        topic: 'Project Review',
        description: 'Review of ongoing projects and feedback session',
        session_date: new Date().toISOString().split('T')[0], // Today
        session_time: '14:00:00',
      },
      {
        topic: 'Soft Skills Training',
        description: 'Communication and presentation skills workshop',
        session_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
        session_time: '10:00:00',
      },
      {
        topic: 'Code Review Session',
        description: 'Peer code review and best practices discussion',
        session_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
        session_time: '15:00:00',
      }
    ];

    let sessionCount = 0;

    for (const session of sessions) {
      for (const cohort of cohorts) {
        const facilitator = facilitators[sessionCount % facilitators.length];
        
        // Only create session if facilitator belongs to same tenant
        if (facilitator.tenant_id === cohort.tenant_id) {
          const result = await pool.query(
            `INSERT INTO sessions (
              id, title, session_date, 
              cohort_id, created_at
            ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
            RETURNING id, title, session_date`,
            [
              require('crypto').randomUUID(),
              session.topic,
              session.session_date,
              cohort.id
            ]
          );

          console.log(`✅ Created session: ${result.rows[0].title} for cohort ${cohort.name} on ${result.rows[0].session_date}`);
          sessionCount++;
        }
      }
    }

    console.log(`\n🎉 Successfully created ${sessionCount} sample sessions!`);
    console.log('\nSessions created for:');
    console.log('- Today: Morning Standup, Technical Workshop, Project Review');
    console.log('- Tomorrow: Soft Skills Training, Code Review Session');

  } catch (error) {
    console.error('❌ Error creating sample sessions:', error);
  } finally {
    await pool.end();
  }
}

createSampleSessions();