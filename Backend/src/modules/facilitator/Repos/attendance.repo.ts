import { pool } from "../../../config/db";
import { Attendance } from "../types/attendance.types";

export const createAttendance = async (attendance: Attendance) => {

  const query = `
    INSERT INTO attendance
    (id, session_id, student_id, status, reason, marked_by)
    VALUES ($1,$2,$3,$4,$5,$6)
    RETURNING *`;

  const values = [
    attendance.id,
    attendance.sessionId,
    attendance.studentId,
    attendance.status,
    attendance.reason,
    attendance.markedBy
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