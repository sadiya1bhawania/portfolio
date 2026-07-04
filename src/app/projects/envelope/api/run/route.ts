import { runPipeline, type RunInput } from "../../lib/runPipelineService";
import type { RunEvent } from "../../lib/runPipelineTypes";
import type { DemoSampleId } from "../../lib/demoService";

export const dynamic = "force-dynamic";

const VALID_SAMPLE_IDS: DemoSampleId[] = ["clean", "recoverable", "blocked"];

function sseEncode(event: RunEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export async function POST(request: Request) {
  const body = await request.json();
  const input: RunInput = {
    sampleId: VALID_SAMPLE_IDS.includes(body.sampleId) ? (body.sampleId as DemoSampleId) : undefined,
    documentText: typeof body.documentText === "string" ? body.documentText : undefined,
    documentName: typeof body.documentName === "string" ? body.documentName : undefined,
  };

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
        for await (const event of runPipeline(input)) {
          controller.enqueue(encoder.encode(sseEncode(event)));
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        controller.enqueue(encoder.encode(sseEncode({ stage: "log", status: "error", error: message })));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: responseHeaders });
}
