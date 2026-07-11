import { Router } from 'express';
import { receiveWhatsAppStatus } from '../controllers/twilioController';

const router = Router();

router.post('/status-callback', receiveWhatsAppStatus);

export default router;
