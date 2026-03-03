// src/modules/industryMentor/types/mentorReview.types.ts

export interface MentorReview {
  id?: string;
  mentorId: string;
  studentId: string;
  tenantId: string;
  cohortId: string;
  rating: number;       // 0-5 (decimal)
  feedback?: string;
  reviewDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// Optional: interface for updating a review
export interface MentorReviewUpdate {
  id: string;
  rating?: number;
  feedback?: string;
}