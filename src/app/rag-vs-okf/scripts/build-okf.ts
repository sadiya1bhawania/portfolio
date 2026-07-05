/**
 * Offline script - run once by hand, not at request time.
 *
 *   npx tsx src/app/rag-vs-okf/scripts/build-okf.ts
 *
 * Reads every corpus markdown file and makes one AI pass that identifies
 * the distinct concepts described across the whole corpus (revenue, churn,
 * each product, the support SLA, ...). For each concept it writes one
 * markdown file with YAML frontmatter into okf-bundle/, committed and
 * read by the OKF pipeline at request time instead of calling the model
 * live.
 *
 * The point of this step: source facts that are scattered across several
 * corpus documents (revenue, most notably) get consolidated into a single,
 * coherent concept file here, once, offline.
 */
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { GoogleGenAI } from "@google/genai";
import type { OkfConcept } from "../types";

const CORPUS_DIR = path.join(process.cwd(), "src/app/rag-vs-okf/corpus");
const OKF_BUNDLE_DIR = path.join(process.cwd(), "src/app/rag-vs-okf/okf-bundle");
const MODEL = "gemini-3.1-flash-lite";

interface ConceptDraft {
  source: string;
  type: string;
  title: string;
  description: string;
  tags: string[];
  timestamp: string;
  links: string[];
  body: string;
}

const SYSTEM_INSTRUCTION = `You turn a small corpus of company markdown documents into a set of clean,
standalone "concept" files - the Open Knowledge Format (OKF) for this demo.

Read every source document below (each shown with its filename, frontmatter,
and body). Identify the distinct concepts described across the WHOLE corpus,
for example: how revenue is calculated, what churn means and how it relates
to revenue, each product, the support SLA, office details, etc. Group by
concept, not by source file - some concepts are described once, others are
scattered across several source documents.

Where a concept is scattered across multiple source documents (revenue is
the clearest case: it is introduced in the company overview, defined in the
original revenue recognition policy, and then updated in the revenue
recognition update), pull all of those pieces into ONE concept file that
states the current, complete picture in one place. If a later document
supersedes an earlier one, the concept body should reflect the current
rule and may note what changed, but should not require reading multiple
files to understand.

For each concept, output an object with these fields:
- "source": a short kebab-case filename for the concept, e.g. "revenue.md"
- "type": a short category, e.g. "financial-definition", "product", "operational-detail"
- "title": a human-readable title
- "description": one sentence summarizing the concept
- "tags": a few lowercase keyword tags
- "timestamp": ISO date (YYYY-MM-DD) - use the most recent timestamp among
  the source documents this concept draws from
- "links": kebab-case source filenames (matching other concepts' "source"
  values) of related concepts, e.g. the revenue concept should link to churn
- "body": a clean, plain-language markdown body (a short heading plus a few
  sentences or a short list) that states the definition on its own, with no
  need to cross-reference the original corpus documents

Output ONLY a JSON array of these objects. No markdown fences, no commentary.`;

function loadCorpusPrompt(): string {
  const files = fs.readdirSync(CORPUS_DIR).filter((f) => f.endsWith(".md")).sort();
  if (files.length === 0) throw new Error(`No corpus documents found in ${CORPUS_DIR}`);

  const sections = files.map((file) => {
    const raw = fs.readFileSync(path.join(CORPUS_DIR, file), "utf8");
    const { data, content } = matter(raw);
    console.log(`Read ${file}`);
    return `### ${file}\nFrontmatter: ${JSON.stringify(data)}\n\n${content.trim()}`;
  });

  return sections.join("\n\n---\n\n");
}

function parseConceptDrafts(text: string): ConceptDraft[] {
  const fenceStripped = text.replace(/```(?:json)?\s*([\s\S]*?)```/i, "$1").trim();
  const parsed = JSON.parse(fenceStripped);
  if (!Array.isArray(parsed)) throw new Error("Model did not return a JSON array of concepts");
  return parsed as ConceptDraft[];
}

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
  const ai = new GoogleGenAI({ apiKey });

  const corpusPrompt = loadCorpusPrompt();

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: corpusPrompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.2,
    },
  });

  const drafts = parseConceptDrafts(response.text ?? "");
  if (drafts.length === 0) {
    throw new Error("Model identified zero concepts - refusing to write an empty bundle.");
  }

  console.log(`Model identified ${drafts.length} concepts:`);
  drafts.forEach((draft) => console.log(`  - ${draft.source}: ${draft.title}`));

  fs.mkdirSync(OKF_BUNDLE_DIR, { recursive: true });

  for (const draft of drafts) {
    const frontmatter: Omit<OkfConcept, "body"> = {
      title: draft.title,
      description: draft.description,
      tags: draft.tags,
      source: draft.source,
      timestamp: draft.timestamp,
      links: draft.links,
    };
    const file = matter.stringify(draft.body.trim() + "\n", { type: draft.type, ...frontmatter });
    const outPath = path.join(OKF_BUNDLE_DIR, draft.source);
    fs.writeFileSync(outPath, file);
    console.log(`Wrote ${path.relative(process.cwd(), outPath)} (${draft.title})`);
  }

  console.log(`Done. ${drafts.length} concept files written to ${path.relative(process.cwd(), OKF_BUNDLE_DIR)}/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
