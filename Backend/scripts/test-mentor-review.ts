import { pool } from '../src/config/db';
import * as jwt from 'jsonwebtoken';

async function testMentorReview() {
  try {
    console.log('🧪 Testing mentor review functionality...\n');

    // 1. Get mentor and student
    console.log('1. Getting test mentor and student...');
    
    const mentor = await pool.query(
      "SELECT id, name, email, tenant_id FROM users WHERE role = 'industryMentor' AND deleted_at IS NULL LIMIT 1"
    );

    const student = await pool.query(
      "SELECT id, name, email, tenant_id, cohort_id FROM users WHERE role = 'student' AND deleted_at IS NULL LIMIT 1"
    );

    if (mentor.rows.length === 0) {
      console.log('   ❌ No mentor found');
      return;
    }

    if (student.rows.length === 0) {
      console.log('   ❌ No student found');
      return;
    }

    console.log(`   ✅ Mentor: ${mentor.rows[0].name} (${mentor.rows[0].email})`);
    console.log(`   ✅ Student: ${student.rows[0].name} (${student.rows[0].email})`);

    // 2. Create JWT token for mentor
    console.log('\n2. Creating JWT token for mentor...');
    
    const payload = {
      id: mentor.rows[0].id,
      role: 'industryMentor',
      tenantId: mentor.rows[0].tenant_id,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || "fallback-secret");
    console.log('   ✅ JWT token created');

    // 3. Test mentor review submission via API
    console.log('\n3. Testing mentor review submission via API...');
    
    const reviewData = {
      studentId: student.rows[0].id,
      rating: 4.5,
      feedback: 'Excellent progress! Keep up the good work.',
    };

    const response = await fetch('http://localhost:5000/api/mentor/review', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(reviewData),
    });

    console.log(`   Response status: ${response.status}`);

    if (response.ok) {
      const result = await response.json();
      console.log('   ✅ Mentor review submission: PASS');
      console.log(`   Created review ID: ${result.data.id}`);
      console.log(`   Rating: ${result.data.rating}`);
      console.log(`   Feedback: ${result.data.feedback}`);
      
      // Clean up test review
      await pool.query('DELETE FROM mentor_reviews WHERE id = $1', [result.data.id]);
      console.log('   ✅ Test review cleaned up');
    } else {
      const error = await response.json();
      console.log('   ❌ Mentor review submission: FAIL');
      console.log('   Error:', error.message);
    }

    // 4. Verify database structure
    console.log('\n4. Verifying mentor_reviews table structure...');
    
    const columns = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'mentor_reviews'
      ORDER BY ordinal_position
    `);

    const requiredColumns = ['id', 'mentor_id', 'student_id', 'tenant_id', 'cohort_id', 'rating', 'feedback'];
    const existingColumns = columns.rows.map(c => c.column_name);
    
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
    
    if (missingColumns.length === 0) {
      console.log('   ✅ All required columns present');
    } else {
      console.log('   ⚠️  Missing columns:', missingColumns.join(', '));
    }

    console.log('\n🎉 Mentor review test completed!');

  } catch (error) {
    console.error('❌ Error during mentor review test:', error);
  } finally {
    await pool.end();
  }
}

testMentorReview();