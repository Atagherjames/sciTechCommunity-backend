import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
}

const JWT_SECRET = process.env.JWT_SECRET || "scitech_community_jwt_secret_key_2026";

export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
    if (!err && decoded) {
      req.userId = decoded.id;
      req.userEmail = decoded.email;
    }
    next();
  });
};

export const requireAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
};

export const signToken = (payload: { id: string; email: string }): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
};
