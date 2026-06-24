import "server-only";
import { getGeminiClient, GEMINI_MODEL } from "./geminiClient";
import { runQuery, type QueryResult, UnsafeSqlError, QueryTimeoutError } from "./dbService";
import { schemaDDL, fewShotExamples } from "./schema";
import { getCachedResult, setCachedResult } from "./responseCache";
import { isSuggestedQuestion } from "./suggestedQuestions";
import { recordUsage, isDailyCapReached } from "./usageTracker";

export type PipelineStage = "retrieve" | "generate" | "execute" | "summarize" | "done";
export type PipelineStatus = "active" | "complete" | "error";

export interface PipelineEvent {
  stage: PipelineStage;
  status: PipelineStatus;
  sql?: string;
  rowCount?: number;
  columns?: string[];
  rows?: Record<string, unknown>[];
  summary?: string;
  error?: string;
}

const MAX_ROWS_TO_CLIENT = 50;

const MAX_RETRIES = 2;

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function buildContext(): string {
  const examples = fewShotExamples
    .map((ex) => `Question: ${ex.question}\nSQL: ${ex.sql}`)
    .join("\n\n");

  return `Database schema (SQLite):\n${schemaDDL}\n\nExample question/SQL pairs:\n${examples}`;
}

function stripCodeFence(text: string): string {
  const fenced = text.match(/```(?:sql)?\s*([\s\S]*?)```/i);
  return (fenced ? fenced[1] : text).trim();
}

interface LlmTextResult {
  text: string;
  usage: { input_tokens: number; output_tokens: number };
}

const SQL_SYSTEM_INSTRUCTION = (context: string) =>
  `You are a SQLite expert. Given a database schema and a question, write a single read-only SQL SELECT statement that answers it.

${context}

Rules:
- Output ONLY the SQL statement, nothing else.
- No markdown code fences, no commentary, no trailing semicolon required.
- Only ever produce a single SELECT statement. Never modify data.`;

async function generateSql(question: string, context: string): Promise<LlmTextResult> {
  const ai = getGeminiClient();

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: question,
    config: {
      systemInstruction: SQL_SYSTEM_INSTRUCTION(context),
      temperature: 0,
      maxOutputTokens: 512,
    },
  });

  return {
    text: stripCodeFence(response.text ?? ""),
    usage: {
      input_tokens: response.usageMetadata?.promptTokenCount ?? 0,
      output_tokens: response.usageMetadata?.candidatesTokenCount ?? 0,
    },
  };
}

async function regenerateSql(
  question: string,
  context: string,
  previousSql: string,
  errorText: string
): Promise<LlmTextResult> {
  const ai = getGeminiClient();

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: [
      { role: "user", parts: [{ text: question }] },
      { role: "model", parts: [{ text: previousSql }] },
      {
        role: "user",
        parts: [
          {
            text: `That query failed with this error:\n${errorText}\n\nFix the query and output only the corrected SQL statement.`,
          },
        ],
      },
    ],
    config: {
      systemInstruction: SQL_SYSTEM_INSTRUCTION(context),
      temperature: 0,
      maxOutputTokens: 512,
    },
  });

  return {
    text: stripCodeFence(response.text ?? ""),
    usage: {
      input_tokens: response.usageMetadata?.promptTokenCount ?? 0,
      output_tokens: response.usageMetadata?.candidatesTokenCount ?? 0,
    },
  };
}

async function summarizeResults(question: string, result: QueryResult): Promise<LlmTextResult> {
  const ai = getGeminiClient();

  const preview = result.rows.slice(0, 50);

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: `Original question: ${question}\n\nColumns: ${result.columns.join(", ")}\nRow count: ${result.rows.length}\nRows (JSON, possibly truncated): ${JSON.stringify(preview)}\n\nAnswer the original question using this data.`,
    config: {
      systemInstruction: `You answer questions about query results in clear, natural language. Be concise and specific, citing concrete numbers from the data when relevant. Do not mention SQL or databases in your answer.`,
      temperature: 0,
      maxOutputTokens: 400,
    },
  });

  return {
    text: (response.text ?? "").trim(),
    usage: {
      input_tokens: response.usageMetadata?.promptTokenCount ?? 0,
      output_tokens: response.usageMetadata?.candidatesTokenCount ?? 0,
    },
  };
}

