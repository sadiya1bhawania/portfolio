import "server-only";

const HAIKU_INPUT_USD_PER_MTOK = 1.0;
const HAIKU_OUTPUT_USD_PER_MTOK = 5.0;
const DAILY_SPEND_CAP_USD = Number(process.env.DAILY_SPEND_CAP_USD ?? "5");

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

let currentDay = today();
let spentTodayUsd = 0;

function rollDayIfNeeded(): void {
  const day = today();
  if (day !== currentDay) {
    currentDay = day;
    spentTodayUsd = 0;
  }
}

export function recordUsage(usage: { input_tokens: number; output_tokens: number }): void {
  rollDayIfNeeded();
  spentTodayUsd +=
    (usage.input_tokens / 1_000_000) * HAIKU_INPUT_USD_PER_MTOK +
    (usage.output_tokens / 1_000_000) * HAIKU_OUTPUT_USD_PER_MTOK;
}

export function isDailyCapReached(): boolean {
  rollDayIfNeeded();
  return spentTodayUsd >= DAILY_SPEND_CAP_USD;
}
