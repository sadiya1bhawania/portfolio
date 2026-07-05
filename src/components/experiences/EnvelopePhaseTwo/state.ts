import { CONFIG, Proposal, detectProposals } from "./data/detect";
import { log as sampleLog, totalInvoicesByVendor } from "./data/log";

// Pure transition logic for the phase-two demo, kept separate from React so it's testable
// without rendering anything.

export type Status = "pending" | "reviewing" | "approved" | "approved_narrowed" | "ignored";

export interface ProposalState {
  status: Status;
  shownAt: number | null;
  decidedAt: number | null;
  narrowed: boolean;
  sampleReviewed: boolean;
}

export interface DemoState {
  records: ProposalState[];
  activeIndex: number;
  streak: number;
  everGated: boolean;
}

export type Action =
  | { type: "APPROVE" }
  | { type: "NARROW" }
  | { type: "IGNORE" }
  | { type: "REVIEW_SAMPLE" }
  | { type: "RESET" };

function emptyRecord(): ProposalState {
  return { status: "pending", shownAt: null, decidedAt: null, narrowed: false, sampleReviewed: false };
}

export function initState(proposals: Proposal[], now: number): DemoState {
  const records = proposals.map((_, index) =>
    index === 0
      ? { ...emptyRecord(), status: "reviewing" as Status, shownAt: now }
      : emptyRecord()
  );

  return { records, activeIndex: 0, streak: 0, everGated: false };
}

export function isGated(state: DemoState, proposals: Proposal[]): boolean {
  const proposal = proposals[state.activeIndex];
  const record = state.records[state.activeIndex];
  if (!proposal || !record) return false;

  return proposal.blastRadius === "high" && state.streak >= CONFIG.STREAK && !record.sampleReviewed;
}

function advanceToNextPending(records: ProposalState[], activeIndex: number, now: number) {
  const nextIndex = records.findIndex((r) => r.status === "pending");
  if (nextIndex === -1) {
    return { records, activeIndex };
  }

  const advanced = [...records];
  advanced[nextIndex] = { ...advanced[nextIndex], status: "reviewing", shownAt: now };
  return { records: advanced, activeIndex: nextIndex };
}

export function applyAction(
  state: DemoState,
  proposals: Proposal[],
  action: Action,
  now: number
): DemoState {
  // Captured before this action mutates anything, so a gated state is remembered
  // for the session even once the user acts their way past it.
  const everGated = state.everGated || isGated(state, proposals);

  switch (action.type) {
    case "APPROVE": {
      if (isGated(state, proposals)) return { ...state, everGated };

      const idx = state.activeIndex;
      const record = state.records[idx];
      const timeTaken = now - (record.shownAt ?? now);
      const fast = timeTaken < CONFIG.FAST_MS;
      const newStatus: Status = record.narrowed ? "approved_narrowed" : "approved";
      const newStreak = !record.narrowed && fast ? state.streak + 1 : 0;

      const records = [...state.records];
      records[idx] = { ...record, status: newStatus, decidedAt: now };

      const { records: advancedRecords, activeIndex } = advanceToNextPending(records, idx, now);

      return { records: advancedRecords, activeIndex, streak: newStreak, everGated };
    }

    case "NARROW": {
      const idx = state.activeIndex;
      const record = state.records[idx];
      const records = [...state.records];
      records[idx] = { ...record, narrowed: true };
      return { ...state, records, everGated };
    }

    case "IGNORE": {
      const idx = state.activeIndex;
      const record = state.records[idx];
      const records = [...state.records];
      records[idx] = { ...record, status: "ignored", decidedAt: now };

      const { records: advancedRecords, activeIndex } = advanceToNextPending(records, idx, now);

      return { records: advancedRecords, activeIndex, streak: 0, everGated };
    }

    case "REVIEW_SAMPLE": {
      const idx = state.activeIndex;
      const record = state.records[idx];
      const records = [...state.records];
      records[idx] = { ...record, sampleReviewed: true };
      return { records, activeIndex: idx, streak: 0, everGated };
    }

    case "RESET":
      return initState(proposals, now);

    default:
      return state;
  }
}

// --- Lightweight runtime assertions over the sample log ---
const sampleProposals = detectProposals(sampleLog, totalInvoicesByVendor);
const t0 = 1_000_000;

// A (rush): approve #0 fast, approve #1 fast (both un-narrowed) => #2 is gated.
{
  let s = initState(sampleProposals, t0);
  s = applyAction(s, sampleProposals, { type: "APPROVE" }, t0 + 1000);
  s = applyAction(s, sampleProposals, { type: "APPROVE" }, t0 + 2000);

  console.assert(s.activeIndex === 2, "scenario A: expected active index to advance to 2");
  console.assert(s.streak === 2, `scenario A: expected streak 2, got ${s.streak}`);
  console.assert(
    isGated(s, sampleProposals) === true,
    "scenario A: expected #2 to be gated after two fast approvals"
  );

  s = applyAction(s, sampleProposals, { type: "REVIEW_SAMPLE" }, t0 + 2500);
  s = applyAction(s, sampleProposals, { type: "APPROVE" }, t0 + 3000);
  console.assert(
    s.everGated === true,
    "scenario A: expected everGated to be true after the speed bump fired"
  );
}

// B (narrow): approve #0 fast, narrow #1 then approve #1 => #2 not gated, #1 approved_narrowed.
{
  let s = initState(sampleProposals, t0);
  s = applyAction(s, sampleProposals, { type: "APPROVE" }, t0 + 1000);
  s = applyAction(s, sampleProposals, { type: "NARROW" }, t0 + 1500);
  s = applyAction(s, sampleProposals, { type: "APPROVE" }, t0 + 2000);

  console.assert(
    s.records[1].status === "approved_narrowed",
    `scenario B: expected #1 status 'approved_narrowed', got ${s.records[1].status}`
  );
  console.assert(
    isGated(s, sampleProposals) === false,
    "scenario B: expected #2 to NOT be gated after a narrowed approval"
  );

  s = applyAction(s, sampleProposals, { type: "APPROVE" }, t0 + 2500);
  console.assert(
    s.everGated === false,
    "scenario B: expected everGated to stay false when narrowing avoided the speed bump"
  );
}

// C (slow): approve #0 slow (>= FAST_MS), approve #1 fast => streak 1 (< STREAK), #2 not gated.
{
  let s = initState(sampleProposals, t0);
  s = applyAction(s, sampleProposals, { type: "APPROVE" }, t0 + CONFIG.FAST_MS);
  s = applyAction(s, sampleProposals, { type: "APPROVE" }, t0 + CONFIG.FAST_MS + 1000);

  console.assert(s.streak === 1, `scenario C: expected streak 1, got ${s.streak}`);
  console.assert(
    isGated(s, sampleProposals) === false,
    "scenario C: expected #2 to NOT be gated when streak is below threshold"
  );

  s = applyAction(s, sampleProposals, { type: "APPROVE" }, t0 + CONFIG.FAST_MS + 2000);
  console.assert(
    s.everGated === false,
    "scenario C: expected everGated to stay false when the streak never reached threshold"
  );
}
