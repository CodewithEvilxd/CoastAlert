import { Router } from 'express';
import { registerPushToken } from '../controllers/notificationController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/register', authMiddleware as any, registerPushToken as any);

export default router;
