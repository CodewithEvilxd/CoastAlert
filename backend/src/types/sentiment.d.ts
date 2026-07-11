declare module 'sentiment' {
  export interface SentimentAnalysisResult {
    score: number;
    comparative: number;
    calculation: any[];
    tokens: string[];
    words: string[];
    positive: string[];
    negative: string[];
  }

  export default class Sentiment {
    constructor();
    analyze(
      phrase: string,
      options?: {
        extras?: { [key: string]: number };
        language?: string;
      },
      callback?: (err: Error | null, result: SentimentAnalysisResult) => void
    ): SentimentAnalysisResult;
  }
}
