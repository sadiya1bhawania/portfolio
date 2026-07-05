import "server-only";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { getGeminiClient, GEMINI_MODEL } from "../../projects/textToSql/lib/geminiClient";
import type { OkfConcept } from "../types";

const OKF_BUNDLE_DIR = path.join(process.cwd(), "src/app/rag-vs-okf/okf-bundle");

/** An OkfConcept plus the two fields the bundle files carry beyond types.ts: its own type tag and filename. */
export interface OkfConceptFile extends OkfConcept {
  type: string;
  filename: string;
}

/** How a concept ended up in the "to read" set: picked by the model, or pulled in through a link. */
export interface ExpandedConcept {
  concept: OkfConceptFile;
  via: "selected" | "link";
  /** set when via is "link": the filename whose links field pulled this one in */
  linkedFrom?: string;
}

/** Reads every concept file in the bundle and parses its frontmatter. Plain code, no AI. */
export function loadOkfBundle(): OkfConceptFile[] {
  const files = fs.readdirSync(OKF_BUNDLE_DIR).filter((f) => f.endsWith(".md")).sort();

  return files.map((filename) => {
    const raw = fs.readFileSync(path.join(OKF_BUNDLE_DIR, filename), "utf8");
    const { data, content } = matter(raw);
    return {
      filename,
      type: data.type ?? "",
      title: data.title ?? "",
      description: data.description ?? "",
      tags: data.tags ?? [],
      source: data.source ?? filename,
      timestamp: data.timestamp ?? "",
      links: data.links ?? [],
      body: content.trim(),
    };
  });
}

/**
 * Asks Gemini which concept files are needed to answer the question. The
 * model only ever sees each concept's filename, title, and description -
 * never its body. This is the whole point of the OKF pipeline: the model
 * picks which files to read, instead of a similarity search picking chunks.
 */
export async function selectConcepts(question: string, concepts: OkfConceptFile[]): Promise<string[]> {
  const listing = concepts.map((c) => `- ${c.filename}: ${c.title} - ${c.description}`).join("\n");

  console.log(`[selectConcepts] question: ${question}`);
  console.log(`[selectConcepts] concepts offered to the model:\n${listing}`);

  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: `Question: ${question}\n\nAvailable concepts:\n${listing}`,
    config: {
      systemInstruction: `You are choosing which concept files to read to answer a question. You can only see
each concept's filename, title, and description below - not its contents.
Pick every filename whose concept is needed to answer the question, and nothing extra.
Output ONLY a JSON array of filenames, e.g. ["revenue.md", "churn.md"]. No markdown fences, no commentary.`,
      temperature: 0,
    },
  });

  const text = (response.text ?? "").trim();
  console.log(`[selectConcepts] raw model output: ${text}`);

  const fenceStripped = text.replace(/```(?:json)?\s*([\s\S]*?)```/i, "$1").trim();
  const parsed = JSON.parse(fenceStripped);
  if (!Array.isArray(parsed)) throw new Error("Model did not return a JSON array of filenames");

  const validFilenames = new Set(concepts.map((c) => c.filename));
  const selected = parsed.filter((f): f is string => typeof f === "string" && validFilenames.has(f));

  console.log(`[selectConcepts] filenames the model returned: ${JSON.stringify(parsed)}`);
  console.log(`[selectConcepts] filenames kept after validation: ${JSON.stringify(selected)}`);

  return selected;
}

/**
 * Pulls in the concepts named in the selected concepts' links, one level
 * deep. Plain code, no AI. Keeps a note of how each concept was included
 * so the UI can show which links were followed.
 */
export function expandWithLinks(selectedFilenames: string[], concepts: OkfConceptFile[]): ExpandedConcept[] {
  const byFilename = new Map(concepts.map((c) => [c.filename, c]));
  const included = new Set<string>();
  const result: ExpandedConcept[] = [];

  for (const filename of selectedFilenames) {
    const concept = byFilename.get(filename);
    if (!concept || included.has(filename)) continue;
    included.add(filename);
    result.push({ concept, via: "selected" });
  }

  // One level deep only - we don't follow the links of linked-in concepts.
  for (const filename of selectedFilenames) {
    const concept = byFilename.get(filename);
    if (!concept) continue;
    for (const linkedFilename of concept.links) {
      if (included.has(linkedFilename)) continue;
      const linked = byFilename.get(linkedFilename);
      if (!linked) continue;
      included.add(linkedFilename);
      result.push({ concept: linked, via: "link", linkedFrom: filename });
    }
  }

  return result;
}

/**
 * Asks Gemini to answer the question using only the full bodies of the
 * chosen concept files. The model is told to say plainly when the
 * context doesn't contain the answer, rather than guessing.
 */
export async function answerFromConcepts(question: string, conceptsToRead: ExpandedConcept[]): Promise<string> {
  const context = conceptsToRead.map(({ concept }) => `# ${concept.title}\n${concept.body}`).join("\n\n");

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
