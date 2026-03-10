import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

async function testMentorDashboard() {
  try {
    console.log('🧪 Testing Industry Mentor Dashboard');
    console.log('=====================================\n');

    // Test with all mentors
    const mentors = [
      { email: 'mentor1@yzone.com', name: 'Mentor 1' },
      { email: 'mentor2@yzone.com', name: 'Mentor 2' },
      { email: 'mentor3@yzone.com', name: 'Mentor 3' },
      { email: 'mentor4@yzone.com', name: 'Mentor 4' },
      { email: 'mentor5@yzone.com', name: 'Mentor 5' }
    ];

    for (const mentor of mentors) {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`Testing ${mentor.name} (${mentor.email})`);
      console.log('='.repeat(50));

      try {
        // Login
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
          email: mentor.email,
          password: 'mentor123'
        });

        const token = loginResponse.data.data.token;
        const user = loginResponse.data.data.user;
        console.log(`✅ Login successful`);
        console.log(`   Name: ${user.name}`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Tenant ID: ${user.tenantId}`);

        const headers = { Authorization: `Bearer ${token}` };

        // Test Dashboard
        console.log('\n📊 Testing Dashboard Endpoint...');
        try {
          const dashboardResponse = await axios.get(`${BASE_URL}/mentor/dashboard`, { headers });
          
          console.log('✅ Dashboard loaded successfully');
          const stats = dashboardResponse.data.data?.stats;
          const students = dashboardResponse.data.data?.students;

          console.log('\n   Stats:');
          console.log(`   - Total Students: ${stats?.totalStudents || 0}`);
          console.log(`   - Active Students: ${stats?.activeStudents || 0}`);
          console.log(`   - Average Score: ${stats?.avgScore ? stats.avgScore.toFixed(2) : 'N/A'}`);

          console.log(`\n   Assigned Students: ${students?.length || 0}`);
          if (students && students.length > 0) {
            students.forEach((student: any, index: number) => {
              console.log(`   ${index + 1}. ${student.name}`);
              console.log(`      Cohort: ${student.cohort_name || 'N/A'}`);
              console.log(`      Score: ${student.score || 'N/A'}`);
              console.log(`      Rank: ${student.rank || 'N/A'}`);
              console.log(`      Recent Trackers: ${student.recent_trackers || 0}`);
            });
          }
        } catch (dashError: any) {
          console.log('❌ Dashboard failed');
          console.log(`   Status: ${dashError.response?.status}`);
          console.log(`   Error: ${dashError.response?.data?.message || dashError.message}`);
          if (dashError.response?.data) {
            console.log(`   Full error:`, JSON.stringify(dashError.response.data, null, 2));
          }
        }

        // Test Assigned Students
        console.log('\n👥 Testing Assigned Students Endpoint...');
        try {
          const studentsResponse = await axios.get(`${BASE_URL}/mentor/assigned-students`, { headers });
          
          console.log('✅ Assigned students loaded');
          console.log(`   Total: ${studentsResponse.data.data?.length || 0}`);
          
          if (studentsResponse.data.data && studentsResponse.data.data.length > 0) {
            studentsResponse.data.data.forEach((student: any, index: number) => {
              console.log(`   ${index + 1}. ${student.name} (${student.cohort_name})`);
            });
          }
        } catch (studError: any) {
          console.log('❌ Assigned students failed');
          console.log(`   Status: ${studError.response?.status}`);
          console.log(`   Error: ${studError.response?.data?.message || studError.message}`);
        }

        // Check mentor_assignments table
        console.log('\n🔍 Checking mentor_assignments in database...');
        const { pool } = require('../src/config/db');
        const assignmentsResult = await pool.query(
          `SELECT ma.*, u.name as student_name, c.name as cohort_name
           FROM mentor_assignments ma
           JOIN users u ON ma.student_id = u.id
           LEFT JOIN cohorts c ON ma.cohort_id = c.id
           WHERE ma.mentor_id = $1 AND ma.is_active = true`,
          [user.id]
        );

        console.log(`   Assignments in DB: ${assignmentsResult.rows.length}`);
        if (assignmentsResult.rows.length > 0) {
          assignmentsResult.rows.forEach((row: any, index: number) => {
            console.log(`   ${index + 1}. ${row.student_name} (${row.cohort_name})`);
          });
        }

      } catch (error: any) {
        console.log(`❌ Failed to test ${mentor.name}`);
        console.log(`   Error: ${error.message}`);
      }
    }

    console.log('\n\n🎉 Testing Complete!\n');

  } catch (error: any) {
    console.error('\n❌ Test failed:');
    console.error(error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testMentorDashboard().catch(console.error);
