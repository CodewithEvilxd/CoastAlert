import { Router } from 'express';
import { getSocialSignals, analyzeSocialFeed } from '../controllers/socialController';

const router = Router();

router.get('/', getSocialSignals);
router.post('/analyze', analyzeSocialFeed);

export default router;
