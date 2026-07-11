import { Router } from 'express';
import { chatCommandCenter, getEconomicLoss, getWarRoomLogs } from '../controllers/aiController';

const router = Router();

// Endpoint for AI chatbot command center
router.post('/chat', chatCommandCenter);

// Endpoint for Blue Economy impact predictor
router.get('/economy/:reportId', getEconomicLoss);

// Endpoint for AI Disaster War Room agents log
router.get('/warroom/:reportId', getWarRoomLogs);

export default router;
