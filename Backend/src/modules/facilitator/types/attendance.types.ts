export type AttendanceStatus = "PRESENT" | "ABSENT";

export interface Attendance {
  id: string;
  sessionId: string;
  studentId: string;
  status: AttendanceStatus;
  reason?: string;
  markedBy: string;
  markedAt?: Date;
}

export interface MarkAttendanceDTO {
  studentId: string;
  status: AttendanceStatus;
  reason?: string;
  markedBy: string;
}