import { randomUUID } from "node:crypto";
import { runPipeline, type PipelineEvent } from "../../lib/queryService";
import { checkAndIncrementSession } from "../../lib/rateLimiter";

export const dynamic = "force-dynamic";

const SESSION_COOKIE = "tts_session";

function sseEncode(event: PipelineEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

function getSessionId(request: Request): { sessionId: string; isNew: boolean } {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
  if (match) {
    return { sessionId: match[1], isNew: false };
  }
  return { sessionId: randomUUID(), isNew: true };
}

export async function POST(request: Request) {
  const { question } = await request.json();

  if (typeof question !== "string" || question.trim().length === 0) {
    return Response.json({ error: "`question` must be a non-empty string." }, { status: 400 });
  }

  const { sessionId, isNew } = getSessionId(request);
  const responseHeaders: Record<string, string> = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  };
  if (isNew) {
    responseHeaders["Set-Cookie"] = `${SESSION_COOKIE}=${sessionId}; Path=/; HttpOnly; SameSite=Lax`;
  }

  const encoder = new TextEncoder();

  if (!checkAndIncrementSession(sessionId)) {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            sseEncode({
              stage: "done",
              status: "error",
              error: "Session limit reached (5 questions per session). Please come back later.",
            })
          )
        );
        controller.close();
      },
    });
    return new Response(stream, { headers: responseHeaders });
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of runPipeline(question)) {
          controller.enqueue(encoder.encode(sseEncode(event)));
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        controller.enqueue(
          encoder.encode(sseEncode({ stage: "done", status: "error", error: message }))
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: responseHeaders });
}
