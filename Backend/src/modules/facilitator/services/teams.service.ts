import { Team } from "../types/teams.types";
import { TeamsRepo } from "../Repos/teams.repo";

const repo = new TeamsRepo();

export class TeamsService {
  createTeam(data: Team) {
    return repo.createTeam(data);
  }

  getByCohort(cohortId: string) {
    return repo.getTeamsByCohort(cohortId);
  }
}