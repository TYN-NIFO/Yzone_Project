import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:5000/api';

async function testMOUUpload() {
  try {
    console.log('🧪 Testing MOU Upload Functionality');
    console.log('====================================\n');

    // Step 1: Login as Executive
    console.log('1. Logging in as Executive...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'executive@yzone.com',
      password: 'executive123'
    });

    if (!loginResponse.data.data?.token) {
      console.error('❌ Login failed - no token received');
      console.log('Response:', JSON.stringify(loginResponse.data, null, 2));
      return;
    }

    const token = loginResponse.data.data.token;
    console.log('✅ Login successful');
    console.log(`   Token: ${token.substring(0, 20)}...`);
    console.log(`   User: ${loginResponse.data.data.user?.name}`);
    console.log(`   Role: ${loginResponse.data.data.user?.role}\n`);

    // Step 2: Create a test PDF file
    console.log('2. Creating test PDF file...');
    const testFilePath = path.join(__dirname, 'test-mou.pdf');
    const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/Resources <<
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
>>
>>
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Test MOU Document) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000317 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
410
%%EOF`;

    fs.writeFileSync(testFilePath, pdfContent);
    console.log('✅ Test PDF created\n');

    // Step 3: Upload MOU
    console.log('3. Uploading MOU...');
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFilePath));
    formData.append('title', 'Test MOU Agreement 2024');
    formData.append('description', 'This is a test MOU for system verification');
    formData.append('expiry_date', '2025-12-31');

    try {
      const uploadResponse = await axios.post(
        `${BASE_URL}/executive/mou/upload`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            ...formData.getHeaders()
          }
        }
      );

      console.log('✅ MOU uploaded successfully!');
      console.log('Response:', JSON.stringify(uploadResponse.data, null, 2));
      
      if (uploadResponse.data.data) {
        console.log('\n📄 MOU Details:');
        console.log(`   ID: ${uploadResponse.data.data.id}`);
        console.log(`   Title: ${uploadResponse.data.data.title}`);
        console.log(`   File: ${uploadResponse.data.data.file_name}`);
        console.log(`   Status: ${uploadResponse.data.data.status}`);
        console.log(`   URL: ${uploadResponse.data.data.file_url}`);
      }
    } catch (uploadError: any) {
      console.error('❌ MOU upload failed!');
      if (uploadError.response) {
        console.error('Status:', uploadError.response.status);
        console.error('Response:', JSON.stringify(uploadError.response.data, null, 2));
        console.error('Headers:', uploadError.response.headers);
      } else {
        console.error('Error:', uploadError.message);
      }
    }

    // Step 4: Get all MOUs
    console.log('\n4. Fetching all MOUs...');
    try {
      const getMOUsResponse = await axios.get(`${BASE_URL}/executive/mou`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      console.log('✅ MOUs retrieved successfully');
      console.log(`   Total MOUs: ${getMOUsResponse.data.mous?.length || 0}`);
      if (getMOUsResponse.data.mous && getMOUsResponse.data.mous.length > 0) {
        console.log('\n   Recent MOUs:');
        getMOUsResponse.data.mous.slice(0, 3).forEach((mou: any, index: number) => {
          console.log(`   ${index + 1}. ${mou.title} - ${mou.status}`);
        });
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch MOUs:', error.response?.data || error.message);
    }

    // Cleanup
    console.log('\n5. Cleaning up test file...');
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
      console.log('✅ Test file deleted\n');
    }

    console.log('🎉 MOU Upload Test Complete!\n');

  } catch (error: any) {
    console.error('\n❌ Test failed with error:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    }
  }
}

testMOUUpload().catch(console.error);
