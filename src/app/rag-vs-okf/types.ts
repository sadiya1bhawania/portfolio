// Shared types for the RAG-vs-OKF demo. Populated by the (not-yet-built) pipeline
// and consumed by the (not-yet-built) UI - this file only fixes the shapes.

/** One chunk of a source document, as produced by the RAG chunking step. */
export interface Chunk {
  id: string;
  /** corpus file name this chunk was cut from, e.g. "revenue-recognition-policy.md" */
  docId: string;
  /** 0-based position of this chunk within its source document */
  index: number;
  text: string;
}

/** A chunk returned by the retriever, alongside how well it matched the query. */
export interface RetrievedChunk {
  chunk: Chunk;
  /** cosine similarity (or equivalent) between the query and this chunk, 0-1 */
  score: number;
}

/** Frontmatter fields every corpus markdown document declares. */
export interface OkfConceptFrontmatter {
  title: string;
  description: string;
  tags: string[];
  /** corpus file name this concept was parsed from, e.g. "churn-definition.md" */
  source: string;
  /** ISO 8601 date the concept was last authored/updated */
  timestamp: string;
}

/** A single node in the OKF pipeline's knowledge graph: frontmatter plus body. */
export interface OkfConcept extends OkfConceptFrontmatter {
  /** markdown body with the frontmatter block removed */
  body: string;
  /** other OkfConcept.source values this concept explicitly references */
  links: string[];
}

/** One event in an SSE stream describing pipeline progress, stage by stage. */
export interface StageEvent {
  stage: string;
  status: "active" | "done" | "error";
  message?: string;
  error?: string;
  data?: unknown;
}
