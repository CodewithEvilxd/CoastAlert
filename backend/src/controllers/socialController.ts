import { Request, Response } from 'express';
import SocialSignal from '../models/SocialSignal';
import { runNLPAnalysis } from '../services/socialSignalService';

/**
 * Lists trending social signals with optional regional filtering.
 */
export async function getSocialSignals(req: Request, res: Response): Promise<void> {
  try {
    const { region } = req.query;
    const query: any = {};
    const regionName = typeof region === 'string' ? region.trim() : '';

    if (regionName && regionName.toLowerCase() !== 'india') {
      query.region = { $regex: new RegExp(regionName, 'i') };
    }

    let signals = await SocialSignal.find(query).sort({ postedAt: -1 });
    let usedFallback = false;

    if (regionName && regionName.toLowerCase() !== 'india' && signals.length === 0) {
      // Fallback to global results if no exact regional matches exist.
      signals = await SocialSignal.find().sort({ postedAt: -1 });
      usedFallback = true;
    }

    res.status(200).json({
      signals,
      usedFallback,
      requestedRegion: regionName || 'India'
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error retrieving social signals', error: error.message });
  }
}

/**
 * Triggers the NLP analysis engine manually to process and index live incident reports or posted social items.
 */
export async function analyzeSocialFeed(req: Request, res: Response): Promise<void> {
  try {
    const { posts } = req.body;

    if (posts && !Array.isArray(posts)) {
      res.status(400).json({ message: 'Posts payload must be an array of social posts.' });
      return;
    }

    const parsed = await runNLPAnalysis(posts);
    res.status(200).json({
      message: 'NLP analysis completed successfully. Social signals processed and indexed.',
      count: parsed.length,
      signals: parsed
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error running NLP analysis', error: error.message });
  }
}
