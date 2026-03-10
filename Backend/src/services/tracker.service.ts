import { pool } from "../config/db";
import { AzureStorageService } from "./azure-storage.service";

const azureStorage = new AzureStorageService();

export class TrackerService {
  async createTrackerEntry(data: any, file?: Express.Multer.File) {
    // Handle both camelCase and snake_case field names
    const studentId = data.studentId || data.student_id;
    const tenantId = data.tenantId || data.tenant_id;
    const cohortId = data.cohortId || data.cohort_id;
    const entryDate = data.entryDate || data.entry_date || new Date().toISOString().split('T')[0];
    const tasksCompleted = data.tasksCompleted || data.tasks_completed;
    const learningSummary = data.learningSummary || data.learning_summary;
    const hoursSpent = data.hoursSpent || data.hours_spent;
    const challenges = data.challenges;

    let proofFileUrl = null;

    if (file) {
      const uploadResult = await azureStorage.uploadFile(file, studentId, tenantId);
      proofFileUrl = uploadResult.blob_url;
    }

    const result = await pool.query(
      `INSERT INTO tracker_entries (student_id, tenant_id, cohort_id, entry_date, tasks_completed, learning_summary, hours_spent, challenges, proof_file_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (student_id, entry_date)
       DO UPDATE SET
         tasks_completed = $5,
         learning_summary = $6,
         hours_spent = $7,
         challenges = $8,
         proof_file_url = COALESCE($9, tracker_entries.proof_file_url),
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [studentId, tenantId, cohortId, entryDate, tasksCompleted, learningSummary, hoursSpent, challenges, proofFileUrl]
    );

    if (file && result.rows[0].id) {
      await pool.query(
        `UPDATE azure_blob_files SET tracker_entry_id = $1 WHERE blob_url = $2`,
        [result.rows[0].id, proofFileUrl]
      );
    }

    return result.rows[0];
  }

  async getTrackerEntries(studentId: string, tenantId: string, startDate?: string, endDate?: string) {
    let query = `SELECT * FROM tracker_entries WHERE student_id = $1 AND tenant_id = $2`;
    const params: any[] = [studentId, tenantId];

    if (startDate) {
      params.push(startDate);
      query += ` AND entry_date >= $${params.length}`;
    }

    if (endDate) {
      params.push(endDate);
      query += ` AND entry_date <= $${params.length}`;
    }

    query += ` ORDER BY entry_date DESC`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  async getStudentsWithoutTodayTracker(tenantId: string, cohortId?: string) {
    let query = `
      SELECT u.id, u.name, u.email, u.whatsapp_number, u.tenant_id, u.cohort_id
      FROM users u
      WHERE u.tenant_id = $1 
        AND u.role = 'student' 
        AND u.is_active = true
        AND u.deleted_at IS NULL
        AND u.whatsapp_number IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM tracker_entries te 
          WHERE te.student_id = u.id 
            AND te.entry_date = CURRENT_DATE
        )`;

    const params: any[] = [tenantId];

    if (cohortId) {
      params.push(cohortId);
      query += ` AND u.cohort_id = $${params.length}`;
    }

    const result = await pool.query(query, params);
    return result.rows;
  }

  async getTrackerStats(studentId: string, cohortId: string) {
    const result = await pool.query(
      `SELECT 
        COUNT(*) as total_entries,
        AVG(hours_spent) as avg_hours,
        MAX(entry_date) as last_entry_date,
        COUNT(*) FILTER (WHERE entry_date >= CURRENT_DATE - INTERVAL '7 days') as last_7_days,
        COUNT(*) FILTER (WHERE entry_date >= CURRENT_DATE - INTERVAL '30 days') as last_30_days
       FROM tracker_entries
       WHERE student_id = $1 AND cohort_id = $2`,
      [studentId, cohortId]
    );
    return result.rows[0];
  }
}
