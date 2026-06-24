import { fewShotExamples } from "./fewShotExamples";

export const SUGGESTED_QUESTIONS = fewShotExamples.map((example) => example.question);

export function isSuggestedQuestion(question: string): boolean {
  const normalized = question.trim().toLowerCase();
  return SUGGESTED_QUESTIONS.some((q) => q.trim().toLowerCase() === normalized);
}
