import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

async function testMentorReviewPermission() {
  try {
    console.log('🧪 Testing Mentor Review Permission');
    console.log('====================================\n');

    // Login as mentor
    console.log('1️⃣ Logging in as mentor...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'mentor1@yzone.com',
      password: 'mentor123'
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
    console.log(`   Role: ${user.role}`);
    console.log(`   ID: ${user.id}`);

    // Decode token to check payload
    const tokenParts = token.split('.');
    const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
    console.log('\n🔑 Token Payload:');
    console.log(`   Role in token: ${payload.role}`);
    console.log(`   ID in token: ${payload.id}`);
    console.log(`   Full payload:`, payload);

    // Get assigned students
    console.log('\n2️⃣ Getting assigned students...');
    const studentsResponse = await axios.get(`${BASE_URL}/mentor/assigned-students`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (studentsResponse.data.data.length === 0) {
      console.log('❌ No students assigned to this mentor');
      return;
    }

    const student = studentsResponse.data.data[0];
    console.log('✅ Found student:', student.name);
    console.log(`   Student ID: ${student.id}`);

    // Try to submit review
    console.log('\n3️⃣ Submitting review...');
    const reviewData = {
      studentId: student.id,
      rating: 5,
      feedback: 'Great work! Keep it up.',
      strengths: 'Strong technical skills',
      improvements: 'Could improve communication'
    };

    console.log('   Review data:', reviewData);

    try {
      const reviewResponse = await axios.post(
        `${BASE_URL}/mentor/review`,
        reviewData,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Review submitted successfully!');
      console.log('   Response:', reviewResponse.data);
    } catch (reviewError: any) {
      console.log('❌ Review submission failed');
      console.log(`   Status: ${reviewError.response?.status}`);
      console.log(`   Message: ${reviewError.response?.data?.message}`);
      console.log(`   Full error:`, reviewError.response?.data);

      // Debug: Check what the middleware sees
      console.log('\n🔍 Debugging middleware...');
      console.log('   Token being sent:', token.substring(0, 50) + '...');
      console.log('   Authorization header:', `Bearer ${token.substring(0, 50)}...`);
      
      // Try to decode token again
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        console.log('   Decoded token:', decoded);
      } catch (decodeError: any) {
        console.log('   Token decode error:', decodeError.message);
      }
    }

    // Check database for mentor role
    console.log('\n4️⃣ Checking database for user role...');
    const { pool } = require('../src/config/db');
    const dbUser = await pool.query(
      'SELECT id, name, email, role FROM users WHERE id = $1',
      [user.id]
    );

    if (dbUser.rows.length > 0) {
      console.log('✅ User found in database:');
      console.log(`   Role in DB: ${dbUser.rows[0].role}`);
      console.log(`   Role in token: ${payload.role}`);
      console.log(`   Roles match: ${dbUser.rows[0].role === payload.role ? '✅ YES' : '❌ NO'}`);
    }

  } catch (error: any) {
    console.error('\n❌ Test failed:');
    console.error(error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testMentorReviewPermission().catch(console.error);
