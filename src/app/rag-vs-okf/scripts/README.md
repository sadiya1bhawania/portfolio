# Offline pre-bake scripts

These two scripts do the expensive, one-time work for the RAG-vs-OKF demo so
the deployed demo can run for free at request time. They are **run once by
hand**, not from the app or on every request, and their output is committed
to the repo:

- `embed-corpus.ts` -> `../cache/rag-embeddings.json`
- `build-okf.ts` -> `../okf-bundle/*.md`

Run them with [tsx](https://github.com/privatenumber/tsx) (add `-w` never -
these are one-shot):

```bash
GEMINI_API_KEY=... npx tsx src/app/rag-vs-okf/scripts/embed-corpus.ts
GEMINI_API_KEY=... npx tsx src/app/rag-vs-okf/scripts/build-okf.ts
```

or via the package.json shortcuts:

```bash
npm run rag-vs-okf:embed-corpus
npm run rag-vs-okf:build-okf
```

Re-run either script and commit the new output whenever the corpus in
`../corpus` changes.

## Why this exists

This demo is meant to show the two pipelines answering questions cheaply
and instantly, without an API key or an embedding/analysis bill on every
page load. In production, these same two steps - chunk-and-embed for RAG,
concept-extraction for OKF - are not offline scripts: they run live, once,
over each user's own uploaded documents when those documents are ingested.
The scripts here exist only because this demo's corpus is small and fixed,
so pre-baking it is strictly better than paying for it on every visitor.
