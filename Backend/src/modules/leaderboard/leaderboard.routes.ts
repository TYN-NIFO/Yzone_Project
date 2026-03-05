import { Router } from "express";
import authMiddleware from "../../middleware/auth.middleware";
import roleMiddleware from "../../middleware/role.middleware";
import { getLeaderboard, getStudentRank } from "./leaderboard.service";

const router = Router();
router.use(authMiddleware);

router.get("/:cohortId", async (req, res) => {
    try {
        const { cohortId } = req.params;
        const tenantId = req.user!.tenantId!;
        const limit = parseInt(req.query.limit as string) || 10;
        const data = await getLeaderboard(cohortId, tenantId, limit);
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to fetch leaderboard" });
    }
});

router.get("/:cohortId/my-rank", roleMiddleware(["student"]), async (req, res) => {
    try {
        const data = await getStudentRank(req.user!.id, req.params.cohortId);
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to fetch rank" });
    }
});

export default router;
