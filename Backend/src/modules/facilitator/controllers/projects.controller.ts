import { Request, Response } from "express";
import { ProjectsService } from "../services/projects.service";

const service = new ProjectsService();

export class ProjectsController {
  static async createProject(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }
      const projectData = { ...req.body, tenantId };
      const project = await service.createProject(projectData);
      res.status(201).json({ success: true, data: project });
    } catch (err: any) {
      console.error('Error creating project:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async getProjectsByCohort(req: Request, res: Response) {
    try {
      const cohortId = Array.isArray(req.params.cohortId)
        ? req.params.cohortId[0]
        : req.params.cohortId;
      const projects = await service.getProjectsByCohort(cohortId);
      res.status(200).json({ success: true, data: projects });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async getProjectsByTeam(req: Request, res: Response) {
    try {
      const teamId = Array.isArray(req.params.teamId)
        ? req.params.teamId[0]
        : req.params.teamId;
      const projects = await service.getProjectsByTeam(teamId);
      res.status(200).json({ success: true, data: projects });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}