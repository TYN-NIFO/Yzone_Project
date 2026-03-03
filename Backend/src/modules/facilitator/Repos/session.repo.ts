import { pool } from "../../../config/db";
import { CreateSession } from "../types/session.types";

export const findSessionByDate = async (
  cohortId: string,
): Promise<CreateSession | null> => {

  const result = await pool.query(
  `SELECT 
    id,
    cohort_id as "cohortId",
    title,
    session_date::TEXT as "sessionDate",
    created_at as "createdAt"
   FROM sessions
   WHERE cohort_id=$1
   AND session_date=CURRENT_DATE`,
  [cohortId]
);
  return result.rows[0] || null;
};

export const createSession = async (
  session: CreateSession
): Promise<CreateSession> => {

  const result = await pool.query(
    `INSERT INTO sessions
     (id, cohort_id, title)
     VALUES ($1,$2,$3)
     RETURNING
 id,
 cohort_id as "cohortId",
 title,
 session_date::TEXT as "sessionDate",
 created_at as "createdAt"`,
    [
      session.id,
      session.cohortId,
      session.title
    ]
  );

  return result.rows[0];
};