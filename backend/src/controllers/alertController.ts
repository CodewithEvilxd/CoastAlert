import { Request, Response } from 'express';
import OfficialAlert from '../models/OfficialAlert';
import { sendWhatsApp } from '../services/smsService';

/**
 * Retrieves all currently active official warnings (where expiresAt >= now).
 */
export async function getOfficialAlerts(req: Request, res: Response): Promise<void> {
  try {
    const { region } = req.query;
    const now = new Date();

    const query: any = {
      expiresAt: { $gte: now }
    };

    if (region) {
      query.region = region;
    }

    const alerts = await OfficialAlert.find(query).sort({ issuedAt: -1 });
    res.status(200).json(alerts);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching active official alerts', error: error.message });
  }
}

export async function sendWhatsAppAlert(req: Request, res: Response): Promise<void> {
  try {
    const { phone, message } = req.body;
    if (!phone || typeof phone !== 'string' || !message || typeof message !== 'string') {
      res.status(400).json({ message: 'Phone and message are required.' });
      return;
    }

    await sendWhatsApp(phone.trim(), message);
    res.status(200).json({ message: 'WhatsApp alert queued.' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error sending WhatsApp alert', error: error.message });
  }
}
