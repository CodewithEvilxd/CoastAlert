import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'COASTALERT_JWT_SECRET_FALLBACK_2026';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: 'citizen' | 'volunteer' | 'analyst';
  };
}

/**
 * Gating middleware to ensure user is logged in
 */
export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Authorization token missing or malformed' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: 'citizen' | 'volunteer' | 'analyst' };

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
}

/**
 * Gating middleware to restrict access to specific roles (e.g. analyst only)
 */
export function roleMiddleware(roles: ('citizen' | 'volunteer' | 'analyst')[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
      return;
    }

    next();
  };
}
