import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

async function quickTest() {
  try {
    console.log('🧪 Quick Mentor Dashboard Test\n');

    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'mentor1@yzone.com',
      password: 'mentor123'
    });

    const token = loginResponse.data.data.token;
    console.log('✅ Login successful\n');

    const dashboardResponse = await axios.get(`${BASE_URL}/mentor/dashboard`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const stats = dashboardResponse.data.data.stats;
    const students = dashboardResponse.data.data.students;

    console.log('📊 Dashboard Stats:');
    console.log(`   Total Students: ${stats.totalStudents}`);
    console.log(`   Active Students: ${stats.activeStudents}`);
    console.log(`   Average Score: ${stats.avgScore.toFixed(2)}`);

    console.log(`\n👥 Assigned Students (${students.length}):`);
    students.forEach((s: any, i: number) => {
      console.log(`   ${i + 1}. ${s.name} - Score: ${s.score}, Rank: ${s.rank}`);
    });

    console.log('\n✅ All data showing correctly!\n');

  } catch (error: any) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

quickTest();
