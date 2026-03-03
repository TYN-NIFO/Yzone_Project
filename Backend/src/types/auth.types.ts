export interface JwtPayload {
  id: string;
  role: UserRole;
  tenantId: string;
  cohortId?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    tenantId: string;
    cohortId?: string;
  };
}

export type UserRole =
  | "tynExecutive"
  | "facilitator"
  | "facultyPrincipal"
  | "industryMentor"
  | "student";