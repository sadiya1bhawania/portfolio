import type { Policy } from "./policyTypes";

const STORAGE_KEY = "envelope.activePolicy";

export function saveActivePolicy(policy: Policy): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(policy));
}

export function loadActivePolicy(): Policy | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Policy;
  } catch {
    return null;
  }
}
