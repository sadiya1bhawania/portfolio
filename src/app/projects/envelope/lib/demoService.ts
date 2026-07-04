import demoSamplesData from "../data/demo-samples.json";
import type { ExtractedFields } from "./extractionService";

export type DemoSampleId = "clean" | "recoverable" | "blocked";

interface DemoFieldSpec {
  firstRead: unknown;
  carefulRead: unknown;
  confidence: number;
}

interface DemoSample {
  id: DemoSampleId;
  label: string;
  fields: Record<string, DemoFieldSpec>;
}

const DEMO_SAMPLES = demoSamplesData.samples as unknown as DemoSample[];

export function getDemoSample(id: DemoSampleId): DemoSample {
  const sample = DEMO_SAMPLES.find((s) => s.id === id);
  if (!sample) throw new Error(`Unknown demo sample: ${id}`);
  return sample;
}

export function listDemoSamples(): { id: DemoSampleId; label: string }[] {
  return DEMO_SAMPLES.map((s) => ({ id: s.id, label: s.label }));
}

function renderLineItems(items: unknown): string {
  const list = (items as Array<Record<string, unknown>>) ?? [];
  return list
    .map((item) => `- ${item.description} | qty ${item.quantity} | unit $${item.unitPrice} | amount $${item.amount}`)
    .join("\n");
}

// extract only ever sees the firstRead layer — carefulRead is what ai_review
// draws on later, never what the initial Gemini pass reads.
export function renderDemoDocumentText(sample: DemoSample): string {
  const f = sample.fields;
  const line = (label: string, key: string) => {
    const v = f[key]?.firstRead;
    if (v === null || v === undefined) return null;
    return `${label}: ${typeof v === "object" ? JSON.stringify(v) : v}`;
  };

  return [
    "INVOICE",
    line("Invoice #", "invoiceNumber"),
    line("Vendor", "vendor"),
    line("Date", "invoiceDate"),
    line("Due", "dueDate"),
    line("Currency", "currency"),
    "",
    "Line items:",
    renderLineItems(f.lineItems?.firstRead),
    "",
    line("Total", "total"),
  ]
    .filter((l) => l !== null)
    .join("\n");
}

// If Gemini's extraction can't be parsed, fall back to the sample's own
// firstRead values — same layer extract() would otherwise have produced.
export function getDemoFallbackFields(sample: DemoSample): ExtractedFields {
  const fields: ExtractedFields = {};
  for (const [key, spec] of Object.entries(sample.fields)) {
    fields[key] = { value: spec.firstRead, confidence: spec.confidence };
  }
  return fields;
}

const CAREFUL_READ_CONFIDENCE = 0.95;

// ai_review's only real effect: swap the specific fields implicated by the
// failed rules over to the sample's carefulRead layer, with a bumped
// confidence reflecting the closer look. Purely deterministic — no model
// call decides this, and it never touches fields that didn't fail.
export function applyCarefulRead(sample: DemoSample, fields: ExtractedFields, fieldNames: string[]): ExtractedFields {
  const next: ExtractedFields = { ...fields };
  for (const name of fieldNames) {
    const spec = sample.fields[name];
    if (!spec) continue;
    next[name] = { value: spec.carefulRead, confidence: CAREFUL_READ_CONFIDENCE };
  }
  return next;
}
