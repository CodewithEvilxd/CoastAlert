import { Request, Response } from 'express';
import Report from '../models/Report';
import { AuthenticatedRequest } from '../middleware/auth';
import { updateReportCredibility } from '../services/credibilityService';
import mongoose from 'mongoose';

/**
 * Creates a new crowdsourced report.
 */
export async function createReport(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { hazardType, description, severity, latitude, longitude, isOfflineSynced } = req.body;

    if (!hazardType || !description || !severity || !latitude || !longitude) {
      res.status(400).json({ message: 'All report fields (hazardType, description, severity, latitude, longitude) are required' });
      return;
    }

    // Process uploaded images
    const images: string[] = [];
    if (req.files) {
      const files = req.files as Express.Multer.File[];
      files.forEach((file) => {
        // Construct public URL relative to the host
        images.push(`/uploads/${file.filename}`);
      });
    } else if (req.file) {
      images.push(`/uploads/${req.file.filename}`);
    }

    const newReport = new Report({
      reportedBy: req.user ? new mongoose.Types.ObjectId(req.user.id) : undefined,
      hazardType,
      description,
      severity,
      images,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)] // [lng, lat]
      },
      isOfflineSynced: isOfflineSynced === 'true' || isOfflineSynced === true
    });

    await newReport.save();

    // Calculate initial credibility rating
    const updatedReport = await updateReportCredibility(newReport._id.toString());

    res.status(201).json(updatedReport);
  } catch (error: any) {
    res.status(500).json({ message: 'Error submitting report', error: error.message });
  }
}

/**
 * Lists reports based on query filters (timeRange, hazardType, status, and proximity).
 */
export async function getReports(req: Request, res: Response): Promise<void> {
  try {
    const { hazardType, status, timeRange, lat, lng, radius } = req.query;
    const query: any = {};

    if (hazardType) {
      query.hazardType = hazardType;
    }

    if (status) {
      query.status = status;
    } else {
      // Exclude false alarms from default feeds
      query.status = { $ne: 'false_alarm' };
    }

    // Time range filter
    if (timeRange) {
      const now = new Date();
      if (timeRange === '24h') {
        query.createdAt = { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) };
      } else if (timeRange === '7d') {
        query.createdAt = { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
      } else if (timeRange === '30d') {
        query.createdAt = { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
      }
    }

    // Proximity geo query
    if (lat && lng && radius) {
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng as string), parseFloat(lat as string)] // [lng, lat]
          },
          $maxDistance: parseFloat(radius as string) * 1000 // Convert km to meters
        }
      };
    }

    // If proximity query is active, sort by distance is automatic. Else sort by createdAt.
    let reports;
    if (lat && lng && radius) {
      reports = await Report.find(query).populate('reportedBy', 'name role');
    } else {
      reports = await Report.find(query).sort({ createdAt: -1 }).populate('reportedBy', 'name role');
    }

    res.status(200).json(reports);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching reports', error: error.message });
  }
}

/**
 * Gets details of a single report.
 */
export async function getReportById(req: Request, res: Response): Promise<void> {
  try {
    const report = await Report.findById(req.params.id).populate('reportedBy', 'name role');
    if (!report) {
      res.status(404).json({ message: 'Report not found' });
      return;
    }
    res.status(200).json(report);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching report details', error: error.message });
  }
}

/**
 * Adds a community confirmation ("I saw this too").
 */
export async function confirmReport(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      res.status(404).json({ message: 'Report not found' });
      return;
    }

    const userId = new mongoose.Types.ObjectId(req.user.id);

    // Prevent duplicate confirmations from the same user
    if (report.confirmations.includes(userId)) {
      res.status(400).json({ message: 'You have already confirmed this report' });
      return;
    }

    report.confirmations.push(userId);
    await report.save();

    // Recalculate credibility
    const updated = await updateReportCredibility(report._id.toString());
    res.status(200).json(updated);
  } catch (error: any) {
    res.status(500).json({ message: 'Error confirming report', error: error.message });
  }
}

/**
 * Manually updates report status (Analyst only).
 */
export async function updateReportStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { status } = req.body;
    if (!status || !['pending', 'community_verified', 'high_confidence', 'false_alarm'].includes(status)) {
      res.status(400).json({ message: 'Valid status is required' });
      return;
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      res.status(404).json({ message: 'Report not found' });
      return;
    }

    report.status = status;
    if (status === 'false_alarm') {
      report.credibilityScore = 0; // Reset credibility on false alarms
    } else if (status === 'high_confidence') {
      report.credibilityScore = Math.max(report.credibilityScore, 85);
    } else if (status === 'community_verified') {
      report.credibilityScore = Math.max(report.credibilityScore, 55);
    }

    await report.save();
    res.status(200).json(report);
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating report status', error: error.message });
  }
}

/**
 * Returns report coordinates format optimized for react-native-maps heatmap overlay.
 */
export async function getHeatmapData(req: Request, res: Response): Promise<void> {
  try {
    const reports = await Report.find({ status: { $ne: 'false_alarm' } });
    const heatmapPoints = reports.map((rep) => {
      // Map severity to weighting density
      let weight = 1;
      if (rep.severity === 'medium') weight = 2;
      if (rep.severity === 'high') weight = 3;
      if (rep.severity === 'critical') weight = 4;

      return {
        latitude: rep.location.coordinates[1],
        longitude: rep.location.coordinates[0],
        weight
      };
    });

    res.status(200).json(heatmapPoints);
  } catch (error: any) {
    res.status(500).json({ message: 'Error generating heatmap data', error: error.message });
  }
}
