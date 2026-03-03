import CohortRepository from "../repositories/cohort.repo";
import { Cohort } from "../types/cohort.types";

class CohortService {
  static async createCohort(data: Cohort) {
    return await CohortRepository.create(data);
  }

  static async getCohortsByTenant(tenantId: string) {
    return await CohortRepository.getByTenant(tenantId);
  }

  static async getCohortById(id: string, tenantId: string) {
    return await CohortRepository.getById(id, tenantId);
  }

  static async updateCohort(id: string, data: any, tenantId: string) {
    return await CohortRepository.update(id, data, tenantId);
  }

  static async deleteCohort(id: string, tenantId: string) {
    return await CohortRepository.delete(id, tenantId);
  }

  static async getCohortStats(cohortId: string) {
    return await CohortRepository.getStats(cohortId);
  }

  static async assignFacilitator(cohortId: string, facilitatorId: string, tenantId: string) {
    return await CohortRepository.assignFacilitator(cohortId, facilitatorId, tenantId);
  }
}

export default CohortService;