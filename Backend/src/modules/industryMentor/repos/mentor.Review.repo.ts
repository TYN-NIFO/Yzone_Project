import { pool } from "../../../config/db";
import { MentorReview } from "../types/mentorReview.types";

class MentorReviewRepository {
  
  static async create(review: MentorReview) {
    const result = await pool.query(
      `INSERT INTO mentor_reviews
        (mentor_id, student_id, tenant_id, cohort_id, rating, feedback)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        review.mentorId,
        review.studentId,
        review.tenantId,
        review.cohortId,
        review.rating,
        review.feedback || null
      ]
    );
    return result.rows[0];
  }

  static async getAllByMentor(mentorId: string) {
    const result = await pool.query(
      "SELECT * FROM mentor_reviews WHERE mentor_id = $1",
      [mentorId]
    );
    return result.rows;
  }

  static async getById(id: string) {
    const result = await pool.query(
      "SELECT * FROM mentor_reviews WHERE id = $1",
      [id]
    );
    return result.rows[0];
  }
}

export default MentorReviewRepository;