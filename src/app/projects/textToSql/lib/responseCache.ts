import "server-only";

export interface CachedPipelineResult {
  sql: string;
  rowCount: number;
  columns: string[];
  rows: Record<string, unknown>[];
  summary: string;
}

const cache = new Map<string, CachedPipelineResult>();

function normalize(question: string): string {
  return question.trim().toLowerCase();
}

export function getCachedResult(question: string): CachedPipelineResult | undefined {
  return cache.get(normalize(question));
}

export function setCachedResult(question: string, result: CachedPipelineResult): void {
  cache.set(normalize(question), result);
}
