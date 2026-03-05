import { Request, Response } from "express";
import { pool } from "../../../config/db";
import { v4 as uuidv4 } from "uuid";

class TrackerController {
  // Add tracker
  static async add(req: Request, res: Response) {
    try {
      const { student_id, project_id, week, learned_today, issues, plan_for_tomorrow, status } = req.body;
      const id = uuidv4();

      const result = await pool.query(
        `INSERT INTO student_trackers
        (id, student_id, project_id, week, learned_today, issues, plan_for_tomorrow, status)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        RETURNING *`,
        [id, student_id, project_id, week, learned_today, issues, plan_for_tomorrow, status]
      );

      res.status(201).json({ message: "Tracker added", tracker: result.rows[0] });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to add tracker" });
    }
  }

  // Update tracker
  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { learned_today, issues, plan_for_tomorrow, status } = req.body;

      const result = await pool.query(
        `UPDATE student_trackers SET
          learned_today = COALESCE($1, learned_today),
          issues = COALESCE($2, issues),
          plan_for_tomorrow = COALESCE($3, plan_for_tomorrow),
          status = COALESCE($4, status)
        WHERE id = $5
        RETURNING *`,
        [learned_today, issues, plan_for_tomorrow, status, id]
      );

      if (result.rows.length === 0) return res.status(404).json({ error: "Tracker not found" });

      res.json({ message: "Tracker updated", tracker: result.rows[0] });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to update tracker" });
    }
  }

  // Get trackers by student
  static async getByStudent(req: Request, res: Response) {
    try {
      const { id } = req.params; // student_id
      const result = await pool.query(
        `SELECT * FROM student_trackers WHERE student_id = $1 ORDER BY week`,
        [id]
      );
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch trackers" });
    }
  }
}

export default TrackerController;
