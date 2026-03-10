import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

async function simpleMOUTest() {
  try {
    console.log('Testing MOU Upload - Simple Version\n');
    
    // Test 1: Check if server is running
    console.log('1. Checking server health...');
    try {
      const healthCheck = await axios.get(`${BASE_URL}/auth/login`, {
        validateStatus: () => true
      });
      console.log(`✅ Server is responding (status: ${healthCheck.status})\n`);
    } catch (error: any) {
      console.log(`❌ Server not responding: ${error.message}\n`);
      return;
    }

    // Test 2: Login
    console.log('2. Attempting login...');
    try {
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'executive@yzone.com',
        password: 'executive123'
      });
      
      console.log('✅ Login successful');
      console.log(`   User: ${loginResponse.data.data?.user?.name}`);
      console.log(`   Role: ${loginResponse.data.data?.user?.role}`);
      console.log(`   Token exists: ${!!loginResponse.data.data?.token}\n`);
      
      const token = loginResponse.data.data.token;
      
      // Test 3: Check MOU endpoint accessibility
      console.log('3. Checking MOU endpoint...');
      try {
        const mouListResponse = await axios.get(`${BASE_URL}/executive/mou`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log(`✅ MOU endpoint accessible`);
        console.log(`   Current MOUs: ${mouListResponse.data.mous?.length || 0}\n`);
      } catch (error: any) {
        console.log(`❌ MOU endpoint error: ${error.response?.status} - ${error.response?.data?.error || error.message}\n`);
      }
      
      // Test 4: Check upload endpoint with OPTIONS (CORS preflight)
      console.log('4. Checking upload endpoint (OPTIONS)...');
      try {
        const optionsResponse = await axios.options(`${BASE_URL}/executive/mou/upload`, {
          headers: { 'Authorization': `Bearer ${token}` },
          validateStatus: () => true
        });
        console.log(`   OPTIONS response: ${optionsResponse.status}`);
        console.log(`   CORS headers: ${optionsResponse.headers['access-control-allow-origin'] || 'Not set'}\n`);
      } catch (error: any) {
        console.log(`   OPTIONS check skipped (${error.message})\n`);
      }
      
    } catch (loginError: any) {
      console.log(`❌ Login failed:`);
      console.log(`   Status: ${loginError.response?.status}`);
      console.log(`   Message: ${loginError.response?.data?.message || loginError.message}`);
      console.log(`   Full error:`, loginError.response?.data || loginError.message);
    }
    
  } catch (error: any) {
    console.error('❌ Unexpected error:', error.message);
  }
}

simpleMOUTest().catch(console.error);
