# Crowd Source FAQ — Phases 0 through 5

**Phase 0 — Foundation:** auth, JWT, middleware chain, login/register flow.
**Phase 1 — Core FAQ + Search:** FAQ/Category/Batch models, keyword search, guest browsing.
**Phase 2 — Community Q&A:** posts, comments, voting, accepted answers, reputation, leaderboard.
**Phase 3 — Hybrid Semantic Search:** local embeddings, Atlas Vector Search, Reciprocal Rank Fusion.
**Phase 4 — AI Pipelines:** auto-answer + FAQ audit, powered by Gemini.
**Phase 5 — Zoom Ingestion:** per-user OAuth, webhook + manual transcript upload, AI Q&A extraction.

## Phase 4 — AI Pipelines

- `utils/aiClient.ts` — Gemini implementation (dynamically imported, same
  isolation pattern as Phase 3's embeddings). `utils/aiProvider.ts`
  resolves which provider/model each pipeline uses via env vars
  (`AUTO_ANSWER_PROVIDER`, `FAQ_AUDIT_PROVIDER`, etc.) — **only Gemini is
  wired up right now** since that's the available key; the seam for
  Anthropic/OpenAI/XAI/MiniMax is there but unimplemented.
- **Auto-answer pipeline** (`controllers/autoAnswerController.ts`):
  finds open, unanswered community posts, searches FAQ + Community +
  TranscriptKnowledge for relevant context, asks Gemini to judge
  confidence and synthesize an answer. ≥0.85 → auto-posts as a comment
  from a system "AI Assistant" account (clearly disclosed in the comment
  text); 0.60–0.84 → queued for human review; below that, or if the post
  matches a sensitive-content keyword filter, escalates untouched.
  `POST /api/admin/auto-answer/run` triggers it manually; `GET
  /api/admin/auto-answer/queue` shows what's flagged.
- **FAQ audit pipeline** (`controllers/faqAuditController.ts`):
  re-checks every approved FAQ against newer knowledge, verdicts:
  correct / drift_detected / contradiction / stale. Non-"correct"
  verdicts flip the FAQ to `pending_review`. `POST
  /api/admin/faq-audit/run` triggers manually.
- Both pipelines log every outcome to `PipelineResult` (30-day TTL).
- `utils/scheduler.ts` wires the 24h auto-answer + 6h audit cron jobs via
  `node-cron`, **off by default** (`ENABLE_SCHEDULERS=false`) so local
  dev doesn't quietly burn your Gemini quota — the manual admin trigger
  endpoints work regardless of this flag.

### Setup
```
GEMINI_API_KEY=your-key-here
```
That's the only required addition. Get a free key from Google AI Studio.

## Phase 5 — Zoom Ingestion

- **Manual upload works with zero Zoom setup** — `POST /api/zoom/upload`
  (multipart, field name `transcript`, accepts `.vtt` or `.txt`) parses
  the transcript and runs it through the same AI extraction pipeline a
  real webhook would. This is the easiest way to test Phase 5 before
  you have a Zoom OAuth app.
- **Per-user OAuth** (`utils/zoomOAuth.ts`): `GET /api/zoom/authorize`
  returns a consent URL; `GET /api/zoom/callback` (Zoom redirects here)
  exchanges the code and stores AES-256-GCM–encrypted tokens
  (`utils/crypto.ts`) on the user. Requires `ZOOM_CLIENT_ID` /
  `ZOOM_CLIENT_SECRET` / `ENCRYPTION_KEY`.
- **Webhook receiver** (`POST /api/zoom/webhook`): handles Zoom's
  `endpoint.url_validation` handshake and `recording.transcript_completed`
  events, downloads the transcript (wrapped in a circuit breaker —
  `utils/circuitBreaker.ts`), and processes it the same way manual
  upload does.
  ⚠️ **Known simplification**: the webhook checks a static secret header
  rather than Zoom's full HMAC signature scheme, and assumes Zoom's
  `host_id` maps 1:1 to a `User._id` (it won't, in reality — Zoom's
  `host_id` is a Zoom-internal identifier). You'll need to add a
  Zoom-user-id-to-local-user-id lookup (the `zoomUserId` field is
  already on the `User` model for this) before the webhook path is
  production-ready. Manual upload doesn't have this problem since it's
  tied to the logged-in user directly.
- **Dual-publish** (`services/knowledgeBase.ts`): every extracted Q&A
  pair becomes both a `TranscriptKnowledge` doc (auto-approved,
  immediately searchable/embeddable) and a `ZoomInsight` doc
  (admin-reviewed, promotable to a first-class `FAQ` via `POST
  /api/knowledge/insights/:id/promote`).
- Retry + dead-letter: failed processing increments `ZoomMeeting.retryCount`;
  after 3 failures it's marked `deadLettered` and won't auto-retry.
- Frontend: Account page now has a "Connect Zoom account" button and a
  manual transcript upload form (works today, no Zoom app needed).

### Setup for manual upload (no Zoom app needed)
Nothing beyond `GEMINI_API_KEY` — just log in and use the upload form on
the Account page, or `POST /api/zoom/upload` directly.

### Setup for real Zoom OAuth + webhooks
1. Create a Zoom OAuth app in the Zoom Marketplace, get `ZOOM_CLIENT_ID` / `ZOOM_CLIENT_SECRET`
2. Generate an encryption key: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` → `ENCRYPTION_KEY`
3. Set `ZOOM_REDIRECT_URI` to match what you registered with Zoom
4. Configure a webhook subscription in the Zoom app for `recording.transcript_completed`, pointing at `/api/zoom/webhook`, with `ZOOM_WEBHOOK_SECRET_TOKEN` matching what you set in Zoom's dashboard
5. Fix the `host_id` → local-user mapping caveat above before trusting the webhook path

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
- ✅ Server boots cleanly with all new dependencies (Gemini SDK,
  node-cron, multer) — dynamic-import isolation confirmed for both
  embeddings and the AI client
- ⚠️ **Not tested against live services** in the build sandbox: no
  Gemini API access (would need a real key + network), no MongoDB Atlas
  cluster, no Zoom OAuth app. All three pipelines (auto-answer, FAQ
  audit, Zoom extraction) are architecturally sound and type-safe but
  their actual AI responses, JSON parsing edge cases, and Zoom API
  integration are unverified at runtime. Test thoroughly — especially
  the `safeParseJson` fallback paths and the sensitive-content escalation
  filter — before trusting this with real user-facing content.

## What's deliberately deferred to later phases

- Freshness/staleness detection, Golden Ticket, schema-driven support categories, soft-delete anonymization (Phase 6)
- Admin dashboard UI, telemetry, Prometheus metrics (Phase 7) — Phase 4/5 admin actions are currently API-only (test via Postman/curl), no admin frontend pages yet

## Next: Phase 6

Freshness/staleness detection (freshness_tier + peer review voting), Golden Ticket (Spurti Points escalation), schema-driven support categories, and soft-delete anonymization.



