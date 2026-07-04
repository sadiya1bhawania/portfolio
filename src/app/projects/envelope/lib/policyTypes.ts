export type RuleId =
  | "requiredFields"
  | "reconciliation"
  | "valueSanity"
  | "referenceIntegrity"
  | "confidenceFloor";

export interface RuleMeta {
  id: RuleId;
  index: number;
  label: string;
  description: string;
  hasNumericInput: boolean;
}

export const RULES: RuleMeta[] = [
  {
    id: "requiredFields",
    index: 1,
    label: "Required fields present",
    description: "Every field the document needs was found and isn't blank.",
    hasNumericInput: false,
  },
  {
    id: "reconciliation",
    index: 2,
    label: "Reconciliation",
    description:
      "The line items add up to the stated totals (items = subtotal; subtotal + tax = total).",
    hasNumericInput: false,
  },
  {
    id: "valueSanity",
    index: 3,
    label: "Value sanity",
    description: "Amounts fall within an expected range and dates are real and not in the future.",
    hasNumericInput: true,
  },
  {
    id: "referenceIntegrity",
    index: 4,
    label: "Reference integrity",
    description: "The vendor or entity on the document exists in a known list.",
    hasNumericInput: false,
  },
  {
    id: "confidenceFloor",
    index: 5,
    label: "Confidence floor",
    description: "Every extracted field was read with at least the confidence level you set.",
    hasNumericInput: true,
  },
];

export interface ValueSanityParams {
  min: number | null;
  max: number | null;
  asOfDate: string;
}

export interface ConfidenceFloorParams {
  threshold: number;
}

export interface RuleParams {
  valueSanity: ValueSanityParams;
  confidenceFloor: ConfidenceFloorParams;
}

export const DEFAULT_RULE_PARAMS: RuleParams = {
  valueSanity: { min: null, max: null, asOfDate: "" },
  confidenceFloor: { threshold: 0.75 },
};

export interface Policy {
  activeRules: RuleId[];
  ruleParams: RuleParams;
  escalateTo: string;
  activatedAt: string;
}
