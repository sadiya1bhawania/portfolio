@AGENTS.md

## Output rules
- No explanations, no code summaries, no praise.
- After each task reply ONLY: files changed (one line each), build result, blockers. Max 8 lines.
- Never invent colors, fonts, spacing. Reuse existing tokens / CSS Modules. Fail states only use the existing --brick token. Any red in docs/motion-reference.html maps to --brick.
- docs/motion-reference.html is a DESIGN REFERENCE (copy, layout, timings). Never import or ship it. Map its hex colors to our existing tokens.
