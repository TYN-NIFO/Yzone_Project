import { pool } from '../../../config/db';

export interface TrackerEntry {
  id: string;
  student_id: string;
  tenant_id: string;
  cohort_id: string;
  entry_date: Date;
  tasks_completed: string;
  learning_summary: string;
  hours_spent: number;
  challenges?: string;
  proof_file_url?: string;
  submitted_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface UpdateTrackerRequest {
  tasks_completed?: string;
  learning_summary?: string;
  hours_spent?: number;
  challenges?: string;
  proof_file_url?: string;
}

export class TrackerModificationService {
  static async getTodayTracker(
    studentId: string,
    tenantId: string
  ): Promise<TrackerEntry | null> {
    const query = `
      SELECT * FROM tracker_entries 
      WHERE student_id = $1 AND tenant_id = $2 
      AND entry_date = CURRENT_DATE
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const result = await pool.query(query, [studentId, tenantId]);
    return result.rows[0] || null;
  }

  static async canModifyTracker(
    trackerId: string,
    studentId: string,
    tenantId: string
  ): Promise<boolean> {
    const query = `
      SELECT id FROM tracker_entries 
      WHERE id = $1 AND student_id = $2 AND tenant_id = $3
      AND entry_date = CURRENT_DATE
    `;

    const result = await pool.query(query, [trackerId, studentId, tenantId]);
    return result.rows.length > 0;
  }

  static async updateTodayTracker(
    trackerId: string,
    studentId: string,
    tenantId: string,
    updateData: UpdateTrackerRequest
  ): Promise<TrackerEntry | null> {
    // First check if the tracker can be modified
    const canModify = await this.canModifyTracker(trackerId, studentId, tenantId);
    if (!canModify) {
      throw new Error('Cannot modify tracker: either not found, not yours, or not from today');
    }

    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 0;

    // Build dynamic update query
    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined) {
        paramCount++;
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    // Add updated_at
    paramCount++;
    fields.push(`updated_at = $${paramCount}`);
    values.push(new Date());

    // Add WHERE conditions
    paramCount++;
    values.push(trackerId);
    paramCount++;
    values.push(studentId);
    paramCount++;
    values.push(tenantId);

    const query = `
      UPDATE tracker_entries 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount - 2} 
      AND student_id = $${paramCount - 1} 
      AND tenant_id = $${paramCount}
      AND entry_date = CURRENT_DATE
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  static async getTrackerHistory(
    studentId: string,
    tenantId: string,
    limit: number = 10
  ): Promise<TrackerEntry[]> {
    const query = `
      SELECT * FROM tracker_entries 
      WHERE student_id = $1 AND tenant_id = $2
      ORDER BY entry_date DESC, created_at DESC
      LIMIT $3
    `;

    const result = await pool.query(query, [studentId, tenantId, limit]);
    return result.rows;
  }

  static async getTrackerWithFeedback(
    trackerId: string,
    studentId: string,
    tenantId: string
  ): Promise<any> {
    const query = `
      SELECT 
        te.*,
        tf.id as feedback_id,
        tf.feedback,
        tf.rating,
        tf.suggestions,
        tf.is_approved,
        tf.created_at as feedback_created_at,
        u.name as facilitator_name
      FROM tracker_entries te
      LEFT JOIN tracker_feedback tf ON te.id = tf.tracker_entry_id
      LEFT JOIN users u ON tf.facilitator_id = u.id
      WHERE te.id = $1 AND te.student_id = $2 AND te.tenant_id = $3
    `;

    const result = await pool.query(query, [trackerId, studentId, tenantId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      student_id: row.student_id,
      tenant_id: row.tenant_id,
      cohort_id: row.cohort_id,
      entry_date: row.entry_date,
      tasks_completed: row.tasks_completed,
      learning_summary: row.learning_summary,
      hours_spent: row.hours_spent,
      challenges: row.challenges,
      proof_file_url: row.proof_file_url,
      submitted_at: row.submitted_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
      feedback: row.feedback_id ? {
        id: row.feedback_id,
        feedback: row.feedback,
        rating: row.rating,
        suggestions: row.suggestions,
        is_approved: row.is_approved,
        created_at: row.feedback_created_at,
        facilitator_name: row.facilitator_name
      } : null
    };
  }

  static async getTrackerStats(
    studentId: string,
    tenantId: string
  ): Promise<any> {
    const query = `
      SELECT 
        COUNT(*) as total_entries,
        AVG(hours_spent) as avg_hours_per_day,
        SUM(hours_spent) as total_hours,
        COUNT(CASE WHEN entry_date >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as entries_this_week,
        COUNT(CASE WHEN entry_date >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as entries_this_month
      FROM tracker_entries 
      WHERE student_id = $1 AND tenant_id = $2
    `;

    const result = await pool.query(query, [studentId, tenantId]);
    return result.rows[0];
  }
}