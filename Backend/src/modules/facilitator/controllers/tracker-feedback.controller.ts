import { Request, Response } from 'express';
import { TrackerFeedbackService } from '../services/tracker-feedback.service';
import { AuthRequest } from '../../../types/custom-request';

export class TrackerFeedbackController {
  async getTrackerEntries(req: AuthRequest, res: Response) {
    try {
      const { tenantId } = req.user!;
      const { cohortId, studentId } = req.query;

      const entries = await TrackerFeedbackService.getTrackerEntriesWithFeedback(
        tenantId,
        cohortId as string,
        studentId as string
      );

      res.json({
        message: 'Tracker entries retrieved successfully',
        entries
      });
    } catch (error) {
      console.error('Error getting tracker entries:', error);
      res.status(500).json({ error: 'Failed to retrieve tracker entries' });
    }
  }

  async createFeedback(req: AuthRequest, res: Response) {
    try {
      const { tenantId, id: userId } = req.user!;
      const feedbackData = req.body;

      if (!feedbackData.tracker_entry_id || !feedbackData.feedback || !feedbackData.rating) {
        return res.status(400).json({ error: 'Tracker entry ID, feedback, and rating are required' });
      }

      if (feedbackData.rating < 1 || feedbackData.rating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
      }

      const feedback = await TrackerFeedbackService.createFeedback(
        userId,
        tenantId,
        feedbackData
      );

      res.status(201).json({
        message: 'Feedback created successfully',
        feedback
      });
    } catch (error) {
      console.error('Error creating feedback:', error);
      res.status(500).json({ error: 'Failed to create feedback' });
    }
  }

  async updateFeedback(req: AuthRequest, res: Response) {
    try {
      const { tenantId, id: userId } = req.user!;
      const { feedbackId } = req.params;
      const updateData = req.body;

      if (updateData.rating && (updateData.rating < 1 || updateData.rating > 5)) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
      }

      const feedback = await TrackerFeedbackService.updateFeedback(
        feedbackId as string,
        userId,
        tenantId,
        updateData
      );

      if (!feedback) {
        return res.status(404).json({ error: 'Feedback not found or unauthorized' });
      }

      res.json({
        message: 'Feedback updated successfully',
        feedback
      });
    } catch (error) {
      console.error('Error updating feedback:', error);
      res.status(500).json({ error: 'Failed to update feedback' });
    }
  }

  async deleteFeedback(req: AuthRequest, res: Response) {
    try {
      const { tenantId, id: userId } = req.user!;
      const { feedbackId } = req.params;

      const deleted = await TrackerFeedbackService.deleteFeedback(
        feedbackId as string,
        userId,
        tenantId
      );

      if (!deleted) {
        return res.status(404).json({ error: 'Feedback not found or unauthorized' });
      }

      res.json({ message: 'Feedback deleted successfully' });
    } catch (error) {
      console.error('Error deleting feedback:', error);
      res.status(500).json({ error: 'Failed to delete feedback' });
    }
  }

  async getFeedbackStats(req: AuthRequest, res: Response) {
    try {
      const { tenantId } = req.user!;
      const { cohortId } = req.query;

      const stats = await TrackerFeedbackService.getFeedbackStats(
        tenantId,
        cohortId as string
      );

      res.json({
        message: 'Feedback statistics retrieved successfully',
        stats
      });
    } catch (error) {
      console.error('Error getting feedback stats:', error);
      res.status(500).json({ error: 'Failed to retrieve feedback statistics' });
    }
  }
}