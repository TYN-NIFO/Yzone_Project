import { Request, Response } from "express";
import * as service from "../services/attendance.service";

export const markAttendance = async (req: Request, res: Response) => {

  const sessionId = req.params.sessionId as string;

  const attendance = await service.markAttendance(
    sessionId,
    req.body
  );

  res.json(attendance);
};

export const getAttendance = async (req: Request, res: Response) => {

  const sessionId = req.params.sessionId as string;

  const data = await service.getSessionAttendance(sessionId);

  res.json(data);
};