// src/modules/industryMentor/types/mentorReview.types.ts

export interface MentorReview {
  id?: string;
  mentorId: string;
  studentId: string;
  projectId: string;
  submissionId: string;
  rating: number;       // 1-5
  feedback?: string;
  status?: string;      // default 'APPROVED'
  createdAt?: Date;
}

// Optional: interface for updating a review
export interface MentorReviewUpdate {
  id: string;
  rating?: number;
  feedback?: string;
  status?: string;
}