import { Request, Response } from 'express';
import { registerExpoPushToken } from '../services/pushService';

export async function registerPushToken(req: Request, res: Response): Promise<void> {
  try {
    const { token } = req.body;
    if (!token || typeof token !== 'string') {
      res.status(400).json({ message: 'Expo push token is required.' });
      return;
    }

    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Authentication required to register push token.' });
      return;
    }

    await registerExpoPushToken(userId, token);
    res.status(200).json({ message: 'Push token registered successfully.' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error registering push token', error: error.message });
  }
}
