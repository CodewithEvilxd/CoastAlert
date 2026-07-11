import { Router } from 'express';
import { getOfficialAlerts, sendWhatsAppAlert } from '../controllers/alertController';
import { ingestLiveSocialFeed } from '../controllers/socialFeedController';
import { syncOfficialAlertsController } from '../controllers/officialController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/official', getOfficialAlerts);
router.post('/live-ingest', ingestLiveSocialFeed);
router.post('/sync', syncOfficialAlertsController);
router.post('/whatsapp', authMiddleware as any, sendWhatsAppAlert as any);

export default router;
