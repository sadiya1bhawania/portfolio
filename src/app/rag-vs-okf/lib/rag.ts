import "server-only";
import fs from "fs";
import path from "path";
import { getGeminiClient, GEMINI_MODEL } from "../../projects/textToSql/lib/geminiClient";
import type { Chunk, RetrievedChunk } from "../types";

const CACHE_PATH = path.join(process.cwd(), "src/app/rag-vs-okf/cache/rag-embeddings.json");
const EMBEDDING_MODEL = "gemini-embedding-001";
const DEFAULT_TOP_K = 4;

/** A chunk plus the vector the offline embed-corpus script computed for it. */
export interface EmbeddedChunk extends Chunk {
  embedding: number[];
}

/** Reads the committed, pre-embedded corpus. No AI call - just a file read. */
export function loadRagCache(): EmbeddedChunk[] {
  const raw = fs.readFileSync(CACHE_PATH, "utf8");
  return JSON.parse(raw) as EmbeddedChunk[];
}

/** Standard cosine similarity between two equal-length vectors. Plain math, no AI. */
export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Embeds the user's question with the same model the offline script used,
 * so the question vector lives in the same space as the cached chunk
 * vectors. This is the only AI call in retrieval.
 */
export async function embedQuestion(question: string): Promise<number[]> {
  const ai = getGeminiClient();
  const response = await ai.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: question,
    config: { taskType: "RETRIEVAL_QUERY" },
  });

  const values = response.embeddings?.[0]?.values;
  if (!values) throw new Error("No embedding returned for question");
  return values;
}

/**
 * Scores every chunk against the question vector and returns the top k
 * matches. Plain code, no AI - the similarity math already happened.
 */
export function retrieveTopChunks(
  questionVector: number[],
  chunks: EmbeddedChunk[],
  k: number = DEFAULT_TOP_K
): RetrievedChunk[] {
  return chunks
    .map((chunk) => ({ chunk, score: cosineSimilarity(questionVector, chunk.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

/**
 * Asks Gemini to answer the question using only the retrieved chunk text.
 * The model is told to say plainly when the context doesn't contain the
 * answer, rather than guessing.
 */
export async function answerFromChunks(question: string, retrievedChunks: RetrievedChunk[]): Promise<string> {
  const context = retrievedChunks
    .map((r, i) => `[Chunk ${i + 1} - from ${r.chunk.docId}]\n${r.chunk.text}`)
    .join("\n\n");

  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: `Context:\n${context}\n\nQuestion: ${question}`,
    config: {
      systemInstruction: `Answer the question using only the context provided below. Do not use outside knowledge.
If the context does not contain enough information to answer, say so plainly instead of guessing.
Keep the answer short and in plain language.`,
      temperature: 0.2,
    },
  });

  return (response.text ?? "").trim();
}