export async function* runPipeline(question: string): AsyncGenerator<PipelineEvent> {
  const cached = getCachedResult(question);
  if (cached) {
    yield { stage: "retrieve", status: "active" };
    yield { stage: "retrieve", status: "complete" };
    yield { stage: "generate", status: "active" };
    yield { stage: "generate", status: "complete", sql: cached.sql };
    yield { stage: "execute", status: "active" };
    yield {
      stage: "execute",
      status: "complete",
      rowCount: cached.rowCount,
      columns: cached.columns,
      rows: cached.rows,
    };
    yield { stage: "summarize", status: "active" };
    yield { stage: "summarize", status: "complete", summary: cached.summary };
    yield { stage: "done", status: "complete" };
    return;
  }

  yield { stage: "retrieve", status: "active" };
  let context: string;
  try {
    context = buildContext();
  } catch (err) {
    yield { stage: "retrieve", status: "error", error: errorMessage(err) };
    return;
  }
  yield { stage: "retrieve", status: "complete" };

  yield { stage: "generate", status: "active" };
  let sql: string;
  try {
    const generated = await generateSql(question, context);
    recordUsage(generated.usage);
    sql = generated.text;
  } catch (err) {
    yield { stage: "generate", status: "error", error: errorMessage(err) };
    return;
  }
  yield { stage: "generate", status: "complete", sql };

  if (isDailyCapReached()) {
    yield {
      stage: "done",
      status: "error",
      error: "Daily usage limit reached, see the generated SQL above. Please try again tomorrow.",
    };
    return;
  }

  let result: QueryResult | undefined;
  let lastError: string | undefined;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    yield { stage: "execute", status: "active" };
    try {
      result = runQuery(sql);
      yield {
        stage: "execute",
        status: "complete",
        rowCount: result.rows.length,
        columns: result.columns,
        rows: result.rows.slice(0, MAX_ROWS_TO_CLIENT),
      };
      lastError = undefined;
      break;
    } catch (err) {
      lastError =
        err instanceof UnsafeSqlError
          ? `Generated SQL was rejected: ${err.message}`
          : err instanceof QueryTimeoutError
            ? `Query timed out: ${err.message}`
            : errorMessage(err);
      yield { stage: "execute", status: "error", error: lastError };

      if (attempt === MAX_RETRIES) {
        break;
      }

      yield { stage: "generate", status: "active" };
      try {
        const regenerated = await regenerateSql(question, context, sql, lastError);
        recordUsage(regenerated.usage);
        sql = regenerated.text;
      } catch (genErr) {
        yield { stage: "generate", status: "error", error: errorMessage(genErr) };
        return;
      }
      yield { stage: "generate", status: "complete", sql };

      if (isDailyCapReached()) {
        yield {
          stage: "done",
          status: "error",
          error: "Daily usage limit reached, see the generated SQL above. Please try again tomorrow.",
        };
        return;
      }
    }
  }

  if (lastError || !result) {
    return;
  }

  yield { stage: "summarize", status: "active" };
  let summary: string;
  try {
    const summarized = await summarizeResults(question, result);
    recordUsage(summarized.usage);
    summary = summarized.text;
  } catch (err) {
    yield { stage: "summarize", status: "error", error: errorMessage(err) };
    return;
  }
  yield { stage: "summarize", status: "complete", summary };

  if (isSuggestedQuestion(question)) {
    setCachedResult(question, {
      sql,
      rowCount: result.rows.length,
      columns: result.columns,
      rows: result.rows.slice(0, MAX_ROWS_TO_CLIENT),
      summary,
    });
  }

  yield { stage: "done", status: "complete" };
}
