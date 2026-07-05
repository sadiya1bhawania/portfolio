import "server-only";
import { getGeminiClient, GEMINI_MODEL } from "../../textToSql/lib/geminiClient";
import type { RuleResult } from "./policyEngine";

function fallbackNote(resolvedFields: string[]): string {
  return `Re-checked ${resolvedFields.join(", ")} with a closer read.`;
}

// The only model call in ai_review, and it's scoped to wording alone: it
// describes what was re-checked. It never decides whether the fix worked -
// evaluate() re-runs afterward and code alone determines that.
export async function composeResolutionNote(failedRules: RuleResult[], resolvedFields: string[]): Promise<string> {
  const failureText = failedRules.map((r) => `- ${r.detail}`).join("\n");

  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: `Failed checks:\n${failureText}\n\nFields re-read: ${resolvedFields.join(", ")}`,
      config: {
        systemInstruction: `You write a single short sentence (under 20 words) describing a closer re-read of a document's fields, given which checks failed. Plain language, no mention of "rules", "policy", or JSON. Output only the sentence, nothing else.`,
        temperature: 0.3,
        maxOutputTokens: 80,
      },
    });
    const text = (response.text ?? "").trim();
    return text || fallbackNote(resolvedFields);
  } catch {
    return fallbackNote(resolvedFields);
  }
}
