import { Project } from "../types/project.types";
import { ProjectsRepo } from "../Repos/projects.repo";

const repo = new ProjectsRepo();

export class ProjectsService {
  createProject(data: Project) {
    return repo.createProject(data);
  }

  getProjectsByCohort(cohortId: string) {
    return repo.getProjectsByCohort(cohortId);
  }

  getProjectsByTeam(teamId: string) {
    return repo.getProjectsByTeam(teamId);
  }
}