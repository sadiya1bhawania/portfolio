import type { StageEvent } from "../../types";
import { loadOkfBundle, selectConcepts, expandWithLinks, answerFromConcepts, type OkfConceptFile } from "../../lib/okf";

export const dynamic = "force-dynamic";

// The bundle is a set of static, committed files - read it once per server
// instance instead of on every request.
let cachedConcepts: OkfConceptFile[] | undefined;

function getConcepts(): OkfConceptFile[] {
  if (!cachedConcepts) cachedConcepts = loadOkfBundle();
  return cachedConcepts;
}

function sseEncode(event: StageEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

// The OKF pipeline, one stage event at a time. Follows the RAG route's
// StageEvent shape so the UI can render both sides identically. No
// embeddings anywhere here - selection is a model call, not a similarity search.
async function* runOkfPipeline(question: string): AsyncGenerator<StageEvent> {
  yield { stage: "loading_bundle", status: "active" };
  const concepts = getConcepts();

  yield { stage: "selecting", status: "active" };
  const selectedFilenames = await selectConcepts(question, concepts);
  yield { stage: "selected", status: "done", data: { selectedFilenames } };

  const expanded = expandWithLinks(selectedFilenames, concepts);
  const linked = expanded
    .filter((e) => e.via === "link")
    .map((e) => ({ filename: e.concept.filename, linkedFrom: e.linkedFrom }));
  yield { stage: "expanding_links", status: "done", data: { linked } };

  yield { stage: "answering", status: "active" };
  const answer = await answerFromConcepts(question, expanded);

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
        for await (const event of runOkfPipeline(question)) {
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
