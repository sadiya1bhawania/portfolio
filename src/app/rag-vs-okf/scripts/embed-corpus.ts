/**
 * Offline script - run once by hand, not at request time.
 *
 *   npx tsx src/app/rag-vs-okf/scripts/embed-corpus.ts
 *
 * Reads every corpus markdown file, splits it into chunks, embeds each
 * chunk once with Gemini, and writes the result to a committed JSON file
 * (cache/rag-embeddings.json) that the RAG pipeline reads at request time
 * instead of calling the embedding API live.
 */
import fs from "fs";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import type { Chunk } from "../types";

const CORPUS_DIR = path.join(process.cwd(), "src/app/rag-vs-okf/corpus");
const OUTPUT_PATH = path.join(process.cwd(), "src/app/rag-vs-okf/cache/rag-embeddings.json");
const EMBEDDING_MODEL = "gemini-embedding-001";

// Fixed-size sliding window: simple and deterministic, no heading parsing.
const CHUNK_SIZE = 400;
const CHUNK_OVERLAP = 60;

interface EmbeddedChunk extends Chunk {
  embedding: number[];
}

function chunkText(text: string, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end).trim());
    if (end === text.length) break;
    start = end - overlap;
  }
  return chunks.filter(Boolean);
}

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
  const ai = new GoogleGenAI({ apiKey });

  const files = fs.readdirSync(CORPUS_DIR).filter((f) => f.endsWith(".md")).sort();
  const chunks: Chunk[] = [];

  for (const file of files) {
    const raw = fs.readFileSync(path.join(CORPUS_DIR, file), "utf8");
    // Only embed the body - strip the leading frontmatter block.
    const body = raw.replace(/^---\n[\s\S]*?\n---\n/, "").trim();
    const pieces = chunkText(body);
    pieces.forEach((text, index) => {
      chunks.push({ id: `${file}#${index}`, docId: file, index, text });
    });
    console.log(`Read ${file} -> ${pieces.length} chunk${pieces.length === 1 ? "" : "s"}`);
  }

  console.log(`Read ${files.length} corpus documents, split into ${chunks.length} chunks total.`);

  const embedded: EmbeddedChunk[] = [];
  let embedCalls = 0;

  for (const chunk of chunks) {
    const response = await ai.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: chunk.text,
      config: { taskType: "RETRIEVAL_DOCUMENT" },
    });
    embedCalls += 1;

    const values = response.embeddings?.[0]?.values;
    if (!values) throw new Error(`No embedding returned for chunk ${chunk.id}`);
    embedded.push({ ...chunk, embedding: values });
  }

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(embedded, null, 2));

  console.log(`Made ${embedCalls} embed-content calls, one per chunk.`);
  console.log(`Wrote ${embedded.length} embedded chunks to ${path.relative(process.cwd(), OUTPUT_PATH)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
