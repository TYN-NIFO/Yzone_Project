import { Request, Response } from "express";
import multer from "multer";
import * as TrackerService from "../services/tracker.service";

export const upload = multer({ storage: multer.memoryStorage() });

export const submitTracker = async (req: Request, res: Response): Promise<void> => {
    try {
        const { tasksCompleted, learningSummary, hoursSpent, challenges, entryDate } = req.body;
        const studentId = req.user!.id;
        const cohortId = req.user!.cohortId!;
        const tenantId = req.user!.tenantId!;
        const data = await TrackerService.submitTracker({
            studentId, cohortId, tenantId,
            tasksCompleted, learningSummary,
            hoursSpent: parseFloat(hoursSpent),
            challenges, entryDate,
        });
        res.status(201).json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to submit tracker" });
    }
};

export const getMyTrackers = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await TrackerService.getMyTrackers(req.user!.id);
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to fetch trackers" });
    }
};

export const getCohortTrackers = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await TrackerService.getTrackersByCohort(
            req.params.cohortId as string,
            req.user!.tenantId!
        );
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to fetch cohort trackers" });
    }
};

export const rateTracker = async (req: Request, res: Response): Promise<void> => {
    try {
        const { rating, comment } = req.body;
        const data = await TrackerService.submitMentorRating(
            req.params.entryId as string,
            rating,
            comment,
            req.user!.id
        );
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to rate tracker" });
    }
};
