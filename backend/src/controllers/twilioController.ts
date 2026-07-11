import { Request, Response } from 'express';

export function receiveWhatsAppStatus(req: Request, res: Response): void {
  const statusUpdate = {
    messageSid: req.body.MessageSid,
    messageStatus: req.body.MessageStatus,
    errorCode: req.body.ErrorCode,
    errorMessage: req.body.ErrorMessage,
    from: req.body.From,
    to: req.body.To,
    body: req.body.Body,
    receivedAt: new Date().toISOString()
  };

  console.log('Twilio WhatsApp status callback:', JSON.stringify(statusUpdate));
  res.sendStatus(200);
}
