export type CorrectionType = "waiver" | "rule_adjustment" | "extraction_fix" | "rejection";

export interface LogEntry {
  runId: string;
  timestamp: string;
  actor: string;
  failedRule: { name: string; param: number };
  extractedValue: number;
  correctionType: CorrectionType;
  humanOutcome: string;
  docFeatures: {
    vendor: string;
    docType: string;
    currency: string;
    date: string;
  };
}

const amountCap = { name: "amount_cap", param: 10000 };

export const log: LogEntry[] = [
  {
    runId: "7f2",
    timestamp: "2025-01-14T09:12:00Z",
    actor: "Sadie",
    failedRule: amountCap,
    extractedValue: 11200,
    correctionType: "waiver",
    humanOutcome: "committed",
    docFeatures: { vendor: "Acme", docType: "invoice", currency: "USD", date: "2025-01-12" },
  },
  {
    runId: "7f9",
    timestamp: "2025-02-03T14:40:00Z",
    actor: "Sadie",
    failedRule: amountCap,
    extractedValue: 10800,
    correctionType: "waiver",
    humanOutcome: "committed",
    docFeatures: { vendor: "Acme", docType: "invoice", currency: "USD", date: "2025-02-01" },
  },
  {
    runId: "803",
    timestamp: "2025-02-21T11:05:00Z",
    actor: "Sadie",
    failedRule: amountCap,
    extractedValue: 12000,
    correctionType: "waiver",
    humanOutcome: "committed",
    docFeatures: { vendor: "Acme", docType: "invoice", currency: "USD", date: "2025-02-19" },
  },
  {
    runId: "811",
    timestamp: "2025-03-05T08:52:00Z",
    actor: "Sadie",
    failedRule: amountCap,
    extractedValue: 10500,
    correctionType: "waiver",
    humanOutcome: "committed",
    docFeatures: { vendor: "Globex", docType: "invoice", currency: "USD", date: "2025-03-03" },
  },
  {
    runId: "818",
    timestamp: "2025-03-22T16:18:00Z",
    actor: "Sadie",
    failedRule: amountCap,
    extractedValue: 13000,
    correctionType: "waiver",
    humanOutcome: "committed",
    docFeatures: { vendor: "Globex", docType: "invoice", currency: "USD", date: "2025-03-20" },
  },
  {
    runId: "82c",
    timestamp: "2025-04-09T10:30:00Z",
    actor: "Sadie",
    failedRule: amountCap,
    extractedValue: 10200,
    correctionType: "waiver",
    humanOutcome: "committed",
    docFeatures: { vendor: "Globex", docType: "invoice", currency: "USD", date: "2025-04-07" },
  },
  {
    runId: "c14",
    timestamp: "2025-05-01T13:47:00Z",
    actor: "Sadie",
    failedRule: amountCap,
    extractedValue: 11000,
    correctionType: "waiver",
    humanOutcome: "committed",
    docFeatures: { vendor: "Initech", docType: "invoice", currency: "USD", date: "2025-04-29" },
  },
  {
    runId: "c1d",
    timestamp: "2025-05-16T09:24:00Z",
    actor: "Sadie",
    failedRule: amountCap,
    extractedValue: 11500,
    correctionType: "waiver",
    humanOutcome: "committed",
    docFeatures: { vendor: "Umbrella", docType: "invoice", currency: "USD", date: "2025-05-14" },
  },
  {
    runId: "c22",
    timestamp: "2025-06-02T15:03:00Z",
    actor: "Sadie",
    failedRule: amountCap,
    extractedValue: 10900,
    correctionType: "waiver",
    humanOutcome: "committed",
    docFeatures: { vendor: "Stark", docType: "invoice", currency: "USD", date: "2025-05-31" },
  },
  {
    runId: "b90",
    timestamp: "2025-06-20T12:11:00Z",
    actor: "Sadie",
    failedRule: amountCap,
    extractedValue: 15000,
    correctionType: "extraction_fix",
    humanOutcome: "corrected",
    docFeatures: { vendor: "Meridian", docType: "invoice", currency: "USD", date: "2025-06-18" },
  },
];

// TODO(sadie): derive from real logs
export const totalInvoicesByVendor: Record<string, number> = {
  Acme: 4,
  Globex: 3,
  Initech: 5,
  Umbrella: 4,
  Stark: 6,
  Meridian: 2,
};
