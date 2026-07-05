export interface RankedResult {
  id: string;
  score: number;
}

export function applySearchThreshold(results: RankedResult[], minScore = 0.1): RankedResult[] {
  return results.filter((r) => r.score >= minScore);
}

export function computeRRF(rankedLists: string[][], k = 60): RankedResult[] {
  const scores = new Map<string, number>();

  for (const list of rankedLists) {
    list.forEach((id, index) => {
      const rank = index + 1;
      const contribution = 1 / (k + rank);
      scores.set(id, (scores.get(id) ?? 0) + contribution);
    });
  }

  return Array.from(scores.entries())
    .map(([id, score]) => ({ id, score }))
    .sort((a, b) => b.score - a.score);
}
