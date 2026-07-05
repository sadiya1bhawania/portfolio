import { log as sampleLog, totalInvoicesByVendor, LogEntry } from "./log";

// Deterministic detection: code decides what gets proposed and at what scope.
// The model (see phraseProposal) only phrases the statement - it never decides.
export const CONFIG = {
  // demo value, not validated - min signals required to surface a proposal
  N: 3,
  // demo value, not validated - threshold for a "fast" turnaround signal
  FAST_MS: 4000,
  // demo value, not validated - consecutive-signal streak length
  STREAK: 2,
};

export type ProposalKind = "categorical" | "numeric";
export type BlastRadius = "low" | "high";

export interface Proposal {
  id: string;
  kind: ProposalKind;
  blastRadius: BlastRadius;
  currentRule: string;
  proposedRule: string;
  evidenceRunIds: string[];
  rate: { n: number; of: number };
  admittedBand?: [number, number];
  admittedDocsLastQuarter?: number;
}

function ruleKey(rule: LogEntry["failedRule"]): string {
  return `${rule.name}:${rule.param}`;
}

function formatUsd(value: number): string {
  return `$${value.toLocaleString("en-US")}`;
}

export function detectProposals(
  entries: LogEntry[],
  denominators: Record<string, number>
): Proposal[] {
  // Step 1: keep only eligible signals. extraction_fix and rejection are logged but inert.
  const eligible = entries.filter(
    (e) => e.correctionType === "waiver" || e.correctionType === "rule_adjustment"
  );

  // Step 2: group by failedRule (name + param).
  const groups = new Map<string, LogEntry[]>();
  for (const entry of eligible) {
    const key = ruleKey(entry.failedRule);
    const bucket = groups.get(key);
    if (bucket) {
      bucket.push(entry);
    } else {
      groups.set(key, [entry]);
    }
  }

  const proposals: Proposal[] = [];

  for (const [key, groupEntries] of groups) {
    const { name, param } = groupEntries[0].failedRule;
    const currentRule = `${name} ≤ ${formatUsd(param)}`;
    const groupTotal = groupEntries.length;

    // Step 3: categorical pass - scope on shared vendor, in first-seen order.
    // (Vendor is the meaningful demo dimension; docType/currency are constant
    // across this sample and would swamp the vendor signal if scanned generically.)
    const remaining = [...groupEntries];
    const vendorOrder: string[] = [];
    const byVendor = new Map<string, LogEntry[]>();
    for (const entry of groupEntries) {
      const vendor = entry.docFeatures.vendor;
      if (!byVendor.has(vendor)) vendorOrder.push(vendor);
      const bucket = byVendor.get(vendor);
      if (bucket) bucket.push(entry);
      else byVendor.set(vendor, [entry]);
    }

    for (const vendor of vendorOrder) {
      const vendorEntries = byVendor.get(vendor)!;
      if (vendorEntries.length >= CONFIG.N) {
        proposals.push({
          id: `categorical-${key}-${vendor}`,
          kind: "categorical",
          blastRadius: "low",
          currentRule,
          proposedRule: `${name} ≤ ${formatUsd(param)} (exempt ${vendor})`,
          evidenceRunIds: vendorEntries.map((e) => e.runId),
          rate: { n: vendorEntries.length, of: denominators[vendor] ?? vendorEntries.length },
        });

        for (const used of vendorEntries) {
          const idx = remaining.indexOf(used);
          if (idx !== -1) remaining.splice(idx, 1);
        }
      }
    }

    // Step 4: numeric fallback - remaining signals share only the rule.
    if (remaining.length >= CONFIG.N) {
      const max = Math.max(...remaining.map((e) => e.extractedValue));
      proposals.push({
        id: `numeric-${key}`,
        kind: "numeric",
        blastRadius: "high",
        currentRule,
        proposedRule: `${name} ≤ ${formatUsd(max)}`,
        evidenceRunIds: remaining.map((e) => e.runId),
        rate: { n: remaining.length, of: groupTotal },
        admittedBand: [param, max],
        // TODO(sadie): derive from real logs, not a hard-coded demo value
        admittedDocsLastQuarter: 4,
      });
    }
    // Step 5 (leftovers < N or share nothing): no proposal is emitted. A future
    // miscalibration hint could surface here; not needed for this sample data,
    // since it never leaves a leftover group.
  }

  return proposals;
}

// Gemini renders the detected pattern into rule language here -
// the model only phrases; it never decides.
export function phraseProposal(proposal: Proposal): string {
  if (proposal.kind === "categorical") {
    const vendor = proposal.evidenceRunIds.length > 0 ? vendorFromProposal(proposal) : "";
    return `Exempt ${vendor} from the ${formatUsdFromRule(proposal.currentRule)} cap`;
  }

  const cap = proposal.admittedBand?.[1] ?? 0;
  return `Raise the ${formatUsdFromRule(proposal.currentRule)} cap to ${formatUsd(cap)}`;
}

function formatUsdFromRule(currentRule: string): string {
  const match = currentRule.match(/\$[\d,]+/);
  return match ? match[0] : currentRule;
}

function vendorFromProposal(proposal: Proposal): string {
  const match = proposal.proposedRule.match(/exempt ([^)]+)\)/i);
  return match ? match[1] : "";
}

// --- Lightweight runtime assertions over the sample log ---
const sampleProposals = detectProposals(sampleLog, totalInvoicesByVendor);

console.assert(
  sampleProposals.length === 3,
  `expected 3 proposals over sample log, got ${sampleProposals.length}`
);

console.assert(
  sampleProposals[0]?.kind === "categorical" &&
  sampleProposals[0]?.proposedRule.includes("Acme"),
  "expected proposal[0] to be the categorical Acme exemption"
);

console.assert(
  sampleProposals[1]?.kind === "categorical" &&
  sampleProposals[1]?.proposedRule.includes("Globex"),
  "expected proposal[1] to be the categorical Globex exemption"
);

console.assert(
  sampleProposals[2]?.kind === "numeric" &&
  sampleProposals[2]?.admittedBand?.[1] === 11500,
  "expected proposal[2] to be the numeric proposal raising the cap to 11500"
);
