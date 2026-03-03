import { pool } from '../src/config/db';

async function fixMentorReviews() {
  try {
    console.log('🔧 Fixing mentor_reviews table...\n');

    // 1. Check current table structure
    console.log('1. Checking current mentor_reviews table structure...');
    const tableInfo = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'mentor_reviews'
      ORDER BY ordinal_position
    `);

    console.log('   Current columns:');
    tableInfo.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    const columnNames = tableInfo.rows.map(col => col.column_name);
    const hasTenantId = columnNames.includes('tenant_id');
    const hasCohortId = columnNames.includes('cohort_id');
    const hasProjectId = columnNames.includes('project_id');
    const hasSubmissionId = columnNames.includes('submission_id');
    const hasStatus = columnNames.includes('status');
    const hasReviewDate = columnNames.includes('review_date');
    const hasUpdatedAt = columnNames.includes('updated_at');

    // 2. Add missing columns
    console.log('\n2. Adding missing columns...');

    if (!hasTenantId) {
      console.log('   Adding tenant_id column...');
      await pool.query(`
        ALTER TABLE mentor_reviews 
        ADD COLUMN tenant_id UUID
      `);
      
      // Populate tenant_id from mentor's tenant
      await pool.query(`
        UPDATE mentor_reviews mr
        SET tenant_id = u.tenant_id
        FROM users u
        WHERE mr.mentor_id = u.id AND mr.tenant_id IS NULL
      `);
      
      // Make it NOT NULL after populating
      await pool.query(`
        ALTER TABLE mentor_reviews 
        ALTER COLUMN tenant_id SET NOT NULL
      `);
      
      console.log('   ✅ Added and populated tenant_id column');
    } else {
      console.log('   ✅ tenant_id column already exists');
    }

    if (!hasCohortId) {
      console.log('   Adding cohort_id column...');
      await pool.query(`
        ALTER TABLE mentor_reviews 
        ADD COLUMN cohort_id UUID
      `);
      
      // Populate cohort_id from student's cohort
      await pool.query(`
        UPDATE mentor_reviews mr
        SET cohort_id = u.cohort_id
        FROM users u
        WHERE mr.student_id = u.id AND mr.cohort_id IS NULL
      `);
      
      // Make it NOT NULL after populating
      await pool.query(`
        ALTER TABLE mentor_reviews 
        ALTER COLUMN cohort_id SET NOT NULL
      `);
      
      console.log('   ✅ Added and populated cohort_id column');
    } else {
      console.log('   ✅ cohort_id column already exists');
    }

    if (!hasReviewDate) {
      console.log('   Adding review_date column...');
      await pool.query(`
        ALTER TABLE mentor_reviews 
        ADD COLUMN review_date DATE DEFAULT CURRENT_DATE
      `);
      console.log('   ✅ Added review_date column');
    }

    if (!hasUpdatedAt) {
      console.log('   Adding updated_at column...');
      await pool.query(`
        ALTER TABLE mentor_reviews 
        ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      `);
      console.log('   ✅ Added updated_at column');
    }

    // 3. Remove unnecessary columns
    console.log('\n3. Removing unnecessary columns...');

    if (hasProjectId) {
      await pool.query(`
        ALTER TABLE mentor_reviews 
        DROP COLUMN IF EXISTS project_id
      `);
      console.log('   ✅ Removed project_id column');
    }

    if (hasSubmissionId) {
      await pool.query(`
        ALTER TABLE mentor_reviews 
        DROP COLUMN IF EXISTS submission_id
      `);
      console.log('   ✅ Removed submission_id column');
    }

    if (hasStatus) {
      await pool.query(`
        ALTER TABLE mentor_reviews 
        DROP COLUMN IF EXISTS status
      `);
      console.log('   ✅ Removed status column');
    }

    // 4. Fix rating column type if needed
    console.log('\n4. Fixing rating column type...');
    const ratingInfo = tableInfo.rows.find(col => col.column_name === 'rating');
    
    if (ratingInfo && ratingInfo.data_type === 'integer') {
      console.log('   Converting rating from INTEGER to DECIMAL(3,2)...');
      await pool.query(`
        ALTER TABLE mentor_reviews 
        ALTER COLUMN rating TYPE DECIMAL(3,2)
      `);
      console.log('   ✅ Converted rating column type');
    } else {
      console.log('   ✅ Rating column type is correct');
    }

    // 5. Add foreign key constraints if they don't exist
    console.log('\n5. Adding foreign key constraints...');

    try {
      await pool.query(`
        ALTER TABLE mentor_reviews 
        ADD CONSTRAINT fk_mentor_reviews_tenant 
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
      `);
      console.log('   ✅ Added tenant_id foreign key');
    } catch (error: any) {
      if (error.code === '42710') {
        console.log('   ✅ tenant_id foreign key already exists');
      } else {
        console.log('   ℹ️  tenant_id foreign key:', error.message);
      }
    }

    try {
      await pool.query(`
        ALTER TABLE mentor_reviews 
        ADD CONSTRAINT fk_mentor_reviews_cohort 
        FOREIGN KEY (cohort_id) REFERENCES cohorts(id) ON DELETE CASCADE
      `);
      console.log('   ✅ Added cohort_id foreign key');
    } catch (error: any) {
      if (error.code === '42710') {
        console.log('   ✅ cohort_id foreign key already exists');
      } else {
        console.log('   ℹ️  cohort_id foreign key:', error.message);
      }
    }

    // 6. Verify final structure
    console.log('\n6. Verifying final mentor_reviews table structure...');
    const finalTableInfo = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'mentor_reviews'
      ORDER BY ordinal_position
    `);

    console.log('   Final columns:');
    finalTableInfo.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // 7. Test mentor review insertion
    console.log('\n7. Testing mentor review insertion...');
    
    const mentor = await pool.query(
      "SELECT id, tenant_id FROM users WHERE role = 'industryMentor' AND deleted_at IS NULL LIMIT 1"
    );

    const student = await pool.query(
      "SELECT id, tenant_id, cohort_id FROM users WHERE role = 'student' AND deleted_at IS NULL LIMIT 1"
    );

    if (mentor.rows.length > 0 && student.rows.length > 0) {
      try {
        const testReview = await pool.query(
          `INSERT INTO mentor_reviews (mentor_id, student_id, tenant_id, cohort_id, rating, feedback)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id, rating, feedback`,
          [
            mentor.rows[0].id,
            student.rows[0].id,
            student.rows[0].tenant_id,
            student.rows[0].cohort_id,
            4.5,
            'Test review - excellent progress!'
          ]
        );
        console.log('   ✅ Mentor review insertion test: PASS');
        console.log(`   Created review: ${testReview.rows[0].id} (rating: ${testReview.rows[0].rating})`);
        
        // Clean up test review
        await pool.query('DELETE FROM mentor_reviews WHERE id = $1', [testReview.rows[0].id]);
      } catch (error: any) {
        console.log('   ❌ Mentor review insertion test: FAIL');
        console.log('   Error:', error.message);
      }
    } else {
      console.log('   ℹ️  No mentor or student available for testing');
    }

    console.log('\n🎉 Mentor reviews table fix completed!');

  } catch (error) {
    console.error('❌ Error during mentor reviews fix:', error);
  } finally {
    await pool.end();
  }
}

fixMentorReviews();