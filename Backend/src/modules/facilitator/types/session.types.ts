export interface Session {
  id: string;
  cohortId: string;
  title: string;
  sessionDate: string;
  createdAt: string;
}

export interface CreateSession {
  id: string;
  cohortId: string;
  title: string;
}