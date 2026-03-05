import { Request, Response } from "express";
import { pool } from "../../../config/db";
import { v4 as uuidv4 } from "uuid";

class SubmissionController {
  // Add submission
  static async submit(req: Request, res: Response) {
    try {
      const { student_id, project_id, status } = req.body;
      const file_url = req.file?.path;
      const id = uuidv4();

      const result = await pool.query(
        `INSERT INTO submissions
        (id, student_id, project_id, file_url, status)
        VALUES ($1,$2,$3,$4,$5)
        RETURNING *`,
        [id, student_id, project_id, file_url, status || "SUBMITTED"]
      );

      res.status(201).json({ message: "Submission created", submission: result.rows[0] });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to create submission" });
    }
  }

  // Update submission
  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const file_url = req.file?.path;

      const result = await pool.query(
        `UPDATE submissions SET
          file_url = COALESCE($1, file_url),
          status = COALESCE($2, status)
        WHERE id = $3
        RETURNING *`,
        [file_url, status, id]
      );

      if (result.rows.length === 0) return res.status(404).json({ error: "Submission not found" });

      res.json({ message: "Submission updated", submission: result.rows[0] });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to update submission" });
    }
  }
}

export default SubmissionController;
