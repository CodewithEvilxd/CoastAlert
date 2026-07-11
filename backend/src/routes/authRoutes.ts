import { Router } from 'express';
import { signup, login, getMe, updateLocation } from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', authMiddleware as any, getMe as any);
router.patch('/location', authMiddleware as any, updateLocation as any);

export default router;
