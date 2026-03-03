import { v4 as uuid } from "uuid";
import * as repo from "../repos/session.repo";
import { CreateSession } from "../types/session.types";

export const getOrCreateTodaySession = async (
  cohortId: string
): Promise<CreateSession> => {
  let session = await repo.findSessionByDate(
    cohortId
  );

  if (!session) {

    session = await repo.createSession({
      id: uuid(),
      cohortId,
      title: "Working Day"
    });
  }

  return session;
};