import express from "express";
import cors from "cors";
import authRoutes from "./modules/auth/auth.routes";
import userRoutes from "./modules/user/user.routes";
import studentRoutes from "./modules/student/routes/student.routes";
import { facilitatorRoutes } from "./modules/facilitator/routes/facilitator.routes";
import executiveRoutes from "./modules/tynExecutive/routes/executive.routes";
import mentorRoutes from "./modules/industryMentor/routes/mentor.routes";
import facultyRoutes from "./modules/facultyPrincipal/routes/faculty.routes";
import { startTrackerReminderCron, startLeaderboardCalculationCron } from "./cron/tracker-reminder.cron";
<<<<<<< HEAD
=======
import { DailyTrackerReminderCron } from "./cron/daily-tracker-reminder.cron";
import logger from "./config/logger";
>>>>>>> e25b0f6 (hi)

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Yzone API running 🚀",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/facilitator", facilitatorRoutes);
app.use("/api/executive", executiveRoutes);
app.use("/api/mentor", mentorRoutes);
app.use("/api/faculty", facultyRoutes);

<<<<<<< HEAD
startTrackerReminderCron();
startLeaderboardCalculationCron();
=======
// Initialize cron jobs
logger.info('Initializing cron jobs...');
startTrackerReminderCron();
startLeaderboardCalculationCron();
DailyTrackerReminderCron.start();
logger.info('All cron jobs initialized successfully');
>>>>>>> e25b0f6 (hi)

export default app;