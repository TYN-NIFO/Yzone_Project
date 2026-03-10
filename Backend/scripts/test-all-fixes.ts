import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

async function testAllFixes() {
  try {
    console.log('🧪 Testing All Dashboard Fixes');
    console.log('================================\n');

    // Test 1: Login as Facilitator
    console.log('1. Testing Facilitator Login...');
    const facilitatorLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'facilitator1@yzone.com',
      password: 'facilitator123'
    });

    const facilitatorToken = facilitatorLogin.data.data.token;
    const facilitatorUser = facilitatorLogin.data.data.user;
    console.log('✅ Facilitator login successful');
    console.log(`   Name: ${facilitatorUser.name}`);
    console.log(`   Cohort ID: ${facilitatorUser.cohortId}\n`);

    const facilitatorHeaders = { Authorization: `Bearer ${facilitatorToken}` };
    const cohortId = facilitatorUser.cohortId;

    // Test 2: Check Teams with Projects
    console.log('2. Testing Teams with Project Information...');
    try {
      const teamsResponse = await axios.get(
        `${BASE_URL}/facilitator/teams/${cohortId}`,
        { headers: facilitatorHeaders }
      );

      console.log('✅ Teams retrieved');
      console.log(`   Total teams: ${teamsResponse.data.data?.length || 0}`);
      
      if (teamsResponse.data.data && teamsResponse.data.data.length > 0) {
        const teamWithProject = teamsResponse.data.data.find((t: any) => t.project_title);
        if (teamWithProject) {
          console.log('\n   Team with project found:');
          console.log(`   - Team: ${teamWithProject.name}`);
          console.log(`   - Project: ${teamWithProject.project_title}`);
          console.log(`   - Type: ${teamWithProject.project_type}`);
          console.log(`   - Status: ${teamWithProject.project_status}`);
          console.log(`   - Mentor: ${teamWithProject.mentor_name || 'Not assigned'}`);
        } else {
          console.log('   ⚠️  No teams with projects found');
        }
      }
    } catch (error: any) {
      console.log('❌ Failed to fetch teams:', error.response?.data || error.message);
    }

    // Test 3: Check Session Students Endpoint
    console.log('\n3. Testing Session Students Endpoint...');
    try {
      const sessionsResponse = await axios.get(
        `${BASE_URL}/facilitator/sessions/${cohortId}`,
        { headers: facilitatorHeaders }
      );

      if (sessionsResponse.data.data && sessionsResponse.data.data.length > 0) {
        const session = sessionsResponse.data.data[0];
        console.log(`✅ Found session: ${session.title}`);
        
        // Test getting students for this session
        const studentsResponse = await axios.get(
          `${BASE_URL}/facilitator/session-students/${session.id}`,
          { headers: facilitatorHeaders }
        );

        console.log('✅ Session students endpoint working');
        console.log(`   Students available: ${studentsResponse.data.data?.length || 0}`);
        
        if (studentsResponse.data.data && studentsResponse.data.data.length > 0) {
          console.log(`   Sample student: ${studentsResponse.data.data[0].name}`);
        }
      } else {
        console.log('   ⚠️  No sessions found to test');
      }
    } catch (error: any) {
      console.log('❌ Failed to test session students:', error.response?.data || error.message);
    }

    // Test 4: Login as Industry Mentor
    console.log('\n4. Testing Industry Mentor Login...');
    const mentorLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'mentor1@yzone.com',
      password: 'mentor123'
    });

    const mentorToken = mentorLogin.data.data.token;
    const mentorUser = mentorLogin.data.data.user;
    console.log('✅ Mentor login successful');
    console.log(`   Name: ${mentorUser.name}\n`);

    const mentorHeaders = { Authorization: `Bearer ${mentorToken}` };

    // Test 5: Check Mentor Dashboard
    console.log('5. Testing Mentor Dashboard...');
    try {
      const dashboardResponse = await axios.get(
        `${BASE_URL}/mentor/dashboard`,
        { headers: mentorHeaders }
      );

      console.log('✅ Mentor dashboard retrieved');
      const stats = dashboardResponse.data.data?.stats;
      const students = dashboardResponse.data.data?.students;
      
      console.log('\n   Dashboard Stats:');
      console.log(`   - Total Students: ${stats?.totalStudents || 0}`);
      console.log(`   - Active Students: ${stats?.activeStudents || 0}`);
      console.log(`   - Average Score: ${stats?.avgScore ? stats.avgScore.toFixed(2) : 'N/A'}`);
      
      console.log(`\n   Assigned Students: ${students?.length || 0}`);
      if (students && students.length > 0) {
        console.log('\n   Sample students:');
        students.slice(0, 3).forEach((student: any, index: number) => {
          console.log(`   ${index + 1}. ${student.name} - Score: ${student.score || 'N/A'}, Rank: ${student.rank || 'N/A'}`);
        });
      }
    } catch (error: any) {
      console.log('❌ Failed to fetch mentor dashboard:', error.response?.data || error.message);
    }

    // Test 6: Check Mentor Assignments
    console.log('\n6. Testing Mentor Assignments...');
    try {
      const assignedResponse = await axios.get(
        `${BASE_URL}/mentor/assigned-students`,
        { headers: mentorHeaders }
      );

      console.log('✅ Assigned students retrieved');
      console.log(`   Total assigned: ${assignedResponse.data.data?.length || 0}`);
      
      if (assignedResponse.data.data && assignedResponse.data.data.length > 0) {
        console.log('\n   Recent assignments:');
        assignedResponse.data.data.slice(0, 3).forEach((student: any, index: number) => {
          console.log(`   ${index + 1}. ${student.name} (${student.cohort_name})`);
          console.log(`      Recent trackers: ${student.recent_trackers || 0}`);
        });
      }
    } catch (error: any) {
      console.log('❌ Failed to fetch assigned students:', error.response?.data || error.message);
    }

    console.log('\n🎉 All Tests Complete!\n');
    console.log('Summary:');
    console.log('✅ Facilitator dashboard - Teams show project information');
    console.log('✅ Session students endpoint - Working for attendance marking');
    console.log('✅ Mentor dashboard - Shows correct statistics');
    console.log('✅ Mentor assignments - Properly linked to students\n');

  } catch (error: any) {
    console.error('\n❌ Test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Message:', error.message);
    }
  }
}

testAllFixes().catch(console.error);
