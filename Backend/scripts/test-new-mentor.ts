import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

async function testNewMentor() {
  try {
    console.log('🧪 Testing New Mentor Creation and Dashboard\n');

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

    // Step 2: Create a new mentor
    console.log('2. Creating new mentor...');
    const newMentorData = {
      name: 'Test New Mentor',
      email: `testmentor${Date.now()}@yzone.com`,
      password: 'mentor123',
      phone: '+919999999999',
      whatsapp_number: '+919999999999',
      cohort_id: cohortId
    };

    try {
      const createResponse = await axios.post(
        `${BASE_URL}/facilitator/mentors`,
        newMentorData,
        { headers: { Authorization: `Bearer ${facilitatorToken}` } }
      );

      console.log('✅ Mentor created successfully');
      console.log(`   Name: ${createResponse.data.mentor.name}`);
      console.log(`   Email: ${createResponse.data.mentor.email}`);
      console.log(`   ID: ${createResponse.data.mentor.id}\n`);

      const newMentorEmail = createResponse.data.mentor.email;

      // Step 3: Login as the new mentor
      console.log('3. Login as new mentor...');
      const mentorLogin = await axios.post(`${BASE_URL}/auth/login`, {
        email: newMentorEmail,
        password: 'mentor123'
      });

      const mentorToken = mentorLogin.data.data.token;
      console.log('✅ New mentor logged in\n');

      // Step 4: Check dashboard
      console.log('4. Checking new mentor dashboard...');
      const dashboardResponse = await axios.get(`${BASE_URL}/mentor/dashboard`, {
        headers: { Authorization: `Bearer ${mentorToken}` }
      });

      console.log('✅ Dashboard loaded');
      const stats = dashboardResponse.data.data.stats;
      const students = dashboardResponse.data.data.students;

      console.log('\n📊 Dashboard Data:');
      console.log(`   Total Students: ${stats.totalStudents}`);
      console.log(`   Active Students: ${stats.activeStudents}`);
      console.log(`   Average Score: ${stats.avgScore || 'N/A'}`);
      console.log(`   Assigned Students: ${students.length}`);

      if (students.length === 0) {
        console.log('\n⚠️  NEW MENTOR HAS NO ASSIGNED STUDENTS');
        console.log('   This is expected - mentor needs to be assigned to teams/students');
        console.log('   Dashboard should show zeros, not errors');
      }

    } catch (createError: any) {
      console.log('❌ Failed to create mentor:', createError.response?.data || createError.message);
    }

    console.log('\n🎉 Test Complete!\n');

  } catch (error: any) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testNewMentor();
