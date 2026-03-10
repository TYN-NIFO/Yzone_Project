import { pool } from '../src/config/db';
import * as bcrypt from 'bcryptjs';

async function createComprehensiveTestData() {
  try {
    console.log('🚀 Creating comprehensive test data for all dashboards...');
    
    // Get existing tenant
    const tenant = await pool.query('SELECT id FROM tenants LIMIT 1');
    const tenantId = tenant.rows[0].id;
    
    console.log('📋 Using tenant ID:', tenantId);
    
    // 1. Create Executive User
    console.log('\n1. Creating Executive User...');
    const executivePassword = await bcrypt.hash('executive123', 10);
    const executive = await pool.query(`
      INSERT INTO users (tenant_id, name, email, password_hash, role, phone, whatsapp_number, is_active)
      VALUES ($1, 'Sarah Executive', 'executive@yzone.com', $2, 'tynExecutive', '+919876543201', '+919876543201', true)
      ON CONFLICT (tenant_id, email) DO UPDATE SET 
        password_hash = $2, name = 'Sarah Executive'
      RETURNING id, name, email, role
    `, [tenantId, executivePassword]);
    console.log('✅ Executive created:', executive.rows[0].name);
    
    // 2. Create Faculty Principal User
    console.log('\n2. Creating Faculty Principal User...');
    const facultyPassword = await bcrypt.hash('faculty123', 10);
    const faculty = await pool.query(`
      INSERT INTO users (tenant_id, name, email, password_hash, role, phone, whatsapp_number, is_active)
      VALUES ($1, 'Dr. Robert Faculty', 'faculty@yzone.com', $2, 'facultyPrincipal', '+919876543202', '+919876543202', true)
      ON CONFLICT (tenant_id, email) DO UPDATE SET 
        password_hash = $2, name = 'Dr. Robert Faculty'
      RETURNING id, name, email, role
    `, [tenantId, facultyPassword]);
    console.log('✅ Faculty Principal created:', faculty.rows[0].name);
    
    // 3. Create Multiple Cohorts
    console.log('\n3. Creating Multiple Cohorts...');
    const cohorts = [];
    
    const cohortData = [
      { name: 'AI & ML Batch 2024', code: 'AI2024', start: '2024-01-15', end: '2024-06-15' },
      { name: 'Full Stack Development 2024', code: 'FS2024', start: '2024-02-01', end: '2024-07-01' },
      { name: 'Data Science Batch 2024', code: 'DS2024', start: '2024-03-01', end: '2024-08-01' }
    ];
    
    for (const cohortInfo of cohortData) {
      const cohort = await pool.query(`
        INSERT INTO cohorts (tenant_id, name, cohort_code, start_date, end_date, is_active)
        VALUES ($1, $2, $3, $4, $5, true)
        ON CONFLICT (tenant_id, cohort_code) DO UPDATE SET 
          name = $2, start_date = $4, end_date = $5
        RETURNING id, name, cohort_code
      `, [tenantId, cohortInfo.name, cohortInfo.code, cohortInfo.start, cohortInfo.end]);
      
      cohorts.push(cohort.rows[0]);
      console.log(`✅ Cohort created: ${cohort.rows[0].name}`);
    }
    
    // 4. Create Facilitators for each cohort
    console.log('\n4. Creating Facilitators...');
    const facilitators = [];
    
    const facilitatorData = [
      { name: 'John Facilitator', email: 'facilitator1@yzone.com', phone: '+919876543203' },
      { name: 'Jane Facilitator', email: 'facilitator2@yzone.com', phone: '+919876543204' },
      { name: 'Mike Facilitator', email: 'facilitator3@yzone.com', phone: '+919876543205' }
    ];
    
    for (let i = 0; i < facilitatorData.length; i++) {
      const facData = facilitatorData[i];
      const cohort = cohorts[i];
      const facPassword = await bcrypt.hash('facilitator123', 10);
      
      const facilitator = await pool.query(`
        INSERT INTO users (tenant_id, cohort_id, name, email, password_hash, role, phone, whatsapp_number, is_active)
        VALUES ($1, $2, $3, $4, $5, 'facilitator', $6, $6, true)
        ON CONFLICT (tenant_id, email) DO UPDATE SET 
          password_hash = $5, name = $3, cohort_id = $2
        RETURNING id, name, email, role
      `, [tenantId, cohort.id, facData.name, facData.email, facPassword, facData.phone]);
      
      // Assign facilitator to cohort
      await pool.query(`
        UPDATE cohorts SET facilitator_id = $1 WHERE id = $2
      `, [facilitator.rows[0].id, cohort.id]);
      
      facilitators.push({ ...facilitator.rows[0], cohort_id: cohort.id });
      console.log(`✅ Facilitator created: ${facilitator.rows[0].name} for ${cohort.name}`);
    }
    
    // 5. Create Industry Mentors
    console.log('\n5. Creating Industry Mentors...');
    const mentors = [];
    
    const mentorData = [
      { name: 'Alex Tech Mentor', email: 'mentor1@yzone.com', phone: '+919876543206' },
      { name: 'Lisa Code Mentor', email: 'mentor2@yzone.com', phone: '+919876543207' },
      { name: 'David AI Mentor', email: 'mentor3@yzone.com', phone: '+919876543208' },
      { name: 'Emma Data Mentor', email: 'mentor4@yzone.com', phone: '+919876543209' },
      { name: 'Ryan Full Stack Mentor', email: 'mentor5@yzone.com', phone: '+919876543210' }
    ];
    
    for (let i = 0; i < mentorData.length; i++) {
      const mentorInfo = mentorData[i];
      const cohort = cohorts[i % cohorts.length]; // Distribute mentors across cohorts
      const mentorPassword = await bcrypt.hash('mentor123', 10);
      
      const mentor = await pool.query(`
        INSERT INTO users (tenant_id, cohort_id, name, email, password_hash, role, phone, whatsapp_number, is_active)
        VALUES ($1, $2, $3, $4, $5, 'industryMentor', $6, $6, true)
        ON CONFLICT (tenant_id, email) DO UPDATE SET 
          password_hash = $5, name = $3, cohort_id = $2
        RETURNING id, name, email, role
      `, [tenantId, cohort.id, mentorInfo.name, mentorInfo.email, mentorPassword, mentorInfo.phone]);
      
      mentors.push({ ...mentor.rows[0], cohort_id: cohort.id });
      console.log(`✅ Mentor created: ${mentor.rows[0].name} for ${cohort.name}`);
    }
    
    // 6. Create Students
    console.log('\n6. Creating Students...');
    const students = [];
    
    const studentNames = [
      'Alice Johnson', 'Bob Smith', 'Carol Davis', 'David Wilson', 'Emma Brown',
      'Frank Miller', 'Grace Lee', 'Henry Taylor', 'Ivy Chen', 'Jack Anderson',
      'Kate Thompson', 'Liam Garcia', 'Mia Rodriguez', 'Noah Martinez', 'Olivia Lopez',
      'Paul Gonzalez', 'Quinn Perez', 'Ruby Sanchez', 'Sam Rivera', 'Tina Cooper'
    ];
    
    for (let i = 0; i < studentNames.length; i++) {
      const name = studentNames[i];
      const cohort = cohorts[i % cohorts.length]; // Distribute students across cohorts
      const email = `student${i + 1}@yzone.com`;
      const phone = `+9198765432${10 + i}`;
      const studentPassword = await bcrypt.hash('student123', 10);
      
      const student = await pool.query(`
        INSERT INTO users (tenant_id, cohort_id, name, email, password_hash, role, phone, whatsapp_number, is_active)
        VALUES ($1, $2, $3, $4, $5, 'student', $6, $6, true)
        ON CONFLICT (tenant_id, email) DO UPDATE SET 
          password_hash = $5, name = $3, cohort_id = $2
        RETURNING id, name, email, role
      `, [tenantId, cohort.id, name, email, studentPassword, phone]);
      
      students.push({ ...student.rows[0], cohort_id: cohort.id });
      console.log(`✅ Student created: ${student.rows[0].name} for ${cohort.name}`);
    }
    
    // 7. Create Projects
    console.log('\n7. Creating Projects...');
    const projects = [];
    
    for (const cohort of cohorts) {
      const projectNames = [
        `${cohort.name} - E-commerce Platform`,
        `${cohort.name} - Mobile App Development`,
        `${cohort.name} - Data Analytics Dashboard`
      ];
      
      for (const projectName of projectNames) {
        // Check if project exists with this structure (the existing projects table has different columns)
        const existingProject = await pool.query(`
          SELECT id FROM projects WHERE title = $1 AND cohort_id = $2
        `, [projectName, cohort.id]);
        
        if (existingProject.rows.length === 0) {
          const project = await pool.query(`
            INSERT INTO projects (cohort_id, title, type, status)
            VALUES ($1, $2, 'MAJOR', 'ACTIVE')
            RETURNING id, title
          `, [cohort.id, projectName]);
          
          projects.push({ ...project.rows[0], cohort_id: cohort.id });
          console.log(`✅ Project created: ${project.rows[0].title}`);
        }
      }
    }
    
    // 8. Create Teams
    console.log('\n8. Creating Teams...');
    const teams = [];
    
    for (const cohort of cohorts) {
      const cohortStudents = students.filter(s => s.cohort_id === cohort.id);
      const cohortMentors = mentors.filter(m => m.cohort_id === cohort.id);
      
      // Create 2-3 teams per cohort
      const teamNames = [`Team Alpha - ${cohort.cohort_code}`, `Team Beta - ${cohort.cohort_code}`, `Team Gamma - ${cohort.cohort_code}`];
      
      for (let i = 0; i < Math.min(teamNames.length, Math.ceil(cohortStudents.length / 3)); i++) {
        const teamName = teamNames[i];
        const mentor = cohortMentors[i % cohortMentors.length];
        
        const team = await pool.query(`
          INSERT INTO teams (cohort_id, tenant_id, project_id, name, mentor_id)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id, name
        `, [cohort.id, tenantId, '00000000-0000-0000-0000-000000000000', teamName, mentor?.id || null]);
        
        teams.push({ ...team.rows[0], cohort_id: cohort.id, mentor_id: mentor?.id });
        console.log(`✅ Team created: ${team.rows[0].name} with mentor: ${mentor?.name || 'None'}`);
        
        // Assign students to team
        const teamStudents = cohortStudents.slice(i * 3, (i + 1) * 3);
        for (const student of teamStudents) {
          await pool.query(`
            INSERT INTO team_members (team_id, student_id, role)
            VALUES ($1, $2, 'member')
            ON CONFLICT (team_id, student_id) DO NOTHING
          `, [team.rows[0].id, student.id]);
          
          // Create mentor assignments
          if (mentor) {
            await pool.query(`
              INSERT INTO mentor_assignments (mentor_id, student_id, tenant_id, cohort_id, team_id, is_active)
              VALUES ($1, $2, $3, $4, $5, true)
              ON CONFLICT (mentor_id, student_id, cohort_id) DO UPDATE SET 
                team_id = $5, is_active = true
            `, [mentor.id, student.id, tenantId, cohort.id, team.rows[0].id]);
          }
        }
      }
    }
    
    // 9. Create Sessions and Attendance
    console.log('\n9. Creating Sessions and Attendance...');
    
    for (const cohort of cohorts) {
      const facilitator = facilitators.find(f => f.cohort_id === cohort.id);
      const cohortStudents = students.filter(s => s.cohort_id === cohort.id);
      
      // Create sessions for the past week
      for (let i = 0; i < 7; i++) {
        const sessionDate = new Date();
        sessionDate.setDate(sessionDate.getDate() - i);
        
        const session = await pool.query(`
          INSERT INTO sessions (id, cohort_id, title, session_date)
          VALUES (gen_random_uuid(), $1, $2, $3)
          RETURNING id
        `, [cohort.id, `Day ${8-i} - Programming Fundamentals`, sessionDate.toISOString().split('T')[0]]);
        
        // Mark attendance for students (80% attendance rate)
        for (const student of cohortStudents) {
          const isPresent = Math.random() > 0.2; // 80% attendance
          await pool.query(`
            INSERT INTO attendance (id, session_id, student_id, marked_by, is_present)
            VALUES (gen_random_uuid(), $1, $2, $3, $4)
          `, [session.rows[0].id, student.id, facilitator?.id || student.id, isPresent]);
        }
      }
    }
    
    // 10. Create Tracker Entries
    console.log('\n10. Creating Tracker Entries...');
    
    for (const student of students) {
      // Create tracker entries for the past 5 days
      for (let i = 0; i < 5; i++) {
        const entryDate = new Date();
        entryDate.setDate(entryDate.getDate() - i);
        
        const shouldSubmit = Math.random() > 0.3; // 70% submission rate
        
        if (shouldSubmit) {
          await pool.query(`
            INSERT INTO tracker_entries (student_id, tenant_id, cohort_id, entry_date, tasks_completed, learning_summary, hours_spent, challenges)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (student_id, entry_date) DO NOTHING
          `, [
            student.id, 
            tenantId, 
            student.cohort_id, 
            entryDate.toISOString().split('T')[0],
            `Completed React components and API integration for day ${6-i}`,
            `Learned about state management and component lifecycle. Practiced with hooks and context API.`,
            Math.floor(Math.random() * 4) + 4, // 4-8 hours
            i === 0 ? 'Had some issues with async/await syntax' : null
          ]);
        }
      }
    }
    
    // 11. Create Leaderboard Data
    console.log('\n11. Creating Leaderboard Data...');
    
    for (const student of students) {
      const totalScore = Math.floor(Math.random() * 40) + 60; // 60-100 score
      const rank = Math.floor(Math.random() * 20) + 1;
      
      await pool.query(`
        INSERT INTO leaderboard (student_id, tenant_id, cohort_id, rank, total_score, tracker_consistency_score, performance_score, attendance_score, mentor_rating_score)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (cohort_id, student_id) DO UPDATE SET 
          rank = $4, total_score = $5, tracker_consistency_score = $6, performance_score = $7, attendance_score = $8, mentor_rating_score = $9
      `, [
        student.id, 
        tenantId, 
        student.cohort_id, 
        rank,
        totalScore,
        Math.floor(Math.random() * 20) + 15, // 15-35
        Math.floor(Math.random() * 20) + 15, // 15-35
        Math.floor(Math.random() * 15) + 10, // 10-25
        Math.floor(Math.random() * 10) + 5   // 5-15
      ]);
    }
    
    // 12. Create Mentor Reviews
    console.log('\n12. Creating Mentor Reviews...');
    
    for (const mentor of mentors) {
      const mentorStudents = students.filter(s => s.cohort_id === mentor.cohort_id);
      
      for (const student of mentorStudents.slice(0, 3)) { // Review first 3 students per mentor
        await pool.query(`
          INSERT INTO mentor_reviews (mentor_id, student_id, tenant_id, cohort_id, rating, feedback, review_date)
          VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE)
          ON CONFLICT DO NOTHING
        `, [
          mentor.id,
          student.id,
          tenantId,
          mentor.cohort_id,
          (Math.random() * 2 + 3).toFixed(1), // 3.0-5.0 rating
          `${student.name} shows great progress in programming concepts. Needs to work on problem-solving skills.`
        ]);
      }
    }
    
    console.log('\n🎉 Comprehensive test data created successfully!');
    console.log('\n📋 DASHBOARD CREDENTIALS:');
    console.log('========================');
    console.log('🔵 TYN EXECUTIVE DASHBOARD:');
    console.log('   Email: executive@yzone.com');
    console.log('   Password: executive123');
    console.log('   URL: http://localhost:5173/executive/dashboard');
    console.log('');
    console.log('🟢 FACILITATOR DASHBOARDS:');
    console.log('   1. Email: facilitator1@yzone.com | Password: facilitator123 (AI & ML Batch)');
    console.log('   2. Email: facilitator2@yzone.com | Password: facilitator123 (Full Stack Batch)');
    console.log('   3. Email: facilitator3@yzone.com | Password: facilitator123 (Data Science Batch)');
    console.log('   URL: http://localhost:5173/facilitator/dashboard');
    console.log('');
    console.log('🟡 FACULTY PRINCIPAL DASHBOARD:');
    console.log('   Email: faculty@yzone.com');
    console.log('   Password: faculty123');
    console.log('   URL: http://localhost:5173/faculty/dashboard');
    console.log('');
    console.log('🟣 INDUSTRY MENTOR DASHBOARDS:');
    console.log('   1. Email: mentor1@yzone.com | Password: mentor123');
    console.log('   2. Email: mentor2@yzone.com | Password: mentor123');
    console.log('   3. Email: mentor3@yzone.com | Password: mentor123');
    console.log('   4. Email: mentor4@yzone.com | Password: mentor123');
    console.log('   5. Email: mentor5@yzone.com | Password: mentor123');
    console.log('   URL: http://localhost:5173/mentor/dashboard');
    console.log('');
    console.log('🔴 STUDENT DASHBOARDS:');
    console.log('   Email: student1@yzone.com to student20@yzone.com');
    console.log('   Password: student123 (for all students)');
    console.log('   URL: http://localhost:5173/student/dashboard');
    console.log('');
    console.log('📊 DATA SUMMARY:');
    console.log(`   - Cohorts: ${cohorts.length}`);
    console.log(`   - Students: ${students.length}`);
    console.log(`   - Mentors: ${mentors.length}`);
    console.log(`   - Facilitators: ${facilitators.length}`);
    console.log(`   - Teams: ${teams.length}`);
    console.log('   - Sessions with attendance data');
    console.log('   - Tracker entries for past 5 days');
    console.log('   - Leaderboard rankings');
    console.log('   - Mentor reviews');
    
  } catch (error) {
    console.error('❌ Error creating test data:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the script
createComprehensiveTestData().catch(console.error);