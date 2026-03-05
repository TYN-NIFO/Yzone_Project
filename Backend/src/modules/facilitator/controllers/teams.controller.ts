import { Request, Response } from "express";
import { TeamsService } from "../services/teams.service";
import { pool } from "../../../config/db";
import { AuthRequest } from "../../../types/custom-request";

const service = new TeamsService();

export class TeamsController {
  static async create(req: AuthRequest, res: Response) {
    try {
      const { tenantId } = req.user!;
      const { cohortId, name, description, maxMembers, studentIds, mentorId } = req.body;

      // Create team
      const team = await service.createTeam({
        ...req.body,
        tenant_id: tenantId,
      });

      // Add students to team if provided
      if (studentIds && Array.isArray(studentIds) && studentIds.length > 0) {
        for (const studentId of studentIds) {
          await pool.query(
            `INSERT INTO team_members (team_id, student_id, joined_at)
             VALUES ($1, $2, CURRENT_TIMESTAMP)
             ON CONFLICT (team_id, student_id) DO NOTHING`,
            [team.id, studentId]
          );
        }
      }

      // Assign mentor to team if provided
      if (mentorId) {
        // First, assign mentor to all students in the team
        if (studentIds && Array.isArray(studentIds) && studentIds.length > 0) {
          for (const studentId of studentIds) {
            await pool.query(
              `INSERT INTO mentor_assignments (mentor_id, student_id, tenant_id, cohort_id, team_id, is_active)
               VALUES ($1, $2, $3, $4, $5, true)
               ON CONFLICT (mentor_id, student_id, cohort_id) 
               DO UPDATE SET team_id = $5, is_active = true, updated_at = CURRENT_TIMESTAMP`,
              [mentorId, studentId, tenantId, cohortId, team.id]
            );
          }
        }

        // Store team-mentor relationship
        await pool.query(
          `UPDATE teams SET mentor_id = $1 WHERE id = $2`,
          [mentorId, team.id]
        );
      }

      res.status(201).json({ success: true, data: team, message: 'Team created successfully' });
    } catch (err: any) {
      console.error('Error creating team:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async getByCohort(req: Request, res: Response) {
    try {
      const cohortId = Array.isArray(req.params.cohortId)
        ? req.params.cohortId[0]
        : req.params.cohortId;
      const teams = await service.getByCohort(cohortId);
      res.status(200).json({ success: true, data: teams });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}