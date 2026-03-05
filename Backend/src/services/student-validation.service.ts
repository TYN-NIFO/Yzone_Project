import { pool } from '../config/db';
import logger from '../config/logger';

export interface StudentTrackerStatus {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsapp_number: string;
  cohort_id: string;
  cohort_name: string;
  has_submitted_today: boolean;
  last_submission_date: string | null;
}

export class StudentValidationService {
  /**
   * Get all students who haven't submitted tracker today
   * @returns Array of students who need reminders
   */
  static async getStudentsWithoutTodayTracker(): Promise<StudentTrackerStatus[]> {
    try {
      const query = `
        SELECT 
          u.id,
          u.name,
          u.email,
          u.phone,
          u.whatsapp_number,
          u.cohort_id,
          c.name as cohort_name,
          CASE 
            WHEN te.entry_date = CURRENT_DATE THEN true
            ELSE false
          END as has_submitted_today,
          te.entry_date as last_submission_date
        FROM users u
        JOIN cohorts c ON u.cohort_id = c.id
        LEFT JOIN LATERAL (
          SELECT entry_date
          FROM tracker_entries
          WHERE student_id = u.id
          ORDER BY entry_date DESC
          LIMIT 1
        ) te ON true
        WHERE u.role = 'student'
          AND u.is_active = true
          AND u.deleted_at IS NULL
          AND (te.entry_date IS NULL OR te.entry_date < CURRENT_DATE)
        ORDER BY u.name
      `;

      const result = await pool.query(query);
      
      logger.info(`Found ${result.rows.length} students without today's tracker submission`);
      
      return result.rows;
    } catch (error) {
      logger.error('Error fetching students without tracker:', error);
      throw error;
    }
  }

  /**
   * Get students by cohort who haven't submitted tracker today
   * @param cohortId - Cohort ID
   * @returns Array of students who need reminders
   */
  static async getStudentsWithoutTodayTrackerByCohort(
    cohortId: string
  ): Promise<StudentTrackerStatus[]> {
    try {
      const query = `
        SELECT 
          u.id,
          u.name,
          u.email,
          u.phone,
          u.whatsapp_number,
          u.cohort_id,
          c.name as cohort_name,
          CASE 
            WHEN te.entry_date = CURRENT_DATE THEN true
            ELSE false
          END as has_submitted_today,
          te.entry_date as last_submission_date
        FROM users u
        JOIN cohorts c ON u.cohort_id = c.id
        LEFT JOIN LATERAL (
          SELECT entry_date
          FROM tracker_entries
          WHERE student_id = u.id
          ORDER BY entry_date DESC
          LIMIT 1
        ) te ON true
        WHERE u.role = 'student'
          AND u.is_active = true
          AND u.deleted_at IS NULL
          AND u.cohort_id = $1
          AND (te.entry_date IS NULL OR te.entry_date < CURRENT_DATE)
        ORDER BY u.name
      `;

      const result = await pool.query(query, [cohortId]);
      
      logger.info(`Found ${result.rows.length} students in cohort ${cohortId} without today's tracker`);
      
      return result.rows;
    } catch (error) {
      logger.error('Error fetching students by cohort:', error);
      throw error;
    }
  }

  /**
   * Check if student has valid WhatsApp number
   * @param student - Student tracker status
   * @returns boolean
   */
  static hasValidWhatsAppNumber(student: StudentTrackerStatus): boolean {
    const whatsappNumber = student.whatsapp_number || student.phone;
    
    if (!whatsappNumber) {
      logger.warn(`Student ${student.name} (${student.id}) has no phone/WhatsApp number`);
      return false;
    }

    // Check if number starts with + (country code)
    if (!whatsappNumber.startsWith('+')) {
      logger.warn(`Student ${student.name} has invalid number format: ${whatsappNumber}`);
      return false;
    }

    return true;
  }

  /**
   * Get student's WhatsApp number (prefer whatsapp_number, fallback to phone)
   * @param student - Student tracker status
   * @returns WhatsApp number or null
   */
  static getWhatsAppNumber(student: StudentTrackerStatus): string | null {
    return student.whatsapp_number || student.phone || null;
  }

  /**
   * Filter students with valid WhatsApp numbers
   * @param students - Array of students
   * @returns Filtered array of students with valid numbers
   */
  static filterStudentsWithValidNumbers(
    students: StudentTrackerStatus[]
  ): StudentTrackerStatus[] {
    return students.filter(student => this.hasValidWhatsAppNumber(student));
  }

  /**
   * Get statistics about tracker submissions
   * @returns Submission statistics
   */
  static async getTrackerStatistics(): Promise<{
    total_students: number;
    submitted_today: number;
    not_submitted_today: number;
    submission_rate: number;
  }> {
    try {
      const query = `
        SELECT 
          COUNT(DISTINCT u.id) as total_students,
          COUNT(DISTINCT CASE 
            WHEN te.entry_date = CURRENT_DATE THEN u.id 
          END) as submitted_today,
          COUNT(DISTINCT CASE 
            WHEN te.entry_date IS NULL OR te.entry_date < CURRENT_DATE THEN u.id 
          END) as not_submitted_today
        FROM users u
        LEFT JOIN LATERAL (
          SELECT entry_date
          FROM tracker_entries
          WHERE student_id = u.id
          ORDER BY entry_date DESC
          LIMIT 1
        ) te ON true
        WHERE u.role = 'student'
          AND u.is_active = true
          AND u.deleted_at IS NULL
      `;

      const result = await pool.query(query);
      const stats = result.rows[0];

      const submissionRate = stats.total_students > 0
        ? (stats.submitted_today / stats.total_students) * 100
        : 0;

      return {
        total_students: parseInt(stats.total_students),
        submitted_today: parseInt(stats.submitted_today),
        not_submitted_today: parseInt(stats.not_submitted_today),
        submission_rate: Math.round(submissionRate * 100) / 100
      };
    } catch (error) {
      logger.error('Error fetching tracker statistics:', error);
      throw error;
    }
  }
}
