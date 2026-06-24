import "server-only";

const SESSION_QUESTION_LIMIT = 5;

const sessionCounts = new Map<string, number>();

export function checkAndIncrementSession(sessionId: string): boolean {
  const count = sessionCounts.get(sessionId) ?? 0;
  if (count >= SESSION_QUESTION_LIMIT) {
    return false;
  }
  sessionCounts.set(sessionId, count + 1);
  return true;
}
