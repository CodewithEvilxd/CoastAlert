import { Request, Response } from 'express';
import { syncOfficialAlerts } from '../services/officialAlertService';

export async function syncOfficialAlertsController(req: Request, res: Response): Promise<void> {
  try {
    const synced = await syncOfficialAlerts();
    res.status(200).json({
      message: 'Official alert sources synced successfully.',
      count: synced.length,
      alerts: synced
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error syncing official alerts', error: error.message });
  }
}
