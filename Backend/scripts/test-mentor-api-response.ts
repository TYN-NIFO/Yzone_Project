import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

async function testMentorAPIResponse() {
  try {
    console.log('🧪 Testing Mentor Dashboard API Response\n');
    console.log('This simulates exactly what the frontend receives\n');

    // Login
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'mentor1@yzone.com',
      password: 'mentor123'
    });

    const token = loginResponse.data.data.token;
    console.log('✅ Login successful\n');

    // Get dashboard (exactly as frontend does)
    const dashboardResponse = await axios.get(`${BASE_URL}/mentor/dashboard`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('📊 Full API Response:');
    console.log(JSON.stringify(dashboardResponse.data, null, 2));

    console.log('\n📋 Parsed Data:');
    const data = dashboardResponse.data.data;
    console.log('Stats:', data.stats);
    console.log('Students count:', data.students?.length);

    console.log('\n✅ What Frontend Should Display:');
    console.log(`Total Students: ${data.stats.totalStudents}`);
    console.log(`Active Students: ${data.stats.activeStudents}`);
    console.log(`Average Score: ${data.stats.avgScore.toFixed(2)}`);
    console.log(`\nAssigned Students (${data.students.length}):`);
    data.students.forEach((s: any, i: number) => {
      console.log(`${i + 1}. ${s.name} - Score: ${s.score}, Rank: ${s.rank}`);
    });

  } catch (error: any) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testMentorAPIResponse();
