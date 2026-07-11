import Sentiment from 'sentiment';
import SocialSignal from '../models/SocialSignal';
import Report from '../models/Report';
import { INDIA_CITY_MAP, haversineKm } from '../utils/indiaRegions';

const HAZARD_KEYWORDS = [
  'tsunami',
  'wave',
  'flood',
  'oil spill',
  'swell',
  'tide',
  'recede',
  'drown',
  'rip current',
  'surge',
  'storm',
  'debris',
  'sea behavior',
  'water level'
];

interface RawPost {
  platform: string;
  postText: string;
  region?: string;
  geoTag: { lat: number; lng: number };
  postedAt: string;
  severity?: string;
  confirmations?: number;
  hazardType?: string;
}

function resolveRegionFromCoords(lat: number, lng: number): string {
  let closestRegion: string | null = null;
  let closestDistance = Infinity;

  for (const [regionName, regionInfo] of Object.entries(INDIA_CITY_MAP)) {
    const distance = haversineKm(lat, lng, regionInfo.lat, regionInfo.lng);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestRegion = regionName;
    }
  }

  return closestRegion || 'India';
}

function buildUrgencyScore(post: RawPost, sentimentScore: number): number {
  const severityWeight: Record<string, number> = {
    low: 20,
    medium: 40,
    high: 70,
    critical: 90
  };

  let urgencyScore = severityWeight[post.severity || 'medium'] || 40;
  urgencyScore += Math.max(0, -sentimentScore) * 5;
  urgencyScore += Math.min(post.confirmations ?? 0, 5) * 5;

  if (post.hazardType && HAZARD_KEYWORDS.some((kw) => post.hazardType?.toLowerCase().includes(kw))) {
    urgencyScore += 10;
  }

  urgencyScore = Math.min(100, Math.max(0, Math.round(urgencyScore)));
  return urgencyScore;
}

function extractHazardKeywords(text: string): string[] {
  const lowerText = text.toLowerCase();
  return HAZARD_KEYWORDS.filter((keyword) => lowerText.includes(keyword));
}

/**
 * Runs the NLP pipeline on actual incident reports or an explicit post list, calculates sentiment/urgency, and saves to DB.
 */
export async function runNLPAnalysis(rawPosts?: RawPost[]): Promise<any[]> {
  const sentimentAnalyzer = new Sentiment();
  const parsedSignals: any[] = [];

  let postsToAnalyze: RawPost[] = [];
  if (Array.isArray(rawPosts) && rawPosts.length > 0) {
    postsToAnalyze = rawPosts;
  } else {
    const reports = await Report.find({ status: { $ne: 'false_alarm' } });
    postsToAnalyze = reports.map((report) => ({
      platform: 'citizen_report',
      postText: report.description,
      region: resolveRegionFromCoords(report.location.coordinates[1], report.location.coordinates[0]),
      geoTag: {
        lat: report.location.coordinates[1],
        lng: report.location.coordinates[0]
      },
      postedAt: report.createdAt?.toISOString() ?? new Date().toISOString(),
      severity: report.severity,
      confirmations: report.confirmations?.length ?? 0,
      hazardType: report.hazardType
    }));
  }

  for (const post of postsToAnalyze) {
    const matchedKeywords = extractHazardKeywords(post.postText);
    const sentimentResult = sentimentAnalyzer.analyze(post.postText);
    const sentimentScore = sentimentResult.score;
    const urgencyScore = buildUrgencyScore(post, sentimentScore);
    const region = post.region?.trim() || resolveRegionFromCoords(post.geoTag.lat, post.geoTag.lng);

    const signalData = {
      platform: post.platform,
      postText: post.postText,
      hazardKeywordsMatched: matchedKeywords,
      sentimentScore,
      urgencyScore,
      region,
      geoTag: post.geoTag,
      postedAt: new Date(post.postedAt)
    };

    await SocialSignal.findOneAndUpdate(
      {
        platform: post.platform,
        postText: post.postText,
        'geoTag.lat': post.geoTag.lat,
        'geoTag.lng': post.geoTag.lng,
        postedAt: new Date(post.postedAt)
      },
      signalData,
      { upsert: true, new: true }
    );

    parsedSignals.push(signalData);
  }

  return parsedSignals;
}
