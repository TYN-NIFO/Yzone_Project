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

  // Get tenant_id from cohort
  const cohortRes = await pool.query(
    `SELECT tenant_id FROM cohorts WHERE id = $1`, [session.cohortId]
  );
  const tenantId = cohortRes.rows[0]?.tenant_id;

  const result = await pool.query(
    `INSERT INTO sessions (id, cohort_id, tenant_id, title, topic, session_date, session_time)
     VALUES ($1, $2, $3, $4, $4, CURRENT_DATE, '00:00')
     RETURNING
       id,
       cohort_id as "cohortId",
       title,
       session_date::TEXT as "sessionDate",
       created_at as "createdAt"`,
    [session.id, session.cohortId, tenantId, session.title]
  );

  return result.rows[0];
};