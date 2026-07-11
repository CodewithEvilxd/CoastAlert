import { Router } from 'express';
import { getOfficialAlerts } from '../controllers/alertController';

const router = Router();

router.get('/official', getOfficialAlerts);

export default router;
