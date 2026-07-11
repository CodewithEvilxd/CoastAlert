import { Router, Request, Response, NextFunction } from 'express';
import {
  createReport,
  getReports,
  getReportById,
  confirmReport,
  updateReportStatus,
  getHeatmapData
} from '../controllers/reportController';
import { authMiddleware, roleMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { upload } from '../middleware/upload';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'COASTALERT_JWT_SECRET_FALLBACK_2026';

// Middleware to extract user if JWT token is optionally provided
const optionalAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: 'citizen' | 'volunteer' | 'analyst' };
      req.user = decoded;
    } catch (err) {
      // Ignore token verification error and proceed anonymously
    }
  }
  next();
};

// Heatmap endpoint (needs to be defined before GET /:id so it doesn't match ID)
router.get('/heatmap', getHeatmapData);

// CRUD routes
router.post('/', upload.array('images', 3), optionalAuth as any, createReport as any);
router.get('/', getReports);
router.get('/:id', getReportById);

// Community confirmation & Admin status change
router.post('/:id/confirm', authMiddleware as any, confirmReport as any);
router.patch(
  '/:id/status',
  authMiddleware as any,
  roleMiddleware(['analyst']) as any,
  updateReportStatus as any
);

export default router;
