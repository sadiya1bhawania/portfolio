// Deterministic rule engine - no model calls. This is the "code enforces"
// half of the extract/evaluate boundary: AI infers field values, this file
// decides pass/fail against them.
import type { RuleId, RuleParams, ValueSanityParams } from "./policyTypes";
import { EXPECTED_FIELDS, type ExtractedFields } from "./extractionService";

export interface RuleResult {
  rule: RuleId;
  pass: boolean;
  detail: string;
  /** field name(s) this result is about, populated mainly on failure */
  fields: string[];
  /** specific offending value(s), for highlighting in the escalation email */
  badValues: string[];
}

const KNOWN_VENDORS = ["Alderbrook Supply Co.", "Coastline Electrical", "Ferris & Doyle Builders", "Vantage Office Systems"];

function money(n: number): string {
  return Number.isFinite(n) ? `$${n.toFixed(2)}` : "an unreadable amount";
}

function isBlank(value: unknown): boolean {
  return value === null || value === undefined || value === "";
}

function evalRequiredFields(fields: ExtractedFields): RuleResult {
  const missing = EXPECTED_FIELDS.filter((field) => isBlank(fields[field]?.value));
  return {
    rule: "requiredFields",
    pass: missing.length === 0,
    detail:
      missing.length === 0
        ? `All ${EXPECTED_FIELDS.length} required fields are present.`
        : `Missing required field${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}.`,
    fields: missing,
    badValues: [],
  };
}

function evalReconciliation(fields: ExtractedFields): RuleResult {
  const items = (fields.lineItems?.value as Array<{ amount?: unknown }>) ?? [];
  const sum = items.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
  const subtotal = Number(fields.lineItemsTotal?.value);
  const total = Number(fields.total?.value);
  const sumMatchesSubtotal = Math.abs(sum - subtotal) < 0.01;
  const subtotalMatchesTotal = Math.abs(subtotal - total) < 0.01;

  if (sumMatchesSubtotal && subtotalMatchesTotal) {
    return {
      rule: "reconciliation",
      pass: true,
      detail: `Line items sum to ${money(sum)}, matching the subtotal and total of ${money(total)}.`,
      fields: [],
      badValues: [],
    };
  }

  const issues: string[] = [];
  const badFields: string[] = [];
  const badValues: string[] = [];
  if (!sumMatchesSubtotal) {
    issues.push(`line items sum to ${money(sum)} but the stated subtotal is ${money(subtotal)}`);
    badFields.push("lineItems", "lineItemsTotal");
    badValues.push(money(sum), money(subtotal));
  }
  if (!subtotalMatchesTotal) {
    issues.push(`subtotal ${money(subtotal)} does not match the total ${money(total)}`);
    badFields.push("lineItemsTotal", "total");
    badValues.push(money(subtotal), money(total));
  }
  return {
    rule: "reconciliation",
    pass: false,
    detail: `${issues.join("; ")}.`,
    fields: [...new Set(badFields)],
    badValues: [...new Set(badValues)],
  };
}

function evalValueSanity(fields: ExtractedFields, params: ValueSanityParams): RuleResult {
  const amountField = "total";
  const dateField = "invoiceDate";
  const amount = Number(fields[amountField]?.value);
  const dateStr = fields[dateField]?.value as string | null | undefined;
  const issues: string[] = [];
  const badFields: string[] = [];
  const badValues: string[] = [];

  if (Number.isNaN(amount)) {
    issues.push(`${amountField} is not a number`);
    badFields.push(amountField);
  } else {
    if (params.min !== null && amount < params.min) {
      issues.push(`${money(amount)} is below the configured minimum ${money(params.min)}`);
      badFields.push(amountField);
      badValues.push(money(amount));
    }
    if (params.max !== null && amount > params.max) {
      issues.push(`${money(amount)} is above the configured maximum ${money(params.max)}`);
      badFields.push(amountField);
      badValues.push(money(amount));
    }
  }

  const asOf = params.asOfDate ? new Date(params.asOfDate) : new Date();
  const parsedDate = dateStr ? new Date(dateStr) : null;
  if (isBlank(dateStr) || !parsedDate || Number.isNaN(parsedDate.getTime())) {
    issues.push(`${dateField} is missing or not a valid date`);
    badFields.push(dateField);
  } else if (parsedDate.getTime() > asOf.getTime()) {
    issues.push(`${dateField} (${dateStr}) is in the future`);
    badFields.push(dateField);
    badValues.push(String(dateStr));
  }

  return {
    rule: "valueSanity",
    pass: issues.length === 0,
    detail: issues.length === 0 ? `${amountField} and ${dateField} are within range.` : `${issues.join("; ")}.`,
    fields: [...new Set(badFields)],
    badValues: [...new Set(badValues)],
  };
}

function evalReferenceIntegrity(fields: ExtractedFields): RuleResult {
  const field = "vendor";
  const value = fields[field]?.value as string | null | undefined;
  const found = !isBlank(value) && KNOWN_VENDORS.includes(value as string);
  return {
    rule: "referenceIntegrity",
    pass: found,
    detail: found
      ? `"${value}" is a recognized ${field}.`
      : `"${value ?? "(missing)"}" was not found in the trusted ${field} list.`,
    fields: found ? [] : [field],
    badValues: found || isBlank(value) ? [] : [String(value)],
  };
}

function evalConfidenceFloor(fields: ExtractedFields, threshold: number): RuleResult {
  const below = Object.entries(fields)
    .filter(([, f]) => f.confidence < threshold)
    .map(([key]) => key);
  const pct = (threshold * 100).toFixed(0);
  return {
    rule: "confidenceFloor",
    pass: below.length === 0,
    detail: below.length === 0 ? `All fields meet the ${pct}% confidence floor.` : `Below the ${pct}% floor: ${below.join(", ")}.`,
    fields: below,
    badValues: [],
  };
}

export interface DecideResult {
  branch: "commit" | "escalate";
  failedRules: RuleResult[];
}

// decide - pure branch on evaluate's output. Never touches the model: a
// document commits only if every active rule passed, full stop.
export function decide(results: RuleResult[]): DecideResult {
  const failedRules = results.filter((r) => !r.pass);
  return { branch: failedRules.length === 0 ? "commit" : "escalate", failedRules };
}

export function evaluateRule(rule: RuleId, fields: ExtractedFields, ruleParams: RuleParams): RuleResult {
  switch (rule) {
    case "requiredFields":
      return evalRequiredFields(fields);
    case "reconciliation":
      return evalReconciliation(fields);
    case "valueSanity":
      return evalValueSanity(fields, ruleParams.valueSanity);
    case "referenceIntegrity":
      return evalReferenceIntegrity(fields);
    case "confidenceFloor":
      return evalConfidenceFloor(fields, ruleParams.confidenceFloor.threshold);
  }
}
