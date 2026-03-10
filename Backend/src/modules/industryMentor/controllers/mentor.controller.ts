import { Response } from "express";
import { MentorService } from "../services/mentor.service";
import { AuthRequest } from "../../../types/custom-request";

const mentorService = new MentorService();

export class MentorController {
  async createMentor(req: AuthRequest, res: Response): Promise<void> {
    try {
      const mentor = await mentorService.createMentor(req.body, req.user!.tenantId);
      res.status(201).json({ success: true, data: mentor });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getAllMentors(req: AuthRequest, res: Response): Promise<void> {
    try {
      const mentors = await mentorService.getAllMentors(req.user!.tenantId);
      res.status(200).json({ success: true, data: mentors });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getMentorById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const mentor = await mentorService.getMentorById(id, req.user!.tenantId);
      if (!mentor) {
        res.status(404).json({ success: false, message: "Mentor not found" });
        return;
      }
      res.status(200).json({ success: true, data: mentor });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async assignStudents(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { mentorId, studentIds, cohortId } = req.body;
      const assignments = await mentorService.assignStudentsToMentor(
        mentorId,
        studentIds,
        req.user!.tenantId,
        cohortId
      );
      res.status(200).json({ success: true, data: assignments });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getAssignedStudents(req: AuthRequest, res: Response): Promise<void> {
    try {
      const students = await mentorService.getAssignedStudents(req.user!.id, req.user!.tenantId);
      res.status(200).json({ success: true, data: students });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async submitReview(req: AuthRequest, res: Response): Promise<void> {
    try {
      const reviewData = {
        mentorId: req.user!.id,
        studentId: req.body.studentId,
        tenantId: req.user!.tenantId,
        rating: req.body.rating,
        feedback: req.body.feedback,
      };
      
      const review = await mentorService.submitReview(reviewData);
      res.status(201).json({ success: true, data: review });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getStudentReviews(req: AuthRequest, res: Response): Promise<void> {
    try {
      const studentId = req.params.studentId as string;
      const reviews = await mentorService.getReviews(studentId, req.user!.tenantId);
      res.status(200).json({ success: true, data: reviews });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getDashboard(req: AuthRequest, res: Response): Promise<void> {
    try {
      const students = await mentorService.getAssignedStudents(req.user!.id, req.user!.tenantId);
      
      // Calculate average score from students who have scores
      const studentsWithScores = students.filter((s: any) => s.score !== null && s.score !== undefined);
      const avgScore = studentsWithScores.length > 0
        ? studentsWithScores.reduce((sum: number, s: any) => sum + parseFloat(s.score || 0), 0) / studentsWithScores.length
        : 0;

      const stats = {
        totalStudents: students.length,
        activeStudents: students.filter((s: any) => s.recent_trackers > 0).length,
        avgScore: avgScore,
      };

      res.status(200).json({ success: true, data: { stats, students } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
