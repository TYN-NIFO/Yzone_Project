import { pool } from "../../../config/db";
import { Attendance } from "../types/attendance.types";

export const createAttendance = async (attendance: Attendance) => {

  // Get tenant_id and cohort_id from session
  const sessionRes = await pool.query(
    `SELECT tenant_id, cohort_id FROM sessions WHERE id = $1`, [attendance.sessionId]
  );
  const { tenant_id, cohort_id } = sessionRes.rows[0] || {};

  const query = `
    INSERT INTO attendance
    (id, session_id, student_id, tenant_id, cohort_id, is_present, marked_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *`;

  const values = [
    attendance.id,
    attendance.sessionId,
    attendance.studentId,
    tenant_id,
    cohort_id,
    attendance.status === 'PRESENT' ? true : false,
    attendance.markedBy || null
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

export const getAttendanceBySession = async (sessionId: string) => {

  const result = await pool.query(
    `SELECT * FROM attendance WHERE session_id=$1`,
    [sessionId]
  );

  return result.rows;
};