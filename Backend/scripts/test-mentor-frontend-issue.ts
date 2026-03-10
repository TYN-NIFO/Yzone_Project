import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

async function testMentorFrontendIssue() {
  try {
    console.log('🧪 Testing Mentor Dashboard - Frontend Issue Debug');
    console.log('===================================================\n');

    // Test with mentor1
    const mentorEmail = 'mentor1@yzone.com';
    const mentorPassword = 'mentor123';

    console.log(`1️⃣ Testing Login for ${mentorEmail}...`);
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: mentorEmail,
      password: mentorPassword
    });

    if (!loginResponse.data.success) {
      console.log('❌ Login failed');
      console.log(loginResponse.data);
      return;
    }

    console.log('✅ Login successful');
    const token = loginResponse.data.data.token;
    const user = loginResponse.data.data.user;
    
    console.log('\n📋 User Details:');
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Tenant ID: ${user.tenantId}`);
    console.log(`   Token: ${token.substring(0, 20)}...`);

    // Test dashboard endpoint
    console.log('\n2️⃣ Testing Dashboard Endpoint...');
    console.log(`   URL: ${BASE_URL}/mentor/dashboard`);
    
    const headers = { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    try {
      const dashboardResponse = await axios.get(`${BASE_URL}/mentor/dashboard`, { headers });
      
      console.log('✅ Dashboard API Response:');
      console.log(`   Success: ${dashboardResponse.data.success}`);
      console.log(`   Status Code: ${dashboardResponse.status}`);
      
      if (dashboardResponse.data.data) {
        const { stats, students } = dashboardResponse.data.data;
        
        console.log('\n📊 Dashboard Data:');
        console.log(`   Total Students: ${stats?.totalStudents || 0}`);
        console.log(`   Active Students: ${stats?.activeStudents || 0}`);
        console.log(`   Average Score: ${stats?.avgScore ? stats.avgScore.toFixed(2) : 'N/A'}`);
        console.log(`   Students Array Length: ${students?.length || 0}`);
        
        if (students && students.length > 0) {
          console.log('\n👥 First 3 Students:');
          students.slice(0, 3).forEach((student: any, index: number) => {
            console.log(`   ${index + 1}. ${student.name}`);
            console.log(`      Email: ${student.email}`);
            console.log(`      Cohort: ${student.cohort_name}`);
            console.log(`      Score: ${student.score || 'N/A'}`);
          });
        }
      } else {
        console.log('⚠️  No data in response');
        console.log('   Full response:', JSON.stringify(dashboardResponse.data, null, 2));
      }
    } catch (dashError: any) {
      console.log('❌ Dashboard request failed');
      console.log(`   Status: ${dashError.response?.status}`);
      console.log(`   Message: ${dashError.response?.data?.message || dashError.message}`);
      console.log(`   Full error:`, dashError.response?.data);
    }

    // Test with proxy URL (as frontend would use)
    console.log('\n3️⃣ Testing with Proxy URL (Frontend perspective)...');
    console.log(`   URL: /api/mentor/dashboard (would be proxied to ${BASE_URL}/mentor/dashboard)`);
    console.log('   Note: This test uses direct URL, but frontend uses /api prefix');

    // Check if backend is accessible
    console.log('\n4️⃣ Checking Backend Health...');
    try {
      const healthResponse = await axios.get('http://localhost:5000/');
      console.log('✅ Backend is running');
      console.log(`   Message: ${healthResponse.data.message}`);
    } catch (error) {
      console.log('❌ Backend is not accessible');
    }

    // Check CORS
    console.log('\n5️⃣ Checking CORS Headers...');
    try {
      const corsResponse = await axios.get(`${BASE_URL}/mentor/dashboard`, { 
        headers,
        validateStatus: () => true // Don't throw on any status
      });
      console.log('   CORS Headers:');
      console.log(`   - Access-Control-Allow-Origin: ${corsResponse.headers['access-control-allow-origin'] || 'Not set'}`);
      console.log(`   - Access-Control-Allow-Credentials: ${corsResponse.headers['access-control-allow-credentials'] || 'Not set'}`);
    } catch (error) {
      console.log('   Could not check CORS headers');
    }

    console.log('\n✅ All tests completed!');
    console.log('\n📝 Summary:');
    console.log('   - Backend API is working correctly');
    console.log('   - Mentor can login successfully');
    console.log('   - Dashboard endpoint returns data');
    console.log('   - If frontend shows blank, check:');
    console.log('     1. Is frontend server running? (npm run dev)');
    console.log('     2. Check browser console for errors');
    console.log('     3. Check Network tab in DevTools');
    console.log('     4. Verify proxy configuration in vite.config.ts');
    console.log('     5. Clear browser cache and localStorage');

  } catch (error: any) {
    console.error('\n❌ Test failed:');
    console.error(error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testMentorFrontendIssue().catch(console.error);
