import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

async function testStudentFacultyFeedback() {
  try {
    console.log('🧪 Testing Student Faculty Feedback Display');
    console.log('============================================\n');

    // Login as Alice Johnson
    console.log('1️⃣ Logging in as Alice Johnson (student1@yzone.com)...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'student1@yzone.com',
      password: 'password123'
    });

    if (!loginResponse.data.success) {
      console.log('❌ Login failed');
      return;
    }

    console.log('✅ Login successful');
    const token = loginResponse.data.data.token;
    const user = loginResponse.data.data.user;
    
    console.log('\n📋 User Details:');
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Tenant ID: ${user.tenantId}`);

    // Get dashboard data
    console.log('\n2️⃣ Fetching student dashboard...');
    const dashboardResponse = await axios.get(`${BASE_URL}/student/dashboard`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!dashboardResponse.data.success) {
      console.log('❌ Dashboard fetch failed');
      return;
    }

    console.log('✅ Dashboard loaded successfully');
    const data = dashboardResponse.data.data;

    console.log('\n📊 Dashboard Data:');
    console.log(`   Mentor Feedback: ${data.mentorFeedback?.length || 0} items`);
    console.log(`   Faculty Feedback: ${data.facultyFeedback?.length || 0} items`);

    if (data.facultyFeedback && data.facultyFeedback.length > 0) {
      console.log('\n✅ Faculty Feedback Found:');
      data.facultyFeedback.forEach((feedback: any, index: number) => {
        console.log(`\n   ${index + 1}. From: ${feedback.faculty_name}`);
        console.log(`      Academic Rating: ${feedback.academic_rating}/5`);
        console.log(`      Behavior Rating: ${feedback.behavior_rating}/5`);
        console.log(`      Participation Rating: ${feedback.participation_rating}/5`);
        console.log(`      Feedback: ${feedback.feedback}`);
        console.log(`      Date: ${feedback.feedback_date}`);
      });
    } else {
      console.log('\n❌ No faculty feedback found in dashboard response');
    }

    // Check database directly
    console.log('\n3️⃣ Checking database directly...');
    const { pool } = require('../src/config/db');
    const dbResult = await pool.query(
      `SELECT ff.*, u.name as faculty_name
       FROM faculty_feedback ff
       JOIN users u ON ff.faculty_id = u.id
       WHERE ff.student_id = $1
       ORDER BY ff.feedback_date DESC`,
      [user.id]
    );

    console.log(`   Faculty feedback in DB: ${dbResult.rows.length} items`);
    if (dbResult.rows.length > 0) {
      dbResult.rows.forEach((row: any, index: number) => {
        console.log(`\n   ${index + 1}. From: ${row.faculty_name}`);
        console.log(`      Feedback: ${row.feedback}`);
        console.log(`      Date: ${row.feedback_date}`);
      });
    }

  } catch (error: any) {
    console.error('\n❌ Test failed:');
    console.error(error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testStudentFacultyFeedback().catch(console.error);
