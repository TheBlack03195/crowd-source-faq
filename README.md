# Crowd Source FAQ — Phases 0 through 7 (feature-complete)

**Phase 0 — Foundation:** auth, JWT, middleware chain, login/register flow.
**Phase 1 — Core FAQ + Search:** FAQ/Category/Batch models, keyword search, guest browsing.
**Phase 2 — Community Q&A:** posts, comments, voting, accepted answers, reputation, leaderboard.
**Phase 3 — Hybrid Semantic Search:** local embeddings, Atlas Vector Search, Reciprocal Rank Fusion.
**Phase 4 — AI Pipelines:** auto-answer + FAQ audit, powered by Gemini.
**Phase 5 — Zoom Ingestion:** per-user OAuth, webhook + manual transcript upload, AI Q&A extraction.
**Phase 6 — Freshness, Golden Ticket, Support, Soft-Delete:** the secondary features that round out the operational loop.
**Phase 7 — Admin Dashboard + Observability:** a working (if consolidated) admin UI, moderation, metrics.

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
- `utils/scheduler.ts` wires the 24h auto-answer + 6h audit + daily
  freshness cron jobs via `node-cron`, **off by default**
  (`ENABLE_SCHEDULERS=false`) so local dev doesn't quietly burn your
  Gemini quota — the manual admin trigger endpoints work regardless.

### Setup
```
GEMINI_API_KEY=your-key-here
```
That's the only required addition. Get a free key from Google AI Studio.

## Phase 5 — Zoom Ingestion

- **Manual upload works with zero Zoom setup** — `POST /api/zoom/upload`
  (multipart, field name `transcript`, accepts `.vtt` or `.txt`) parses
  the transcript and runs it through the same AI extraction pipeline a
  real webhook would.
- **Per-user OAuth** (`utils/zoomOAuth.ts`): `GET /api/zoom/authorize`
  returns a consent URL; `GET /api/zoom/callback` exchanges the code and
  stores AES-256-GCM–encrypted tokens (`utils/crypto.ts`). Also fetches
  and stores Zoom's own user id (`User.zoomUserId`) so incoming webhooks
  can map `host_id` back to the right local user.
