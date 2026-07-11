import mongoose, { Schema, Document } from 'mongoose';

export interface IOfficialAlert extends Document {
  hazardType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  region: string;
  message: string;
  issuedBy: string;
  issuedAt: Date;
  expiresAt: Date;
}

const OfficialAlertSchema = new Schema<IOfficialAlert>(
  {
    hazardType: { type: String, required: true },
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true },
    region: { type: String, required: true },
    message: { type: String, required: true },
    issuedBy: { type: String, default: 'INCOIS' },
    issuedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true }
  },
  { timestamps: true }
);

export default mongoose.model<IOfficialAlert>('OfficialAlert', OfficialAlertSchema);
