import { Request, Response } from "express";
import * as service from "../services/session.service";

export const getTodaySession = async (
  req: Request,
  res: Response
) => {

  try {

    const cohortId = req.params.cohortId as string;

    const session =
      await service.getOrCreateTodaySession(cohortId);

    res.json(session);

  } catch (err) {

    res.status(500).json({
      message: "Failed to get session"
    });

  }
};