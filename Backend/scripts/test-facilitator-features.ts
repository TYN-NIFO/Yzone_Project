import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

async function testFacilitatorFeatures() {
  try {
    console.log('🧪 Testing Facilitator Features');
    console.log('================================');
    
    // Login as facilitator
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'facilitator1@yzone.com',
      password: 'facilitator123'
    });
    
    const token = loginResponse.data.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    
    console.log('✅ Login successful');
    
    // Get dashboard to get cohort ID
    const dashboardResponse = await axios.get(`${BASE_URL}/facilitator/dashboard`, { headers });
    const cohortId = dashboardResponse.data.data.cohorts?.[0]?.id;
    
    console.log(`✅ Cohort ID: ${cohortId}`);
    
    // Test 1: Create Mentor
    console.log('\n1. Testing Mentor Creation...');
    try {
      const mentorData = {
        name: `Test Mentor ${Date.now()}`,
        email: `testmentor${Date.now()}@example.com`,
        password: 'password123',
        phone: '+919876543299',
        whatsapp_number: '+919876543299',
        cohort_id: cohortId
      };
      
      const mentorResponse = await axios.post(`${BASE_URL}/facilitator/mentors`, mentorData, { headers });
      console.log('✅ Mentor creation successful');
      console.log(`   Mentor ID: ${mentorResponse.data.mentor.id}`);
    } catch (error: any) {
      console.log('❌ Mentor creation failed:', error.response?.data || error.message);
    }
    
    // Test 2: Create Session
    console.log('\n2. Testing Session Creation...');
    try {
      const sessionData = {
        cohortId: cohortId,
        title: `Test Session ${Date.now()}`,
        sessionDate: new Date().toISOString().split('T')[0],
        description: 'Test session for verification'
      };
      
      const sessionResponse = await axios.post(`${BASE_URL}/facilitator/sessions`, sessionData, { headers });
      console.log('✅ Session creation successful');
      console.log(`   Session ID: ${sessionResponse.data.data.id}`);
    } catch (error: any) {
      console.log('❌ Session creation failed:', error.response?.data || error.message);
    }
    
    // Test 3: Get Sessions
    console.log('\n3. Testing Get Sessions...');
    try {
      const sessionsResponse = await axios.get(`${BASE_URL}/facilitator/sessions/${cohortId}`, { headers });
      console.log('✅ Get sessions successful');
      console.log(`   Total sessions: ${sessionsResponse.data.data?.length || 0}`);
    } catch (error: any) {
      console.log('❌ Get sessions failed:', error.response?.data || error.message);
    }
    
    // Test 4: Mark Daily Attendance
    console.log('\n4. Testing Daily Attendance...');
    try {
      // Get students first
      const studentsResponse = await axios.get(`${BASE_URL}/facilitator/students/${cohortId}`, { headers });
      const students = studentsResponse.data.data || [];
      
      if (students.length > 0) {
        const attendanceData = {
          date: new Date().toISOString().split('T')[0],
          attendance: students.slice(0, 3).map((student: any) => ({
            studentId: student.id,
            isPresent: Math.random() > 0.3 // 70% present
          }))
        };
        
        const attendanceResponse = await axios.post(`${BASE_URL}/facilitator/attendance/daily`, attendanceData, { headers });
        console.log('✅ Daily attendance marking successful');
        console.log(`   Marked: ${attendanceResponse.data.markedCount} students`);
      } else {
        console.log('⚠️  No students found to mark attendance');
      }
    } catch (error: any) {
      console.log('❌ Daily attendance failed:', error.response?.data || error.message);
    }
    
    // Test 5: Get Daily Attendance
    console.log('\n5. Testing Get Daily Attendance...');
    try {
      const today = new Date().toISOString().split('T')[0];
      const dailyAttendanceResponse = await axios.get(`${BASE_URL}/facilitator/attendance/daily?date=${today}`, { headers });
      console.log('✅ Get daily attendance successful');
      console.log(`   Students: ${dailyAttendanceResponse.data.data?.students?.length || 0}`);
    } catch (error: any) {
      console.log('❌ Get daily attendance failed:', error.response?.data || error.message);
    }
    
    console.log('\n🎉 Facilitator Features Testing Complete!');
    
  } catch (error: any) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testFacilitatorFeatures().catch(console.error);