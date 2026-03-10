import axios from 'axios';
import FormData from 'form-data';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:5000/api';

async function testMOUUpload() {
  try {
    console.log('🧪 Testing MOU Upload');
    console.log('=====================');
    
    // Login as executive
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'executive@yzone.com',
      password: 'executive123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Login successful as Executive');
    
    // Create a test PDF file
    const testFilePath = path.join(__dirname, 'test-mou.txt');
    fs.writeFileSync(testFilePath, 'This is a test MOU document content.');
    
    // Create form data
    const formData = new FormData();
    formData.append('title', 'Test MOU Document');
    formData.append('description', 'This is a test MOU upload');
    formData.append('expiry_date', '2025-12-31');
    formData.append('file', fs.createReadStream(testFilePath), {
      filename: 'test-mou.pdf',
      contentType: 'application/pdf'
    });
    
    // Upload MOU
    console.log('\n📤 Uploading MOU...');
    try {
      const uploadResponse = await axios.post(`${BASE_URL}/executive/mou/upload`, formData, {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('✅ MOU upload successful');
      console.log('   Response:', JSON.stringify(uploadResponse.data, null, 2));
    } catch (error: any) {
      console.log('❌ MOU upload failed');
      console.log('   Status:', error.response?.status);
      console.log('   Error:', error.response?.data);
    }
    
    // Clean up test file
    fs.unlinkSync(testFilePath);
    
    // Get MOUs
    console.log('\n📋 Getting MOUs...');
    try {
      const mousResponse = await axios.get(`${BASE_URL}/executive/mou`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('✅ Get MOUs successful');
      console.log(`   Total MOUs: ${mousResponse.data.mous?.length || 0}`);
    } catch (error: any) {
      console.log('❌ Get MOUs failed:', error.response?.data || error.message);
    }
    
    console.log('\n🎉 MOU Testing Complete!');
    
  } catch (error: any) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testMOUUpload().catch(console.error);