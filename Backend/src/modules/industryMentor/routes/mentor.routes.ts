import { Router } from "express";
import { MentorController } from "../controllers/mentor.controller";
import authMiddleware from "../../../middleware/auth.middleware";
import roleMiddleware from "../../../middleware/role.middleware";

const router = Router();
const mentorController = new MentorController();

router.use(authMiddleware);

router.get("/dashboard", roleMiddleware(["industryMentor"]), (req, res) => mentorController.getDashboard(req, res));
router.get("/students", roleMiddleware(["industryMentor"]), (req, res) => mentorController.getAssignedStudents(req, res));
router.get("/assigned-students", roleMiddleware(["industryMentor"]), (req, res) => mentorController.getAssignedStudents(req, res));
router.post("/review", roleMiddleware(["industryMentor"]), (req, res) => mentorController.submitReview(req, res));
router.get("/reviews/:studentId", roleMiddleware(["industryMentor", "student"]), (req, res) => mentorController.getStudentReviews(req, res));

export default router;
