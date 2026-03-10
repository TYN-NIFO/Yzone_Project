import { pool } from '../src/config/db';

async function assignFacilitatorToCohort() {
  try {
    console.log('🔧 Assigning facilitator to cohort...');
    
    // Get the facilitator
    const facilitator = await pool.query(`
      SELECT id, name, email, tenant_id 
      FROM users 
      WHERE email = 'facilitator@yzone.com' AND role = 'facilitator'
    `);
    
    if (facilitator.rows.length === 0) {
      console.log('❌ Facilitator not found');
      return;
    }
    
    const facilitatorData = facilitator.rows[0];
    console.log('👤 Found facilitator:', facilitatorData.name);
    
    // Get available cohorts for the same tenant
    const cohorts = await pool.query(`
      SELECT id, name, facilitator_id, tenant_id 
      FROM cohorts 
      WHERE tenant_id = $1 AND deleted_at IS NULL
      ORDER BY created_at
    `, [facilitatorData.tenant_id]);
    
    console.log('📋 Available cohorts for tenant:');
    cohorts.rows.forEach((cohort, index) => {
      console.log(`   ${index + 1}. ${cohort.name} - Facilitator: ${cohort.facilitator_id || 'None'}`);
    });
    
    if (cohorts.rows.length === 0) {
      console.log('❌ No cohorts found for this tenant');
      return;
    }
    
    // Assign facilitator to the first cohort without a facilitator
    const unassignedCohort = cohorts.rows.find(c => !c.facilitator_id);
    
    if (unassignedCohort) {
      await pool.query(`
        UPDATE cohorts 
        SET facilitator_id = $1 
        WHERE id = $2
      `, [facilitatorData.id, unassignedCohort.id]);
      
      console.log('✅ Assigned facilitator to cohort:', unassignedCohort.name);
    } else {
      console.log('ℹ️  All cohorts already have facilitators assigned');
    }
    
    // Also update the facilitator's cohort_id
    if (unassignedCohort) {
      await pool.query(`
        UPDATE users 
        SET cohort_id = $1 
        WHERE id = $2
      `, [unassignedCohort.id, facilitatorData.id]);
      
      console.log('✅ Updated facilitator cohort_id');
    }
    
  } catch (error) {
    console.error('❌ Error assigning facilitator:', error);
  } finally {
    await pool.end();
  }
}

assignFacilitatorToCohort().catch(console.error);