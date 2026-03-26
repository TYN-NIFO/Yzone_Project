import { Request, Response } from "express";
import { AuthRequest } from "../../../types/custom-request";
import { pool } from "../../../config/db";
import * as service from "../services/session.service";

export const getTodaySession = async (
  req: Request,
  res: Response
) => {

  try {

    const cohortId = req.params.cohortId as string;

    const session =
      await service.getOrCreateTodaySession(cohortId);

    res.json(session);

  } catch (err) {

    res.status(500).json({
      message: "Failed to get session"
    });

  }
};

// Create a new session
export const createSession = async (req: AuthRequest, res: Response) => {
  try {
    const facilitatorId = req.user!.id;
    const tenantId = req.user!.tenantId;
    const { cohortId, title, sessionDate, description } = req.body;

    if (!cohortId || !title || !sessionDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cohort ID, title, and session date are required' 
      });
    }

    // Verify facilitator has access to this cohort
    const cohortCheck = await pool.query(
      `SELECT id FROM cohorts WHERE id = $1 AND facilitator_id = $2 AND tenant_id = $3 AND deleted_at IS NULL`,
      [cohortId, facilitatorId, tenantId]
    );

    if (cohortCheck.rows.length === 0) {
      return res.status(403).json({ 
        success: false, 
        message: 'Unauthorized to create session for this cohort' 
      });
    }

    // Create session
    const result = await pool.query(
      `INSERT INTO sessions (cohort_id, tenant_id, facilitator_id, title, session_date, session_time, topic, description)
       VALUES ($1, $2, $3, $4, $5, '00:00', $4, $6)
       RETURNING *`,
      [cohortId, tenantId, facilitatorId, title, sessionDate, description || null]
    );

    res.status(201).json({ 
      success: true, 
      message: 'Session created successfully',
      data: result.rows[0]
    });

  } catch (error: any) {
    console.error('Error creating session:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all sessions for a cohort
export const getSessionsByCohort = async (req: AuthRequest, res: Response) => {
  try {
    const facilitatorId = req.user!.id;
    const tenantId = req.user!.tenantId;
    const { cohortId } = req.params;

    // Verify facilitator has access to this cohort
    const cohortCheck = await pool.query(
      `SELECT id FROM cohorts WHERE id = $1 AND facilitator_id = $2 AND tenant_id = $3 AND deleted_at IS NULL`,
      [cohortId, facilitatorId, tenantId]
    );

    if (cohortCheck.rows.length === 0) {
      return res.status(403).json({ 
        success: false, 
        message: 'Unauthorized to view sessions for this cohort' 
      });
    }

    // Get sessions with attendance count
    const sessions = await pool.query(
      `SELECT 
        s.*,
        COUNT(DISTINCT a.id) as total_marked,
        COUNT(DISTINCT CASE WHEN a.is_present = true THEN a.id END) as present_count,
        COUNT(DISTINCT u.id) as total_students
       FROM sessions s
       LEFT JOIN attendance a ON s.id = a.session_id
       LEFT JOIN users u ON u.cohort_id = s.cohort_id AND u.role = 'student' AND u.deleted_at IS NULL
       WHERE s.cohort_id = $1
       GROUP BY s.id
       ORDER BY s.session_date DESC, s.created_at DESC`,
      [cohortId]
    );

    res.json({ 
      success: true, 
      data: sessions.rows
    });

  } catch (error: any) {
    console.error('Error getting sessions:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a session
export const deleteSession = async (req: AuthRequest, res: Response) => {
  try {
    const facilitatorId = req.user!.id;
    const tenantId = req.user!.tenantId;
    const { sessionId } = req.params;

    // Verify facilitator has access to this session
    const sessionCheck = await pool.query(
      `SELECT s.id FROM sessions s
       JOIN cohorts c ON s.cohort_id = c.id
       WHERE s.id = $1 AND c.facilitator_id = $2 AND c.tenant_id = $3 AND c.deleted_at IS NULL`,
      [sessionId, facilitatorId, tenantId]
    );

    if (sessionCheck.rows.length === 0) {
      return res.status(403).json({ 
        success: false, 
        message: 'Unauthorized to delete this session' 
      });
    }

    // Delete session (this will cascade delete attendance records)
    await pool.query(`DELETE FROM sessions WHERE id = $1`, [sessionId]);

    res.json({ 
      success: true, 
      message: 'Session deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting session:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};