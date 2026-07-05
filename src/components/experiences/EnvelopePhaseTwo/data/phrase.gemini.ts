import "server-only";
import { getGeminiClient, GEMINI_MODEL } from "../../../../app/projects/textToSql/lib/geminiClient";
import { Proposal, phraseProposal } from "./detect";

// Contract: this function only phrases a pattern that detectProposals() in detect.ts
// has already found. It never decides kind, scope, value, or admittedBand - those
// come from the Proposal object exactly as detected. The model is asked to restate
// the given fields in plain language, not to reason about whether the rule is good.
function buildPrompt(proposal: Proposal): string {
  if (proposal.kind === "categorical") {
    const vendorMatch = proposal.proposedRule.match(/exempt (.+)\)/i);
    const vendor = vendorMatch ? vendorMatch[1] : "the vendor";
    return [
      "Detected pattern: categorical exemption.",
      `Current rule: ${proposal.currentRule}`,
      `Scope: vendor = ${vendor}`,
      `Phrase this as one sentence: exempt ${vendor} from the current cap.`,
    ].join("\n");
  }

  const cap = proposal.admittedBand?.[1] ?? 0;
  return [
    "Detected pattern: numeric threshold adjustment.",
    `Current rule: ${proposal.currentRule}`,
    `New value: $${cap.toLocaleString("en-US")}`,
    "Phrase this as one sentence: raise the current cap to the new value.",
  ].join("\n");
}

const SYSTEM_INSTRUCTION = `You phrase an already-decided rule change as a single short sentence (under 16 words).
You are given the exact rule, its scope, and the exact new value - restate them in plain language.
Do not add caveats, do not question whether the change is wise, do not invent numbers or vendors not given to you.
Output only the sentence, nothing else.`;

// TODO(sadie): swap live phrasing to Gemini once keyed - the running demo still
// calls the deterministic phraseProposal() from detect.ts by default; this
// function exists so the seam is real, but it is not wired into the UI yet.
export async function phraseProposalWithGemini(proposal: Proposal): Promise<string> {
  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: buildPrompt(proposal),
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.2,
        maxOutputTokens: 60,
      },
    });

    const text = (response.text ?? "").trim();
    return text || phraseProposal(proposal);
  } catch {
    return phraseProposal(proposal);
  }
}
