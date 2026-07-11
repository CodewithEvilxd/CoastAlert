import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  phone: string;
  passwordHash: string;
  role: 'citizen' | 'volunteer' | 'analyst';
  region?: string;
  savedLocation?: { lat: number; lng: number };
  expoPushTokens: string[];
  alertRadiusKm: number;
  language: 'en' | 'hi';
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['citizen', 'volunteer', 'analyst'], default: 'citizen' },
    region: { type: String },
    savedLocation: {
      lat: { type: Number },
      lng: { type: Number }
    },
    expoPushTokens: { type: [String], default: [] },
    alertRadiusKm: { type: Number, default: 10 },
    language: { type: String, enum: ['en', 'hi'], default: 'en' }
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);