- **Webhook receiver** (`POST /api/zoom/webhook`): full HMAC signature
  verification (Zoom's `x-zm-signature` scheme), handles the
  `endpoint.url_validation` handshake, downloads the transcript (wrapped
  in a circuit breaker), and processes it the same way manual upload does.
- **Dual-publish** (`services/knowledgeBase.ts`): every extracted Q&A
  pair becomes both a `TranscriptKnowledge` doc (auto-approved,
  immediately searchable/embeddable) and a `ZoomInsight` doc
  (admin-reviewed, promotable to a first-class `FAQ`).
- Retry + dead-letter: failed processing increments `ZoomMeeting.retryCount`;
  after 3 failures it's marked `deadLettered` and won't auto-retry.
- Frontend: Account page has a "Connect Zoom account" button and a
  manual transcript upload form.

### Setup for manual upload (no Zoom app needed)
Nothing beyond `GEMINI_API_KEY` — log in and use the upload form on the
Account page, or `POST /api/zoom/upload` directly.

### Setup for real Zoom OAuth + webhooks
1. Create a Zoom OAuth app in the Zoom Marketplace, get `ZOOM_CLIENT_ID` / `ZOOM_CLIENT_SECRET`
2. Generate an encryption key: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` → `ENCRYPTION_KEY`
3. Set `ZOOM_REDIRECT_URI` to match what you registered with Zoom
4. Use a tunnel (ngrok/cloudflared) to expose localhost during local dev
5. Configure a webhook subscription for `recording.transcript_completed`
   pointing at `<tunnel-url>/api/zoom/webhook`, with the Secret Token
   from Zoom's dashboard set as `ZOOM_WEBHOOK_SECRET_TOKEN`

## Phase 6 — Freshness, Golden Ticket, Support, Soft-Delete

- **FAQ freshness detection** (`controllers/freshnessController.ts`):
  every FAQ has a `freshnessTier` (evergreen/seasonal/volatile) with a
  per-tier review interval. `POST /api/freshness/run` (daily cron,
  off by default) auto-flags stale FAQs. Anyone can manually flag one
  via `POST /api/freshness/:id/flag-outdated` (wired into the FAQ
  page's "⚠ Flag as outdated" link). Peer voting (`still_accurate` /
  `needs_update`) auto-verifies a flagged FAQ back to approved once
  `FAQ_VERIFY_THRESHOLD` (default 3) still-accurate votes land in the
  same review cycle — one vote per user per cycle, enforced by a unique
  index on `(faqId, reviewCycle, voterId)`.
- **Golden Ticket** (`controllers/supportGoldenController.ts`): users
  spend Spurti Points (`User.sp`, starts at 100) to escalate a support
  ticket to the top of the review queue. SP is consumed on submission
  regardless of outcome — no refund on rejection. A single cooldown
  (admin-configurable via `AppSetting.goldenCooldownHours`, default 48h,
  `/admin/settings`) is the only rate limit. The live escalation queue
  is anonymized for non-admin viewers. User-facing page at `/golden`.
- **Schema-driven support categories** (`models/SupportCategory.ts`):
  each support issue type has an admin-editable list of context fields
  (text/textarea/number/date/boolean/dropdown) that tickets must fill
  in — add/edit/archive fields without a redeploy.
- **Soft-delete with anonymization**: `DELETE /api/auth/me` anonymizes
  the account (name → "Deleted User", email → non-routable placeholder,
  password → random UUID) rather than hard-deleting — posts, comments,
  votes, and reputation history stay intact.
- **Moderation** (`controllers/moderationController.ts`): ban, suspend
  (with duration), warn, all logged to `ModerationLog`.
- **Feature flags** (`models/FeatureFlag.ts`): cached boolean toggles,
  editable from `/admin/settings`.

## Phase 7 — Admin Dashboard + Observability

- **Admin dashboard** at `/admin` (role-gated: admin or moderator).
  **Deliberate simplification from the original 15-page design**:
  consolidated into 7 pages under a shared sidebar layout — Overview,
  FAQ Review (freshness + audit combined), Auto-Answer Queue, Community
  Moderation, Users, Zoom Ingestion, Settings.
- **Dashboard stats** (`GET /api/admin/dashboard`): live counts — users,
  FAQs, pending reviews, open posts, open support tickets, golden
  tickets, failed Zoom meetings, recent pipeline activity.
- **User management**: search, role change, ban/unban, suspend.
- **Prometheus metrics** at `GET /api/metrics` (plain-text exposition
  format, no external dependency): HTTP request counts by
  method+status, request duration percentiles.

## Running it

```bash
./run.sh
```

Prompts for `MONGODB_URI` and `JWT_SECRET` on first run (saved to
`apps/backend/.env.local`, never committed).

Backend: http://localhost:6767
Frontend: http://localhost:5173

To use the admin dashboard, promote your account's `role` to `admin` or
`moderator` directly in MongoDB (Browse Collections → `yaksha_faq_users`
→ edit the `role` field → log out and back in so the new JWT carries the
updated role), then visit `/admin`.

## Verified in this build

- ✅ Backend type-checks clean (`tsc --noEmit`), unit tests pass (`vitest run`)
- ✅ Frontend type-checks and builds clean (`vite build`)
- ✅ Server boots cleanly with all dependencies added across every phase
- ✅ **Phases 0–5 have been tested against live services** by the
  project owner (real MongoDB Atlas, real Gemini API, real Zoom OAuth
  app + webhook, end-to-end transcript ingestion confirmed working)
- ⚠️ **Phases 6 and 7 have NOT been tested against live services** yet
  — same sandbox limitation as every other phase (no live DB/API
  access when building). Test the full loop before trusting it: flag a
  FAQ → vote it back to approved, submit a Golden Ticket → confirm
  cooldown blocks a second submission, ban/suspend a test user →
  confirm they're locked out, soft-delete an account → confirm their
  old posts still display correctly with "Deleted User" as the author.

## What's NOT included (out of scope for all 8 phases)

- Fine-grained per-page admin routes (consolidated instead — see Phase 7 note above)
- `AdminAISettings` UI for per-pipeline provider/model config (env vars only, no UI)
- `AdminUnresolvedSearch` page (`SearchLog`/`UnresolvedSearch` models were never built; only `PipelineResult`-based observability exists)
- SMS notifications (Twilio), email delivery (SMTP), SpillTheTea in-app notification system
- Full production-grade Zoom app review / rate-limit hardening
- Automated test coverage beyond the one `authorize()` unit test from Phase 0 — everything since has been manually/type-checked but not unit-tested

This is a solid, working core of the platform end-to-end, not a 1:1
reproduction of every feature in the original architecture doc. Treat
the "what's not included" list as your next backlog, not as missing
homework.

## Post-review fixes (gaps found and closed after the initial Phase 6/7 pass)

A self-review after Phase 6/7 turned up two real functional gaps, now fixed:

1. **No way to actually create a support ticket.** The Golden Ticket
   page assumed tickets already existed, but no UI ever let a user
   create one. Added `/support` (list + create) and `/support/:id`
   (follow-ups, staff status controls) pages.
2. **Freshness peer-voting had no public UI.** `GET
   /api/faq/freshness/review-queue` was accidentally admin-only, so
   regular users had no way to see or vote on flagged FAQs — defeating
   the entire point of peer review. Fixed: that endpoint now just
   requires login (`protect`, not `adminOnly`); admin-only actions
   (dismiss, manual run) are unchanged. Added `/faq/review-queue` page
   with vote buttons.

Also fixed a route-mounting fragility: `/api/faq/freshness/*` was
nested under the already-mounted `/api/faq` router. It happened to work
correctly (Express's path matching doesn't collide here since none of
`faq.ts`'s routes match multi-segment paths), but it was needlessly
fragile. Moved to its own top-level mount: `/api/freshness/*`.

