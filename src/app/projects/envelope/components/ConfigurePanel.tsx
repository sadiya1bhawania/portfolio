"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { RULES, DEFAULT_RULE_PARAMS, type RuleId, type RuleParams, type Policy } from "../lib/policyTypes";
import { saveActivePolicy } from "../lib/policyStore";

const MAX_ACTIVE_RULES = 2;

function RuleToggle({
  index,
  label,
  description,
  active,
  onToggle,
}: {
  index: number;
  label: string;
  description: string;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="relative w-full z-0 hover:z-20 focus-within:z-20">
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={active}
        className="w-full flex items-center gap-3 rounded-lg border px-4 py-3 pr-10 text-left transition-colors"
        style={{
          borderColor: active ? "var(--copper)" : "var(--border)",
          background: active ? "var(--copper-light)" : "#fff",
        }}
      >
        <span
          className="flex items-center justify-center w-6 h-6 rounded-full text-[11px] shrink-0"
          style={{
            fontFamily: "var(--font-mono)",
            background: active ? "var(--copper)" : "var(--border)",
            color: active ? "#fff" : "var(--muted)",
          }}
        >
          {index}
        </span>
        <span
          className="text-[13px] flex-1"
          style={{ fontFamily: "var(--font-mono)", color: active ? "var(--copper-dark)" : "var(--muted)" }}
        >
          {label}
        </span>
        <span
          className="text-[11px] uppercase tracking-wide"
          style={{ fontFamily: "var(--font-mono)", color: active ? "var(--copper-dark)" : "var(--muted)" }}
        >
          {active ? "On" : "Off"}
        </span>
      </button>

      <span className="group absolute top-1/2 right-3 -translate-y-1/2">
        <button
          type="button"
          aria-label={`What does "${label}" check?`}
          aria-describedby={`rule-tooltip-${index}`}
          className="flex items-center justify-center w-5 h-5 rounded-full text-[10px] focus:outline-none focus-visible:ring-2"
          style={{
            fontFamily: "var(--font-mono)",
            color: "var(--muted)",
            border: "1px solid var(--border)",
            background: "#fff",
          }}
        >
          i
        </button>
        <span
          id={`rule-tooltip-${index}`}
          role="tooltip"
          className="pointer-events-none absolute right-0 top-full z-10 mt-2 w-64 rounded-md border px-3 py-2 text-[12px] leading-relaxed opacity-0 invisible transition-opacity group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible"
          style={{
            fontFamily: "var(--font-body)",
            background: "#fff",
            borderColor: "var(--border)",
            color: "var(--ink)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          }}
        >
          {description}
        </span>
      </span>
    </div>
  );
}

interface ConfigurePanelProps {
  /** When provided, the panel is embedded (e.g. in the immersive demo) and
   * hands control back to the host instead of linking to /run itself. */
  onActivated?: (policy: Policy) => void;
}

export default function ConfigurePanel({ onActivated }: ConfigurePanelProps) {
  const [activeRules, setActiveRules] = useState<RuleId[]>([]);
  const [ruleParams, setRuleParams] = useState<RuleParams>(DEFAULT_RULE_PARAMS);
  const [escalateTo, setEscalateTo] = useState("reviewer@example.com");
  const [evictionNote, setEvictionNote] = useState<string | null>(null);
  const [activatedPolicy, setActivatedPolicy] = useState<Policy | null>(null);

  const ruleLabel = useMemo(() => {
    const map = new Map(RULES.map((r) => [r.id, r.label]));
    return (id: RuleId) => map.get(id) ?? id;
  }, []);

  function toggleRule(id: RuleId) {
    setActivatedPolicy(null);
    setActiveRules((prev) => {
      if (prev.includes(id)) {
        setEvictionNote(null);
        return prev.filter((r) => r !== id);
      }
      if (prev.length < MAX_ACTIVE_RULES) {
        setEvictionNote(null);
        return [...prev, id];
      }
      const [leastRecent, ...rest] = prev;
      setEvictionNote(
        `"${ruleLabel(leastRecent)}" was deactivated to make room for "${ruleLabel(id)}" — only two rules may run at once.`
      );
      return [...rest, id];
    });
  }

  const canActivate = activeRules.length === MAX_ACTIVE_RULES;

  async function handleActivate() {
    if (activeRules.length !== MAX_ACTIVE_RULES) return;
    const policy: Policy = {
      activeRules,
      ruleParams,
      escalateTo: escalateTo.trim() || "reviewer@example.com",
      activatedAt: new Date().toISOString(),
    };
    saveActivePolicy(policy);
    await fetch("/projects/envelope/api/policy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(policy),
    });
    setActivatedPolicy(policy);
    onActivated?.(policy);
  }

  return (
    <div>
      {/* Rule palette */}
      <section className="mb-10">
        <div className="flex items-baseline justify-between mb-3">
          <h2
            className="text-[13px] uppercase tracking-wide"
            style={{ fontFamily: "var(--font-mono)", color: "var(--copper-dark)" }}
          >
            Rules ({activeRules.length}/{MAX_ACTIVE_RULES} active)
          </h2>
        </div>

        {evictionNote && (
          <p
            className="text-[12px] mb-3 rounded-md px-3 py-2"
            style={{ fontFamily: "var(--font-mono)", color: "var(--copper-dark)", background: "var(--copper-light)" }}
          >
            {evictionNote}
          </p>
        )}

        <div className="space-y-2">
          {RULES.map((rule) => {
            const active = activeRules.includes(rule.id);
            return (
              <div key={rule.id}>
                <RuleToggle
                  index={rule.index}
                  label={rule.label}
                  description={rule.description}
                  active={active}
                  onToggle={() => toggleRule(rule.id)}
                />

                {active && rule.id === "valueSanity" && (
                  <div
                    className="mt-2 ml-9 flex flex-wrap gap-3 rounded-lg border p-3"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <label className="flex flex-col gap-1 text-[11px]" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
                      Min
                      <input
                        type="number"
                        value={ruleParams.valueSanity.min ?? ""}
                        onChange={(e) =>
                          setRuleParams((p) => ({
                            ...p,
                            valueSanity: { ...p.valueSanity, min: e.target.value === "" ? null : Number(e.target.value) },
                          }))
                        }
                        className="rounded-md border px-2 py-1 text-sm"
                        style={{ borderColor: "var(--border)", fontFamily: "var(--font-body)" }}
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-[11px]" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
                      Max
                      <input
                        type="number"
                        value={ruleParams.valueSanity.max ?? ""}
                        onChange={(e) =>
                          setRuleParams((p) => ({
                            ...p,
                            valueSanity: { ...p.valueSanity, max: e.target.value === "" ? null : Number(e.target.value) },
                          }))
                        }
                        className="rounded-md border px-2 py-1 text-sm"
                        style={{ borderColor: "var(--border)", fontFamily: "var(--font-body)" }}
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-[11px]" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
                      As of date
                      <input
                        type="date"
                        value={ruleParams.valueSanity.asOfDate}
                        onChange={(e) =>
                          setRuleParams((p) => ({
                            ...p,
                            valueSanity: { ...p.valueSanity, asOfDate: e.target.value },
                          }))
                        }
                        className="rounded-md border px-2 py-1 text-sm"
                        style={{ borderColor: "var(--border)", fontFamily: "var(--font-body)" }}
                      />
                    </label>
                  </div>
                )}

                {active && rule.id === "confidenceFloor" && (
                  <div
                    className="mt-2 ml-9 flex items-center gap-3 rounded-lg border p-3"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <label className="flex flex-col gap-1 text-[11px]" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
                      Confidence threshold (0–1)
                      <input
                        type="number"
                        min={0}
                        max={1}
                        step={0.01}
                        value={ruleParams.confidenceFloor.threshold}
                        onChange={(e) =>
                          setRuleParams((p) => ({
                            ...p,
                            confidenceFloor: { threshold: Number(e.target.value) },
                          }))
                        }
                        className="w-28 rounded-md border px-2 py-1 text-sm"
                        style={{ borderColor: "var(--border)", fontFamily: "var(--font-body)" }}
                      />
                    </label>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Escalation */}
      <section className="mb-10">
        <h2
          className="text-[13px] uppercase tracking-wide mb-3"
          style={{ fontFamily: "var(--font-mono)", color: "var(--copper-dark)" }}
        >
          Escalate to
        </h2>
        <input
          type="email"
          value={escalateTo}
          onChange={(e) => setEscalateTo(e.target.value)}
          placeholder="reviewer@example.com"
          className="w-full max-w-sm rounded-md border px-3 py-2 text-sm"
          style={{ borderColor: "var(--border)", fontFamily: "var(--font-body)" }}
        />
        <p className="text-[11px] mt-2" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
          Simulated only — no email is actually sent.
        </p>
      </section>

      <button
        type="button"
        disabled={!canActivate}
        onClick={handleActivate}
        className="inline-flex items-center px-5 py-2.5 rounded-md text-sm font-medium text-white disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ background: "var(--copper)", fontFamily: "var(--font-body)" }}
      >
        Activate policy
      </button>

      {activatedPolicy && (
        <div
          className="mt-6 rounded-lg border p-4 text-[13px]"
          style={{ borderColor: "var(--border)", background: "var(--copper-light)", fontFamily: "var(--font-mono)" }}
        >
          Policy activated with rules {activatedPolicy.activeRules.map(ruleLabel).join(" + ")}. Escalations go to{" "}
          {activatedPolicy.escalateTo}.
          {!onActivated && (
            <>
              <br />
              <Link href="/projects/envelope/run" className="underline" style={{ color: "var(--copper-dark)" }}>
                Run a document against it →
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
