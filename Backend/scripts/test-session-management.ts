import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

async function testSessionManagement() {
  try {
    console.log('🧪 Testing Session Management');
    console.log('==============================\n');

    // Step 1: Login as Facilitator
    console.log('1. Logging in as Facilitator...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'facilitator1@yzone.com',
      password: 'facilitator123'
    });

    const token = loginResponse.data.data.token;
    const user = loginResponse.data.data.user;
    console.log('✅ Login successful');
    console.log(`   Name: ${user.name}`);
    console.log(`   Cohort ID: ${user.cohortId}\n`);

    const headers = { Authorization: `Bearer ${token}` };
    const cohortId = user.cohortId;

    // Step 2: Get existing sessions
    console.log('2. Fetching existing sessions...');
    try {
      const sessionsResponse = await axios.get(
        `${BASE_URL}/facilitator/sessions/${cohortId}`,
        { headers }
      );

      console.log('✅ Sessions retrieved');
      console.log(`   Total sessions: ${sessionsResponse.data.data?.length || 0}`);
      
      if (sessionsResponse.data.data && sessionsResponse.data.data.length > 0) {
        console.log('\n   Recent sessions:');
        sessionsResponse.data.data.slice(0, 3).forEach((session: any, index: number) => {
          console.log(`   ${index + 1}. ${session.title} - ${session.session_date}`);
          console.log(`      Students: ${session.total_students}, Marked: ${session.total_marked}, Present: ${session.present_count}`);
        });
      }
    } catch (error: any) {
      console.log('❌ Failed to fetch sessions:', error.response?.data || error.message);
    }

    // Step 3: Create a new session
    console.log('\n3. Creating a new session...');
    try {
      const today = new Date().toISOString().split('T')[0];
      const createResponse = await axios.post(
        `${BASE_URL}/facilitator/sessions`,
        {
          cohortId,
          title: 'Test Session - Advanced React Patterns',
          sessionDate: today,
          description: 'Testing session creation from API'
        },
        { headers }
      );

      console.log('✅ Session created successfully');
      console.log(`   Session ID: ${createResponse.data.data.id}`);
      console.log(`   Title: ${createResponse.data.data.title}`);
      console.log(`   Date: ${createResponse.data.data.session_date}`);

      const newSessionId = createResponse.data.data.id;

      // Step 4: Verify session was created
      console.log('\n4. Verifying session creation...');
      const verifyResponse = await axios.get(
        `${BASE_URL}/facilitator/sessions/${cohortId}`,
        { headers }
      );

      const foundSession = verifyResponse.data.data.find((s: any) => s.id === newSessionId);
      if (foundSession) {
        console.log('✅ Session verified in list');
        console.log(`   Found: ${foundSession.title}`);
      } else {
        console.log('❌ Session not found in list');
      }

      // Step 5: Delete the test session
      console.log('\n5. Deleting test session...');
      try {
        const deleteResponse = await axios.delete(
          `${BASE_URL}/facilitator/sessions/${newSessionId}`,
          { headers }
        );

        console.log('✅ Session deleted successfully');
        console.log(`   Message: ${deleteResponse.data.message}`);
      } catch (error: any) {
        console.log('❌ Failed to delete session:', error.response?.data || error.message);
      }

      // Step 6: Verify deletion
      console.log('\n6. Verifying deletion...');
      const finalResponse = await axios.get(
        `${BASE_URL}/facilitator/sessions/${cohortId}`,
        { headers }
      );

      const stillExists = finalResponse.data.data.find((s: any) => s.id === newSessionId);
      if (!stillExists) {
        console.log('✅ Session successfully removed from list');
      } else {
        console.log('❌ Session still exists in list');
      }

    } catch (error: any) {
      console.log('❌ Failed to create session:', error.response?.data || error.message);
    }

    console.log('\n🎉 Session Management Test Complete!\n');

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

testSessionManagement().catch(console.error);
