import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:5000';

async function testFrontendMOUUpload() {
  try {
    console.log('🧪 Testing MOU Upload (Frontend Simulation)');
    console.log('============================================\n');

    // Step 1: Login
    console.log('1. Login as Executive...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'executive@yzone.com',
      password: 'executive123'
    });

    const token = loginResponse.data.data.token;
    console.log('✅ Login successful\n');

    // Step 2: Create test file
    console.log('2. Creating test PDF...');
    const testFilePath = path.join(__dirname, 'test-mou-frontend.pdf');
    const pdfContent = '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\nxref\n0 2\ntrailer\n<<\n/Size 2\n/Root 1 0 R\n>>\nstartxref\n%%EOF';
    fs.writeFileSync(testFilePath, pdfContent);
    console.log('✅ Test PDF created\n');

    // Step 3: Upload using fetch-like approach (axios)
    console.log('3. Uploading MOU (simulating frontend)...');
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFilePath), {
      filename: 'test-mou-frontend.pdf',
      contentType: 'application/pdf'
    });
    formData.append('title', 'Frontend Test MOU 2024');
    formData.append('description', 'Testing MOU upload from frontend simulation');
    formData.append('expiry_date', '2025-06-30');

    try {
      const uploadResponse = await axios.post(
        `${BASE_URL}/api/executive/mou/upload`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            ...formData.getHeaders()
          },
          validateStatus: (status) => status < 600 // Don't throw on any status
        }
      );

      console.log(`Response Status: ${uploadResponse.status}`);
      console.log(`Response OK: ${uploadResponse.status >= 200 && uploadResponse.status < 300}`);
      console.log('\nResponse Data:');
      console.log(JSON.stringify(uploadResponse.data, null, 2));

      if (uploadResponse.status >= 200 && uploadResponse.status < 300) {
        console.log('\n✅ MOU uploaded successfully!');
        if (uploadResponse.data.data) {
          console.log(`   MOU ID: ${uploadResponse.data.data.id}`);
          console.log(`   Title: ${uploadResponse.data.data.title}`);
          console.log(`   Status: ${uploadResponse.data.data.status}`);
        }
      } else {
        console.log('\n❌ Upload failed!');
        console.log(`   Error: ${uploadResponse.data.error || uploadResponse.data.message || 'Unknown error'}`);
      }

    } catch (uploadError: any) {
      console.log('\n❌ Upload request failed!');
      if (uploadError.response) {
        console.log(`   Status: ${uploadError.response.status}`);
        console.log(`   Data:`, uploadError.response.data);
      } else {
        console.log(`   Error: ${uploadError.message}`);
      }
    }

    // Step 4: Verify upload by fetching MOUs
    console.log('\n4. Verifying upload...');
    try {
      const mouListResponse = await axios.get(`${BASE_URL}/api/executive/mou`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      console.log(`✅ Total MOUs: ${mouListResponse.data.mous?.length || 0}`);
      if (mouListResponse.data.mous && mouListResponse.data.mous.length > 0) {
        const latestMOU = mouListResponse.data.mous[0];
        console.log(`   Latest: ${latestMOU.title} (${latestMOU.status})`);
      }
    } catch (error: any) {
      console.log(`❌ Failed to fetch MOUs: ${error.message}`);
    }

    // Cleanup
    console.log('\n5. Cleaning up...');
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
      console.log('✅ Test file deleted');
    }

    console.log('\n🎉 Test Complete!\n');

  } catch (error: any) {
    console.error('\n❌ Test failed:');
    console.error(error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testFrontendMOUUpload().catch(console.error);
