import { Router } from "express";
import authMiddleware from "../../middleware/auth.middleware";
import { pool } from "../../config/db";

const router = Router();
router.use(authMiddleware);

// Get notifications for current user
router.get("/", async (req, res) => {
    try {
        const { id: userId, tenantId } = req.user!;
        const r = await pool.query(
            `SELECT * FROM notifications WHERE user_id = $1 AND tenant_id = $2
       ORDER BY created_at DESC LIMIT 50`,
            [userId, tenantId]
        );
        res.json({ success: true, data: r.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to fetch notifications" });
    }
});

// Mark as read
router.patch("/:id/read", async (req, res) => {
    try {
        await pool.query(
            "UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2",
            [req.params.id, req.user!.id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to mark as read" });
    }
});

// Mark all as read
router.patch("/read-all", async (req, res) => {
    try {
        await pool.query(
            "UPDATE notifications SET is_read = TRUE WHERE user_id = $1",
            [req.user!.id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to mark all as read" });
    }
});

export default router;
