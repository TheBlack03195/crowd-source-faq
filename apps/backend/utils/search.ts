export interface RankedResult {
  id: string;
  score: number;
}

export function applySearchThreshold(results: RankedResult[], minScore = 0.1): RankedResult[] {
  return results.filter((r) => r.score >= minScore);
}
