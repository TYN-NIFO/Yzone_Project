import { v4 as uuid } from "uuid";
import * as repo from "../repos/attendance.repo";
import { MarkAttendanceDTO } from "../types/attendance.types";

export const markAttendance = async (
  sessionId: string,
  data: MarkAttendanceDTO
) => {

  return repo.createAttendance({
    id: uuid(),
    sessionId,
    studentId: data.studentId,
    status: data.status,
    reason: data.reason,
    markedBy: data.markedBy
  });
};

export const getSessionAttendance = async (sessionId: string) => {
  return repo.getAttendanceBySession(sessionId);
};