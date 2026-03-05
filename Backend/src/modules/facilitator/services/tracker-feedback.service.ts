import { pool } from '../../../config/db';
import { TrackerFeedback, CreateTrackerFeedbackRequest, TrackerEntryWithFeedback } from '../types/tracker-feedback.types';

export class TrackerFeedbackService {
  static async createFeedback(
    facilitatorId: string,
    tenantId: string,
    feedbackData: CreateTrackerFeedbackRequest
  ): Promise<TrackerFeedback> {
    const query = `
      INSERT INTO tracker_feedback (
        tracker_entry_id, facilitator_id, tenant_id, feedback, 
        rating, suggestions, is_approved
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      feedbackData.tracker_entry_id,
      facilitatorId,
      tenantId,
      feedbackData.feedback,
      feedbackData.rating,
      feedbackData.suggestions || null,
      feedbackData.is_approved || null
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async getTrackerEntriesWithFeedback(
    tenantId: string,
    cohortId?: string,
    studentId?: string
  ): Promise<TrackerEntryWithFeedback[]> {
    let query = `
      SELECT 
        te.id, te.student_id, te.entry_date, te.tasks_completed,
        te.learning_summary, te.hours_spent, te.challenges, 
        te.proof_file_url, te.submitted_at,
        u.name as student_name,
        tf.id as feedback_id, tf.feedback, tf.rating, 
        tf.suggestions, tf.is_approved, tf.created_at as feedback_created_at,
        f.name as facilitator_name
      FROM tracker_entries te
      JOIN users u ON te.student_id = u.id
      LEFT JOIN tracker_feedback tf ON te.id = tf.tracker_entry_id
      LEFT JOIN users f ON tf.facilitator_id = f.id
      WHERE te.tenant_id = $1
    `;

    const values: any[] = [tenantId];
    let paramCount = 1;

    if (cohortId) {
      paramCount++;
      query += ` AND te.cohort_id = $${paramCount}`;
      values.push(cohortId);
    }

    if (studentId) {
      paramCount++;
      query += ` AND te.student_id = $${paramCount}`;
      values.push(studentId);
    }

    query += ` ORDER BY te.entry_date DESC, te.submitted_at DESC`;

    const result = await pool.query(query, values);
    
    // Group results by tracker entry
    const entriesMap = new Map();
    
    result.rows.forEach(row => {
      if (!entriesMap.has(row.id)) {
        entriesMap.set(row.id, {
          id: row.id,
          student_id: row.student_id,
          student_name: row.student_name,
          entry_date: row.entry_date,
          tasks_completed: row.tasks_completed,
          learning_summary: row.learning_summary,
          hours_spent: row.hours_spent,
          challenges: row.challenges,
          proof_file_url: row.proof_file_url,
          submitted_at: row.submitted_at,
          feedback: row.feedback_id ? {
            id: row.feedback_id,
            feedback: row.feedback,
            rating: row.rating,
            suggestions: row.suggestions,
            is_approved: row.is_approved,
            created_at: row.feedback_created_at,
            facilitator_name: row.facilitator_name
          } : null
        });
      }
    });

    return Array.from(entriesMap.values());
  }

  static async updateFeedback(
    feedbackId: string,
    facilitatorId: string,
    tenantId: string,
    feedbackData: Partial<CreateTrackerFeedbackRequest>
  ): Promise<TrackerFeedback | null> {
    const query = `
      UPDATE tracker_feedback 
      SET feedback = COALESCE($1, feedback),
          rating = COALESCE($2, rating),
          suggestions = COALESCE($3, suggestions),
          is_approved = COALESCE($4, is_approved),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $5 AND facilitator_id = $6 AND tenant_id = $7
      RETURNING *
    `;

    const values = [
      feedbackData.feedback || null,
      feedbackData.rating || null,
      feedbackData.suggestions || null,
      feedbackData.is_approved !== undefined ? feedbackData.is_approved : null,
      feedbackId,
      facilitatorId,
      tenantId
    ];

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  static async deleteFeedback(
    feedbackId: string,
    facilitatorId: string,
    tenantId: string
  ): Promise<boolean> {
    const query = `
      DELETE FROM tracker_feedback 
      WHERE id = $1 AND facilitator_id = $2 AND tenant_id = $3
    `;

    const result = await pool.query(query, [feedbackId, facilitatorId, tenantId]);
    return (result.rowCount || 0) > 0;
  }

  static async getFeedbackStats(tenantId: string, cohortId?: string): Promise<any> {
    let query = `
      SELECT 
        COUNT(DISTINCT te.id) as total_entries,
        COUNT(tf.id) as entries_with_feedback,
        AVG(tf.rating) as average_rating,
        COUNT(CASE WHEN tf.is_approved = true THEN 1 END) as approved_entries,
        COUNT(CASE WHEN tf.is_approved = false THEN 1 END) as rejected_entries
      FROM tracker_entries te
      LEFT JOIN tracker_feedback tf ON te.id = tf.tracker_entry_id
      WHERE te.tenant_id = $1
    `;

    const values: any[] = [tenantId];

    if (cohortId) {
      query += ` AND te.cohort_id = $2`;
      values.push(cohortId);
    }

    const result = await pool.query(query, values);
    return result.rows[0];
  }
}