import { Response, NextFunction } from "express";
import { UserRole } from "../types/auth.types";
import { AuthRequest } from "../types/custom-request";

const roleMiddleware = (allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const user = req.user;

    if (!user || !allowedRoles.includes(user.role)) {
      res.status(403).json({ 
        success: false, 
        message: "Access Denied: Insufficient permissions" 
      });
      return;
    }

    next();
  };
};

export default roleMiddleware;
