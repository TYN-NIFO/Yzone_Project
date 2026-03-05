import { CohortRepo } from "../Repos/cohort.repo";
import { Cohort } from "../types/cohort.types";

export class CohortService {
  private repo = new CohortRepo();

  createCohort(data: Cohort) {
    return this.repo.createCohort(data);
  }

  getByTenant(tenantId: string) {
    return this.repo.getByTenant(tenantId);
  }

  // ✅ Call the correct method from repo
  getAllCohorts() {
    return this.repo.getAll();
  }
}