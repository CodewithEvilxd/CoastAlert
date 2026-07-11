import mongoose, { Schema, Document } from 'mongoose';

export interface ISocialSignal extends Document {
  platform: string;
  postText: string;
  hazardKeywordsMatched: string[];
  sentimentScore: number;
  urgencyScore: number;
  region: string;
  geoTag: {
    lat: number;
    lng: number;
  };
  postedAt: Date;
  ingestedAt: Date;
}

const SocialSignalSchema = new Schema<ISocialSignal>(
  {
    platform: { type: String, required: true },
    postText: { type: String, required: true },
    hazardKeywordsMatched: { type: [String], default: [] },
    sentimentScore: { type: Number, required: true },
    urgencyScore: { type: Number, default: 0 },
    region: { type: String, required: true },
    geoTag: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    },
    postedAt: { type: Date, required: true },
    ingestedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.model<ISocialSignal>('SocialSignal', SocialSignalSchema);
