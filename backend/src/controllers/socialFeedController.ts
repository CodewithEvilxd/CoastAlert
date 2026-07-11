import { Request, Response } from 'express';
import { getLiveSocialPosts } from '../services/socialFeedService';
import { runNLPAnalysis } from '../services/socialSignalService';

export async function ingestLiveSocialFeed(req: Request, res: Response): Promise<void> {
  try {
    const { region } = req.query;
    const regionName = typeof region === 'string' ? region : undefined;
    const posts = await getLiveSocialPosts(regionName);
    const signals = await runNLPAnalysis(posts);

    res.status(200).json({
      message: 'Live social feed processed successfully.',
      sourceCount: posts.length,
      signalsCount: signals.length,
      signals
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error ingesting live social feed', error: error.message });
  }
}
