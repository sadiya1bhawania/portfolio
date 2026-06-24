export type Stage = "retrieve" | "generate" | "execute" | "summarize" | "done";
export type Status = "active" | "complete" | "error";

export interface PipelineEvent {
  stage: Stage;
  status: Status;
  sql?: string;
  rowCount?: number;
  columns?: string[];
  rows?: Record<string, unknown>[];
  summary?: string;
  error?: string;
}
