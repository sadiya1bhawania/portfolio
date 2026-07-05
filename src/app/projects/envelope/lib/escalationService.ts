import "server-only";
import { getGeminiClient, GEMINI_MODEL } from "../../textToSql/lib/geminiClient";
import type { RuleResult } from "./policyEngine";

export interface ComposedEmail {
  subject: string;
  body: string;
}

function fallbackEmail(failedRules: RuleResult[]): ComposedEmail {
  const subject = `Review needed: document failed ${failedRules.length} check${failedRules.length > 1 ? "s" : ""}`;
  const body = `The following checks failed and need a human look:\n\n${failedRules
    .map((r) => `- ${r.detail}`)
    .join("\n")}\n\nPlease review and resolve.`;
  return { subject, body };
}

// act's only model call: turns already-decided failures into a short,
// specific email. It cannot change the commit/escalate branch - that was
// fixed by decide() before this ever runs.
export async function composeEscalationEmail(failedRules: RuleResult[], escalateTo: string): Promise<ComposedEmail> {
  const failureText = failedRules.map((r) => `- ${r.detail}`).join("\n");

  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: `Recipient: ${escalateTo}\n\nFailed checks:\n${failureText}`,
      config: {
        systemInstruction: `You write short internal escalation emails about a document that failed automated validation.
Name the exact failed field(s) and their bad values in plain language (e.g. "line items sum to 980 but the total is 1050").
Keep it to 3-4 sentences, no filler, no mention of "rules" or "policy" or sounding automated.
Output ONLY a JSON object: {"subject": "...", "body": "..."}. No markdown fences, no commentary.`,
        temperature: 0.3,
        maxOutputTokens: 400,
      },
    });

    const text = (response.text ?? "").trim();
    const fenceStripped = text.replace(/```(?:json)?\s*([\s\S]*?)```/i, "$1").trim();
    const parsed = JSON.parse(fenceStripped);
    if (typeof parsed.subject === "string" && typeof parsed.body === "string") {
      return { subject: parsed.subject, body: parsed.body };
    }
    return fallbackEmail(failedRules);
  } catch {
    return fallbackEmail(failedRules);
  }
}
