import { Request, Response } from 'express';
import { MOUService } from '../services/mou.service';
import { AuthRequest } from '../../../types/custom-request';

export class MOUController {
  static async uploadMOU(req: AuthRequest, res: Response) {
    try {
      const { tenantId, id: userId } = req.user!;
      const { title, description, expiry_date } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: 'File is required' });
      }

      if (!title) {
        return res.status(400).json({ error: 'Title is required' });
      }

      // Save file locally (Azure not configured)
      const fileUrl = `/uploads/mou/${file.filename}`;

      // Create MOU record
      const mou = await MOUService.createMOU(
        tenantId,
        userId,
        { title, description, expiry_date },
        {
          fileName: file.originalname,
          fileUrl,
          fileSize: file.size,
          fileType: file.mimetype
        }
      );

      res.status(201).json({
        success: true,
        message: 'MOU uploaded successfully',
        data: mou
      });
    } catch (error) {
      console.error('Error uploading MOU:', error);
      res.status(500).json({ success: false, error: 'Failed to upload MOU' });
    }
  }

  static async getMOUs(req: AuthRequest, res: Response) {
    try {
      const { tenantId } = req.user!;
      const mous = await MOUService.getMOUsByTenant(tenantId);

      res.json({
        message: 'MOUs retrieved successfully',
        mous
      });
    } catch (error) {
      console.error('Error getting MOUs:', error);
      res.status(500).json({ error: 'Failed to retrieve MOUs' });
    }
  }

  static async getMOUById(req: AuthRequest, res: Response) {
    try {
      const { tenantId } = req.user!;
      const { mouId } = req.params;

      const mou = await MOUService.getMOUById(mouId as string, tenantId);
      if (!mou) {
        return res.status(404).json({ error: 'MOU not found' });
      }

      res.json({
        message: 'MOU retrieved successfully',
        mou
      });
    } catch (error) {
      console.error('Error getting MOU:', error);
      res.status(500).json({ error: 'Failed to retrieve MOU' });
    }
  }

  static async updateMOUStatus(req: AuthRequest, res: Response) {
    try {
      const { tenantId, id: userId } = req.user!;
      const { mouId } = req.params;
      const { status, rejection_reason } = req.body;

      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      const mou = await MOUService.updateMOUStatus(
        mouId as string,
        tenantId,
        userId,
        { status, rejection_reason }
      );

      if (!mou) {
        return res.status(404).json({ error: 'MOU not found' });
      }

      res.json({
        message: `MOU ${status} successfully`,
        mou
      });
    } catch (error) {
      console.error('Error updating MOU status:', error);
      res.status(500).json({ error: 'Failed to update MOU status' });
    }
  }

  static async deleteMOU(req: AuthRequest, res: Response) {
    try {
      const { tenantId } = req.user!;
      const { mouId } = req.params;

      const deleted = await MOUService.deleteMOU(mouId as string, tenantId);
      if (!deleted) {
        return res.status(404).json({ error: 'MOU not found' });
      }

      res.json({ message: 'MOU deleted successfully' });
    } catch (error) {
      console.error('Error deleting MOU:', error);
      res.status(500).json({ error: 'Failed to delete MOU' });
    }
  }

  static async getMOUStats(req: AuthRequest, res: Response) {
    try {
      const { tenantId } = req.user!;
      const stats = await MOUService.getMOUStats(tenantId);

      res.json({
        message: 'MOU statistics retrieved successfully',
        stats
      });
    } catch (error) {
      console.error('Error getting MOU stats:', error);
      res.status(500).json({ error: 'Failed to retrieve MOU statistics' });
    }
  }
}