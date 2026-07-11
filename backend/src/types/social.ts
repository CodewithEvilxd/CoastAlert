export interface RawPost {
  platform: string;
  postText: string;
  region?: string;
  geoTag: { lat: number; lng: number };
  postedAt: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  confirmations?: number;
  hazardType?: string;
}
