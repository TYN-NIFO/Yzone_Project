import { Router } from "express";
import authMiddleware from "../../../middleware/auth.middleware";
import roleMiddleware from "../../../middleware/role.middleware";
import * as TrackerCtrl from "../controllers/tracker.controller";

const router = Router();
router.use(authMiddleware);

// Student: submit tracker with optional file
router.post(
    "/submit",
    roleMiddleware(["student"]),
    TrackerCtrl.upload.single("proof"),
    TrackerCtrl.submitTracker
);

// Student: get own history
router.get("/my", roleMiddleware(["student"]), TrackerCtrl.getMyTrackers);

// Facilitator / mentor / faculty / executive: view cohort trackers
router.get(
    "/cohort/:cohortId",
    roleMiddleware(["facilitator", "industryMentor", "facultyPrincipal", "tynExecutive"]),
    TrackerCtrl.getCohortTrackers
);

// Mentor: rate a tracker entry
router.patch(
    "/rate/:entryId",
    roleMiddleware(["industryMentor"]),
    TrackerCtrl.rateTracker
);

export default router;
