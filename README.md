# Crowd Source FAQ — Phases 0, 1, 2 & 3

**Phase 0 — Foundation:** auth, JWT, middleware chain, login/register flow.
**Phase 1 — Core FAQ + Search:** FAQ/Category/Batch models, keyword search, guest browsing.
**Phase 2 — Community Q&A:** posts, comments, voting, accepted answers, reputation, leaderboard.
**Phase 3 — Hybrid Semantic Search:** local embeddings, Atlas Vector Search, Reciprocal Rank Fusion.

No AI-pipeline or Zoom-ingestion features yet — those are Phase 4+.

## Phase 3 — what's new

- `utils/embeddings.ts` — local 768-dim embeddings via `@xenova/transformers`
  (`Xenova/all-mpnet-base-v2`, mean-pooled + L2-normalized). Dynamically
  imported so a failed native-dependency build (`sharp`, pulled in
  transitively) only degrades search to keyword-only instead of crashing
  the whole server.
- FAQ create/update now generates an embedding best-effort
  (`tryGenerateEmbedding`) — failures never block the actual CRUD write.
- `GET /api/search` now runs keyword ($text) and semantic (Atlas
  `$vectorSearch`) search **in parallel** and merges the two ranked lists
  via **Reciprocal Rank Fusion** (`utils/search.ts` → `computeRRF`).
  Response includes a `meta.keywordHits` / `meta.vectorHits` breakdown.
- Two new one-off scripts (`apps/backend/scripts/`):
  - `npm run create-vector-index` — creates the Atlas Vector Search index
    on `FAQ.embedding` (**requires MongoDB Atlas** — this is not
    available on self-hosted/community MongoDB; the script fails
    gracefully with a clear message if run against a non-Atlas cluster)
  - `npm run backfill-embeddings` — embeds any existing FAQ that's
    missing one (created pre-Phase-3, or whose embedding generation
    failed earlier)

### Setup for Phase 3 to actually work end-to-end
1. You need a **MongoDB Atlas** cluster (the free M0 tier supports Vector
   Search).
2. After `./run.sh` is up once with data in it, run:
   ```bash
   cd apps/backend
   npm run backfill-embeddings     # embeds existing FAQs
   npm run create-vector-index     # creates the Atlas index (takes a few min to build)
   ```
3. Until the index finishes building, `/api/search` still works — it
   just falls back to keyword-only results (vector search errors are
   caught and logged, not thrown).

## Running it

```bash
./run.sh
```

Prompts for `MONGODB_URI` and `JWT_SECRET` on first run (saved to `apps/backend/.env.local`, never committed).

Backend: http://localhost:6767
Frontend: http://localhost:5173

## Verified in this build

- ✅ Backend type-checks clean (`tsc --noEmit`), unit tests pass (`vitest run`)
- ✅ Frontend type-checks and builds clean (`vite build`)
- ✅ Server boots cleanly with the new embeddings dependency (confirmed
  the dynamic-import fix prevents a `sharp` native-binary failure from
  crashing the whole app)
- ⚠️ No live MongoDB Atlas cluster was available in the build sandbox —
  the actual `$vectorSearch` aggregation and the `create-vector-index`
  script have **not** been run against a real Atlas cluster. The
  sandbox also couldn't download the embedding model itself (no network
  access to Hugging Face's CDN), so `generateEmbedding()` is unverified
  at runtime — code review it before trusting it blindly, and test with
  a real Atlas connection before merging.

## What's deliberately deferred to later phases

- AI auto-answer / FAQ audit pipelines (Phase 4)
- Zoom ingestion, OAuth, transcript parsing (Phase 5)
- Freshness/staleness detection, Golden Ticket, schema-driven support categories, soft-delete anonymization (Phase 6)
- Admin dashboard UI, telemetry, Prometheus metrics (Phase 7)

## Next: Phase 4

`aiClient.ts` / `aiProvider.ts` abstraction (Anthropic/OpenAI/etc, per-pipeline config), then the auto-answer pipeline (manual "Run AI" button first, then the 24h scheduler) and the FAQ audit pipeline.


