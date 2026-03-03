import { Request } from "express";
import { JwtPayload } from "./auth.types";

export interface AuthRequest extends Request {
  user?: JwtPayload;
}
