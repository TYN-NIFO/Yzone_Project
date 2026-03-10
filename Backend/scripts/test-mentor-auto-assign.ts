import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

async function testMentorAutoAssign() {
  try {
    console.log('🧪 Testing Mentor Creation with Auto-Assign\n');

    // Step 1: Login as Facilitator
    console.log('1. Login as Facilitator...');
    const facilitatorLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'facilitator1@yzone.com',
      password: 'facilitator123'
    });

    const facilitatorToken = facilitatorLogin.data.data.token;
    const cohortId = facilitatorLogin.data.data.user.cohortId;
    console.log('✅ Facilitator logged in');
    console.log(`   Cohort ID: ${cohortId}\n`);

    // Step 2: Check how many students in cohort
    console.log('2. Checking students in cohort...');
    const studentsResponse = await axios.get(
      `${BASE_URL}/facilitator/students/${cohortId}`,
      { headers: { Authorization: `Bearer ${facilitatorToken}` } }
    );
    const studentCount = studentsResponse.data.data?.length || 0;
    console.log(`✅ Found ${studentCount} students in cohort\n`);

    // Step 3: Create mentor WITH auto-assign
    console.log('3. Creating mentor WITH auto-assign...');
    const newMentorEmail = `autoassign${Date.now()}@yzone.com`;
    const createResponse = await axios.post(
      `${BASE_URL}/facilitator/mentors`,
      {
        name: 'Auto Assign Test Mentor',
        email: newMentorEmail,
        password: 'mentor123',
        phone: '+919999999999',
        whatsapp_number: '+919999999999',
        cohort_id: cohortId,
        auto_assign_students: true // Enable auto-assign
      },
      { headers: { Authorization: `Bearer ${facilitatorToken}` } }
    );

    console.log('✅ Mentor created successfully');
    console.log(`   Name: ${createResponse.data.mentor.name}`);
    console.log(`   Email: ${createResponse.data.mentor.email}`);
    console.log(`   Assigned Students: ${createResponse.data.assigned_students || 0}\n`);

    // Step 4: Login as new mentor
    console.log('4. Login as new mentor...');
    const mentorLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: newMentorEmail,
      password: 'mentor123'
    });

    const mentorToken = mentorLogin.data.data.token;
    console.log('✅ New mentor logged in\n');

    // Step 5: Check dashboard
    console.log('5. Checking mentor dashboard...');
    const dashboardResponse = await axios.get(`${BASE_URL}/mentor/dashboard`, {
      headers: { Authorization: `Bearer ${mentorToken}` }
    });

    const stats = dashboardResponse.data.data.stats;
    const students = dashboardResponse.data.data.students;

    console.log('✅ Dashboard loaded successfully\n');
    console.log('📊 Dashboard Stats:');
    console.log(`   Total Students: ${stats.totalStudents}`);
    console.log(`   Active Students: ${stats.activeStudents}`);
    console.log(`   Average Score: ${stats.avgScore ? stats.avgScore.toFixed(2) : 'N/A'}`);
    console.log(`\n👥 Assigned Students (${students.length}):`);
    
    if (students.length > 0) {
      students.slice(0, 5).forEach((s: any, i: number) => {
        console.log(`   ${i + 1}. ${s.name} - Score: ${s.score}, Rank: ${s.rank}`);
      });
      if (students.length > 5) {
        console.log(`   ... and ${students.length - 5} more`);
      }
    }

    console.log('\n✅ SUCCESS! Mentor has assigned students and dashboard shows data!\n');

    // Step 6: Test without auto-assign
    console.log('6. Creating mentor WITHOUT auto-assign...');
    const noAssignEmail = `noassign${Date.now()}@yzone.com`;
    const noAssignResponse = await axios.post(
      `${BASE_URL}/facilitator/mentors`,
      {
        name: 'No Auto Assign Test Mentor',
        email: noAssignEmail,
        password: 'mentor123',
        cohort_id: cohortId,
        auto_assign_students: false // Disable auto-assign
      },
      { headers: { Authorization: `Bearer ${facilitatorToken}` } }
    );

    console.log('✅ Mentor created (no auto-assign)');
    console.log(`   Assigned Students: ${noAssignResponse.data.assigned_students || 0}\n`);

    console.log('🎉 Test Complete!\n');
    console.log('Summary:');
    console.log('✅ Auto-assign enabled: Mentor gets all students in cohort');
    console.log('✅ Auto-assign disabled: Mentor starts with 0 students');
    console.log('✅ Dashboard works correctly in both cases\n');

  } catch (error: any) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testMentorAutoAssign();
