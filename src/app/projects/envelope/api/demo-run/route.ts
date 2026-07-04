import { runDemoPipeline } from "../../lib/demoPipelineService";
import type { DemoSampleId } from "../../lib/demoService";
import type { RunEvent } from "../../lib/runPipelineTypes";

export const dynamic = "force-dynamic";

function sseEncode(event: RunEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

const VALID_SAMPLE_IDS: DemoSampleId[] = ["clean", "recoverable", "blocked"];

export async function POST(request: Request) {
  const body = await request.json();
  const sampleId: DemoSampleId = VALID_SAMPLE_IDS.includes(body.sampleId) ? body.sampleId : "clean";

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
        for await (const event of runDemoPipeline(sampleId)) {
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
