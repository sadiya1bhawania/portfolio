import type { StageEvent } from "../../types";
import { loadRagCache, embedQuestion, retrieveTopChunks, answerFromChunks, type EmbeddedChunk } from "../../lib/rag";

export const dynamic = "force-dynamic";

// The cache is a static, committed file - read it once per server instance
// instead of on every request.
let cachedChunks: EmbeddedChunk[] | undefined;

function getChunks(): EmbeddedChunk[] {
  if (!cachedChunks) cachedChunks = loadRagCache();
  return cachedChunks;
}

function sseEncode(event: StageEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

// The RAG pipeline, one stage event at a time. The OKF route follows the
// same StageEvent shape so the UI can render both sides identically.
async function* runRagPipeline(question: string): AsyncGenerator<StageEvent> {
  yield { stage: "embedding_question", status: "active" };
  const questionVector = await embedQuestion(question);

  yield { stage: "retrieving", status: "active" };
  const retrieved = retrieveTopChunks(questionVector, getChunks());
  yield { stage: "retrieved", status: "done", data: { retrieved } };

  yield { stage: "answering", status: "active" };
  const answer = await answerFromChunks(question, retrieved);

  yield { stage: "done", status: "done", data: { answer } };
}

export async function POST(request: Request) {
  const body = await request.json();
  const question = typeof body.question === "string" ? body.question : "";

  const responseHeaders: Record<string, string> = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  };

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        if (!question.trim()) throw new Error("question is required");
        for await (const event of runRagPipeline(question)) {
          controller.enqueue(encoder.encode(sseEncode(event)));
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        controller.enqueue(encoder.encode(sseEncode({ stage: "done", status: "error", error: message })));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: responseHeaders });
}
