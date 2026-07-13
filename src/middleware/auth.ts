import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt.js";
import type { JwtPayload } from "../utils/jwt.js";

// Augment Express Request with the current user payload
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Verifies the Bearer JWT from the Authorization header and attaches the
 * decoded payload to req.user.
 */
export const protect = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      res.status(401).json({ success: false, message: "Unauthorized: no token provided" });
      return;
    }
    const token = header.split(" ")[1];
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ success: false, message: "Unauthorized: invalid token" });
  }
};

/**
 * Restricts access to users whose role is included in the allowed list.
 * Must be used AFTER `protect`.
 */
export const restrictTo =
  (...roles: string[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: "Forbidden: you do not have permission to perform this action",
      });
      return;
    }
    next();
  };