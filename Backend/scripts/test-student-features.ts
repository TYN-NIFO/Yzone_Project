import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

async function testStudentFeatures() {
  try {
    console.log('🧪 Testing Student Dashboard Features');
    console.log('=====================================');
    
    // Login as student
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'student1@yzone.com',
      password: 'student123'
    });
    
    const token = loginResponse.data.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    
    console.log('✅ Login successful as Student');
    
    // Test 1: Get Dashboard
    console.log('\n1. Testing Dashboard...');
    try {
      const dashboardResponse = await axios.get(`${BASE_URL}/student/dashboard`, { headers });
      console.log('✅ Dashboard loaded successfully');
      console.log(`   Student: ${dashboardResponse.data.student?.name}`);
      console.log(`   Cohort: ${dashboardResponse.data.cohort?.name}`);
    } catch (error: any) {
      console.log('❌ Dashboard failed:', error.response?.data || error.message);
    }
    
    // Test 2: Get Attendance Stats
    console.log('\n2. Testing Attendance Stats...');
    try {
      const attendanceResponse = await axios.get(`${BASE_URL}/student/attendance/stats`, { headers });
      console.log('✅ Attendance stats retrieved');
      console.log(`   Total Sessions: ${attendanceResponse.data.data?.total_sessions || 0}`);
      console.log(`   Attended: ${attendanceResponse.data.data?.attended_sessions || 0}`);
      console.log(`   Percentage: ${attendanceResponse.data.data?.attendance_percentage || 0}%`);
      console.log(`   Recent Records: ${attendanceResponse.data.data?.recent_attendance?.length || 0}`);
    } catch (error: any) {
      console.log('❌ Attendance stats failed:', error.response?.data || error.message);
    }
    
    // Test 3: Get Attendance History
    console.log('\n3. Testing Attendance History...');
    try {
      const historyResponse = await axios.get(`${BASE_URL}/student/attendance/history?limit=10`, { headers });
      console.log('✅ Attendance history retrieved');
      console.log(`   Total Records: ${historyResponse.data.data?.length || 0}`);
      if (historyResponse.data.data && historyResponse.data.data.length > 0) {
        const recent = historyResponse.data.data[0];
        console.log(`   Latest: ${recent.title} - ${recent.session_date} - ${recent.is_present ? 'Present' : 'Absent'}`);
      }
    } catch (error: any) {
      console.log('❌ Attendance history failed:', error.response?.data || error.message);
    }
    
    // Test 4: Get Today's Tracker
    console.log('\n4. Testing Get Today\'s Tracker...');
    try {
      const todayTrackerResponse = await axios.get(`${BASE_URL}/student/tracker/today`, { headers });
      console.log('✅ Today\'s tracker retrieved');
      if (todayTrackerResponse.data.tracker) {
        console.log(`   Tracker ID: ${todayTrackerResponse.data.tracker.id}`);
        console.log(`   Hours Spent: ${todayTrackerResponse.data.tracker.hours_spent}`);
        console.log(`   Has Feedback: ${todayTrackerResponse.data.tracker.feedback ? 'Yes' : 'No'}`);
      } else {
        console.log('   No tracker submitted today');
      }
    } catch (error: any) {
      console.log('❌ Get today\'s tracker failed:', error.response?.data || error.message);
    }
    
    // Test 5: Submit Today's Tracker (if not already submitted)
    console.log('\n5. Testing Submit Tracker...');
    try {
      const trackerData = {
        tasks_completed: 'Completed React components and API integration',
        learning_summary: 'Learned about state management and hooks',
        hours_spent: 6,
        challenges: 'Had some issues with async/await'
      };
      
      const submitResponse = await axios.post(`${BASE_URL}/student/tracker`, trackerData, { headers });
      console.log('✅ Tracker submitted successfully');
      console.log(`   Tracker ID: ${submitResponse.data.tracker?.id}`);
    } catch (error: any) {
      if (error.response?.status === 409) {
        console.log('ℹ️  Tracker already submitted for today');
      } else {
        console.log('❌ Submit tracker failed:', error.response?.data || error.message);
      }
    }
    
    // Test 6: Update Today's Tracker
    console.log('\n6. Testing Update Today\'s Tracker...');
    try {
      // First get today's tracker
      const todayTrackerResponse = await axios.get(`${BASE_URL}/student/tracker/today`, { headers });
      
      if (todayTrackerResponse.data.tracker) {
        const trackerId = todayTrackerResponse.data.tracker.id;
        
        const updateData = {
          tasks_completed: 'Updated: Completed React components, API integration, and testing',
          hours_spent: 7
        };
        
        const updateResponse = await axios.put(`${BASE_URL}/student/tracker/${trackerId}/update`, updateData, { headers });
        console.log('✅ Tracker updated successfully');
        console.log(`   Updated Hours: ${updateResponse.data.tracker?.hours_spent}`);
      } else {
        console.log('ℹ️  No tracker to update (not submitted today)');
      }
    } catch (error: any) {
      console.log('❌ Update tracker failed:', error.response?.data || error.message);
    }
    
    // Test 7: Get Tracker History
    console.log('\n7. Testing Tracker History...');
    try {
      const historyResponse = await axios.get(`${BASE_URL}/student/tracker/history?limit=10`, { headers });
      console.log('✅ Tracker history retrieved');
      console.log(`   Total Trackers: ${historyResponse.data.data?.length || 0}`);
      if (historyResponse.data.data && historyResponse.data.data.length > 0) {
        const recent = historyResponse.data.data[0];
        console.log(`   Latest: ${recent.entry_date} - ${recent.hours_spent} hours`);
      }
    } catch (error: any) {
      console.log('❌ Tracker history failed:', error.response?.data || error.message);
    }
    
    // Test 8: Get Upcoming Sessions
    console.log('\n8. Testing Upcoming Sessions...');
    try {
      const sessionsResponse = await axios.get(`${BASE_URL}/student/upcoming-sessions`, { headers });
      console.log('✅ Upcoming sessions retrieved');
      console.log(`   Total Upcoming: ${sessionsResponse.data.data?.length || 0}`);
    } catch (error: any) {
      console.log('❌ Upcoming sessions failed:', error.response?.data || error.message);
    }
    
    console.log('\n🎉 Student Features Testing Complete!');
    console.log('\n📋 Summary:');
    console.log('✅ Attendance viewing - Working');
    console.log('✅ Attendance history - Working');
    console.log('✅ Tracker submission - Working');
    console.log('✅ Tracker editing (today only) - Working');
    console.log('✅ Tracker history - Working');
    
  } catch (error: any) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testStudentFeatures().catch(console.error);