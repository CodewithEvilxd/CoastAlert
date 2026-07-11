import mongoose, { Schema, Document, Types } from 'mongoose';

export type HazardType =
  | 'tsunami'
  | 'high_waves'
  | 'coastal_flooding'
  | 'storm_surge'
  | 'oil_spill'
  | 'unusual_sea_behavior'
  | 'marine_debris'
  | 'rip_current'
  | 'river_overflow'
  | 'urban_flooding'
  | 'embankment_breach'
  | 'other';

export type SeverityType = 'low' | 'medium' | 'high' | 'critical';
export type ReportStatusType = 'pending' | 'community_verified' | 'high_confidence' | 'false_alarm';

export interface IReport extends Document {
  reportedBy?: Types.ObjectId;
  hazardType: HazardType;
  description: string;
  severity: SeverityType;
  images: string[];
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  status: ReportStatusType;
  credibilityScore: number;
  confirmations: Types.ObjectId[];
  isOfflineSynced: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PointSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [lng, lat]
      required: true
    }
  },
  { _id: false }
);

const ReportSchema = new Schema<IReport>(
  {
    reportedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    hazardType: {
      type: String,
      enum: [
        'tsunami',
        'high_waves',
        'coastal_flooding',
        'storm_surge',
        'oil_spill',
        'unusual_sea_behavior',
        'marine_debris',
        'rip_current',
        'river_overflow',
        'urban_flooding',
        'embankment_breach',
        'other'
      ],
      required: true
    },
    description: { type: String, required: true },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      required: true
    },
    images: { type: [String], default: [] },
    location: {
      type: PointSchema,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'community_verified', 'high_confidence', 'false_alarm'],
      default: 'pending'
    },
    credibilityScore: { type: Number, default: 0 },
    confirmations: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    isOfflineSynced: { type: Boolean, default: false }
  },
  { timestamps: true }
);

// Enable 2dsphere index for location geoqueries
ReportSchema.index({ location: '2dsphere' });

export default mongoose.model<IReport>('Report', ReportSchema);
