import Report, { IReport, ReportStatusType } from '../models/Report';

/**
 * Calculates the credibility score of a report and determines its status.
 * Formula:
 * - Base points if there are images (+20)
 * - Community confirmations (+5 points per user)
 * - Geospatial clustering (+30 if another report of the same hazard type exists within 2km and +/- 1 hour)
 */
export async function calculateCredibility(
  reportId: string
): Promise<{ score: number; status: ReportStatusType }> {
  const report = await Report.findById(reportId);
  if (!report) {
    throw new Error('Report not found');
  }

  // If status is manually overridden as false alarm, preserve it
  if (report.status === 'false_alarm') {
    return { score: report.credibilityScore, status: 'false_alarm' };
  }

  let score = 0;

  // 1. Image check
  if (report.images && report.images.length > 0) {
    score += 20;
  }

  // 2. Confirmations count
  if (report.confirmations && report.confirmations.length > 0) {
    score += report.confirmations.length * 5;
  }

  // 3. Spatiotemporal clustering: same hazard type within 2km and 1 hour
  const reportTime = report.createdAt || new Date();
  const timeWindowStart = new Date(reportTime.getTime() - 60 * 60 * 1000);
  const timeWindowEnd = new Date(reportTime.getTime() + 60 * 60 * 1000);

  const nearbyReports = await Report.find({
    _id: { $ne: report._id },
    hazardType: report.hazardType,
    status: { $ne: 'false_alarm' },
    createdAt: { $gte: timeWindowStart, $lte: timeWindowEnd },
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: report.location.coordinates // [lng, lat]
        },
        $maxDistance: 2000 // 2000 meters = 2km
      }
    }
  });

  if (nearbyReports.length > 0) {
    score += 30;
  }

  // Status threshold logic
  let status: ReportStatusType = 'pending';
  if (score >= 80) {
    status = 'high_confidence';
  } else if (score >= 50) {
    status = 'community_verified';
  }

  return { score, status };
}

/**
 * Re-evaluates a report's credibility, updates the database, and returns the updated report.
 */
export async function updateReportCredibility(reportId: string): Promise<IReport | null> {
  const { score, status } = await calculateCredibility(reportId);
  return Report.findByIdAndUpdate(
    reportId,
    { credibilityScore: score, status },
    { new: true }
  );
}
