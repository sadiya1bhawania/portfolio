import "server-only";
import { GoogleGenAI } from "@google/genai";

export const dynamic = "force-dynamic";

const GEMINI_MODEL = "gemini-3.1-flash-lite";

let client: GoogleGenAI | undefined;

function getGeminiClient(): GoogleGenAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set");
    }
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

const SYSTEM_INSTRUCTION = `You are simulating what a language model guesses will happen next in a physical scene, based only on patterns in text. You have no real understanding of physics.

Describe the single most likely next state of the scene in one or two plain sentences. State it as a direct description of what happens, not as a probability or list of possibilities. Do not explain your reasoning, do not mention that you are a language model, and do not hedge.`;

export async function POST(request: Request) {
  const body = await request.json();
  const scene = typeof body.scene === "string" ? body.scene.trim() : "";
  const action = typeof body.action === "string" ? body.action.trim() : "";

  if (!scene || !action) {
    return Response.json({ error: "`scene` and `action` must be non-empty strings." }, { status: 400 });
  }

  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: `Scene: ${scene}\nAction: ${action}\n\nWhat happens next?`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.4,
        maxOutputTokens: 80,
      },
    });

    const prediction = (response.text ?? "").trim();
    if (!prediction) {
      return Response.json({ error: "The model returned an empty prediction." }, { status: 502 });
    }

    return Response.json({ prediction });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message }, { status: 502 });
  }
}
