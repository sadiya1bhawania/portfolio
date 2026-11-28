import type { RuleResultSummary } from "../lib/runPipelineTypes";
import { RULES } from "../lib/policyTypes";
import { formatTimestamp } from "../lib/format";

function ruleLabel(id: RuleResultSummary["rule"]): string {
  return RULES.find((r) => r.id === id)?.label ?? id;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "-";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightBadValues(text: string, badValues: string[]) {
  const unique = [...new Set(badValues.filter(Boolean))];
  if (unique.length === 0) return text;

  const pattern = new RegExp(`(${unique.map(escapeRegExp).join("|")})`, "g");
  const parts = text.split(pattern);

  return parts.map((part, i) =>
    unique.includes(part) ? (
      <span key={i} className="weight-medium" style={{ color: "var(--brick)" }}>
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

interface AuditLineProps {
  verb: "committed" | "escalated";
  actionAt: string;
  policyVersion: number;
  note?: string;
}

function AuditLine({ verb, actionAt, policyVersion, note }: AuditLineProps) {
  return (
    <p className="type-label mt-4" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
      {verb} on behalf of Sadie{note ? `, ${note}` : ""} · {formatTimestamp(actionAt)} · policy v{policyVersion}
    </p>
  );
}

function RuleLine({ result, forceCheck }: { result: RuleResultSummary; forceCheck?: boolean }) {
  const pass = forceCheck ? true : result.pass;
  return (
    <div className="flex items-start gap-2 type-mono" style={{ fontFamily: "var(--font-mono)" }}>
      <span style={{ color: pass ? "var(--copper)" : "var(--brick)" }}>{pass ? "✓" : "✗"}</span>
      <span>
        <span style={{ color: "var(--ink)" }}>{ruleLabel(result.rule)}</span>
        <span style={{ color: "var(--muted)" }}> - {result.detail}</span>
      </span>
    </div>
  );
}

function OutcomeBadge({ label, brick }: { label: string; brick?: boolean }) {
  return (
    <span
      className="type-label uppercase track-fine weight-medium px-2 py-0.5 rounded-full text-[var(--on-accent)]"
      style={{ fontFamily: "var(--font-mono)", background: brick ? "var(--brick)" : "var(--copper)" }}
    >
      {label}
    </span>
  );
}

interface CommitOutcomeCardProps {
  ruleResults: RuleResultSummary[];
  clicks: number;
  actionAt: string;
  policyVersion: number;
}

export function CommitOutcomeCard({ ruleResults, clicks, actionAt, policyVersion }: CommitOutcomeCardProps) {
  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
      <div className="flex items-center gap-3 mb-4">
        <h3 className="type-body weight-medium" style={{ fontFamily: "var(--font-head)" }}>
          Outcome
        </h3>
        <OutcomeBadge label="committed" />
      </div>

      <div className="space-y-1.5 mb-4">
        {ruleResults.map((r, i) => (
          <RuleLine key={`${r.rule}-${i}`} result={r} forceCheck />
        ))}
      </div>

      <div
        className="rounded-lg px-3 py-2 type-mono weight-medium"
        style={{ fontFamily: "var(--font-mono)", background: "var(--copper-light)", color: "var(--copper-dark)" }}
      >
        Saved - {clicks} clicks
      </div>

      <AuditLine verb="committed" actionAt={actionAt} policyVersion={policyVersion} />
    </div>
  );
}

interface ResolvedByAiOutcomeCardProps {
  ruleResults: RuleResultSummary[];
  resolvedFieldChanges: { field: string; before: unknown; after: unknown }[];
  actionAt: string;
  policyVersion: number;
}

// The commit path, but the fields shipped are the ai_review-corrected ones,
// not what extract() first read. decide() still only saw a pass because
// evaluate() re-ran and said so - this card is just being honest about how
// it got there.
export function ResolvedByAiOutcomeCard({
  ruleResults,
  resolvedFieldChanges,
  actionAt,
  policyVersion,
}: ResolvedByAiOutcomeCardProps) {
  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
      <div className="flex items-center gap-3 mb-4">
        <h3 className="type-body weight-medium" style={{ fontFamily: "var(--font-head)" }}>
          Outcome
        </h3>
        <OutcomeBadge label="resolved by AI" />
      </div>

      <div className="space-y-1.5 mb-4">
        {ruleResults.map((r, i) => (
          <RuleLine key={`${r.rule}-${i}`} result={r} forceCheck />
        ))}
      </div>

      {resolvedFieldChanges.length > 0 && (
        <div className="rounded-lg border p-3 mb-4" style={{ borderColor: "var(--border)" }}>
          <p className="type-label uppercase track-fine mb-2" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
            Corrected on review
          </p>
          <div className="space-y-1">
            {resolvedFieldChanges.map((change) => (
              <p key={change.field} className="type-fine" style={{ fontFamily: "var(--font-mono)" }}>
                <span style={{ color: "var(--ink)" }}>{change.field}</span>
                <span style={{ color: "var(--brick)" }}> {formatValue(change.before)}</span>
                <span style={{ color: "var(--muted)" }}> → </span>
                <span className="weight-medium" style={{ color: "var(--copper-dark)" }}>{formatValue(change.after)}</span>
              </p>
            ))}
          </div>
        </div>
      )}

      <div
        className="rounded-lg px-3 py-2 type-mono weight-medium"
        style={{ fontFamily: "var(--font-mono)", background: "var(--copper-light)", color: "var(--copper-dark)" }}
      >
        AI reviewed and corrected - human not needed
      </div>

      <AuditLine verb="committed" note="after AI review" actionAt={actionAt} policyVersion={policyVersion} />
    </div>
  );
}

interface EscalateOutcomeCardProps {
  ruleResults: RuleResultSummary[];
  emailSubject: string;
  emailBody: string;
  escalateTo: string;
  actionAt: string;
  policyVersion: number;
}

export function EscalateOutcomeCard({
  ruleResults,
  emailSubject,
  emailBody,
  escalateTo,
  actionAt,
  policyVersion,
}: EscalateOutcomeCardProps) {
  const failed = ruleResults.filter((r) => !r.pass);
  const badValues = failed.flatMap((r) => r.badValues);

  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
      <div className="flex items-center gap-3 mb-4">
        <h3 className="type-body weight-medium" style={{ fontFamily: "var(--font-head)" }}>
          Outcome
        </h3>
        <OutcomeBadge label="escalated" brick />
      </div>

      <div className="space-y-1.5 mb-4">
        {ruleResults.map((r, i) => (
          <RuleLine key={`${r.rule}-${i}`} result={r} />
        ))}
      </div>

      <div
        className="rounded-lg px-3 py-2 type-mono weight-medium mb-4"
        style={{ fontFamily: "var(--font-mono)", background: "var(--brick-light)", color: "var(--brick-dark)" }}
      >
        Held - needs a human
      </div>

      <div className="rounded-lg border p-3 mb-1" style={{ borderColor: "var(--border)" }}>
        <p className="type-label mb-2" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
          Composed for review - not sent.
        </p>
        <p className="type-fine mb-1" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
          <strong style={{ color: "var(--ink)" }}>To:</strong> {escalateTo}
        </p>
        <p className="type-fine mb-2" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
          <strong style={{ color: "var(--ink)" }}>Re:</strong> {highlightBadValues(emailSubject, badValues)}
        </p>
        <p className="type-mono lead-body whitespace-pre-wrap" style={{ fontFamily: "var(--font-body)" }}>
          {highlightBadValues(emailBody, badValues)}
        </p>
      </div>

      <AuditLine verb="escalated" actionAt={actionAt} policyVersion={policyVersion} />
    </div>
  );
}
