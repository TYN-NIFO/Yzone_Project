import { Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";
import { JwtPayload } from "../types/auth.types";
import { AuthRequest } from "../types/custom-request";

const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      res.status(401).json({ success: false, message: "No token provided" });
      return;
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback-secret"
    ) as JwtPayload;

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

export default authMiddleware;

