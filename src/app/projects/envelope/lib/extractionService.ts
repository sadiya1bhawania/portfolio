import "server-only";
import { getGeminiClient, GEMINI_MODEL } from "../../textToSql/lib/geminiClient";
import { scanField } from "./streamingJsonFields";

export interface FieldValue {
  value: unknown;
  confidence: number;
}

export type ExtractedFields = Record<string, FieldValue>;

// One generic financial-document schema — every sample (uploaded or fixed)
// is treated as this shape, no per-document-type branching.
export const EXPECTED_FIELDS: string[] = [
  "invoiceNumber",
  "vendor",
  "invoiceDate",
  "dueDate",
  "currency",
  "lineItems",
  "lineItemsTotal",
  "total",
];

export type ExtractionEvent =
  | { type: "field"; field: string; value: unknown; confidence: number }
  | { type: "complete"; fields: ExtractedFields }
  | { type: "parseFailed" };

const SYSTEM_INSTRUCTION = `You extract structured data from a vendor invoice document.

Return ONLY a single JSON object (no markdown fences, no commentary) with exactly these top-level keys: ${EXPECTED_FIELDS.join(", ")}.

Each key must map to an object of the shape {"value": <extracted value or null>, "confidence": <number between 0 and 1>}.
- If a field is not present in the document, set "value" to null and "confidence" to 0.
- "confidence" reflects how certain you are the value was read correctly, not how important the field is.
- For "lineItems", "value" is an array of objects like {"description": "...", "quantity": 1, "unitPrice": 0, "amount": 0}.
- Output strictly valid JSON. Do not wrap it in code fences.`;

export async function* extractFields(documentText: string): AsyncGenerator<ExtractionEvent> {
  const ai = getGeminiClient();
  const resolved = new Set<string>();

  const stream = await ai.models.generateContentStream({
    model: GEMINI_MODEL,
    contents: `Document:\n\n${documentText}`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0,
      maxOutputTokens: 1024,
    },
  });

  let buffer = "";
  for await (const chunk of stream) {
    buffer += chunk.text ?? "";

    for (const field of EXPECTED_FIELDS) {
      if (resolved.has(field)) continue;
      const match = scanField(buffer, field);
      if (!match) continue;

      try {
        const parsed = JSON.parse(match.raw);
        const value = parsed && typeof parsed === "object" && "value" in parsed ? parsed.value : parsed;
        const confidence =
          parsed && typeof parsed === "object" && typeof parsed.confidence === "number" ? parsed.confidence : 0;
        resolved.add(field);
        yield { type: "field", field, value, confidence };
      } catch {
        // Value isn't valid JSON yet (still streaming); try again on the next chunk.
      }
    }
  }

  const fenceStripped = buffer.replace(/```(?:json)?\s*([\s\S]*?)```/i, "$1").trim();
  try {
    const parsed = JSON.parse(fenceStripped) as ExtractedFields;
    yield { type: "complete", fields: parsed };
  } catch {
    yield { type: "parseFailed" };
  }
}
