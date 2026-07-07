# Crowd Source FAQ

A full-stack FAQ + community Q&A platform built for the **Vicharanashala
internship (Applied AI · Open-source software engineering · IIT Ropar)**.
Students can browse a searchable FAQ, ask/answer questions in a community
forum, raise support tickets, and get AI-assisted answers — while admins
get a dashboard to review, moderate, and keep content fresh.

## What is it

- **Public FAQ** with keyword + semantic (hybrid) search, a floating
  "Yaksha-mini" AI chat widget, and a voice-search mode.
- **Community Q&A** — post questions, answer, upvote, accept answers,
  earn reputation, climb the leaderboard.
- **Support desk** — raise a ticket, get replies from staff, escalate
  urgent ones with a "Golden Ticket" (spend points to jump the queue).
- **AI pipelines** (Gemini) — auto-answers unattended community
  questions, audits existing FAQs for staleness/contradictions, and
  extracts Q&A pairs from uploaded/ingested Zoom meeting transcripts.
- **Admin dashboard** — moderation (posts, comments, users), FAQ
  review queue, support ticket queue, Zoom ingestion health, feature
  flags, and basic Prometheus metrics.

See [`docs/CHANGELOG.md`](docs/CHANGELOG.md) for the detailed,
phase-by-phase build history and a list of known gaps/limitations.

## Tech stack

**Backend** — Node.js + TypeScript, Express 4, MongoDB + Mongoose 8,
JWT auth (`jsonwebtoken` + `bcryptjs`), Zod validation, `helmet` +
`express-rate-limit` + CORS, Google Gemini (`@google/generative-ai`) for
AI pipelines, local embeddings (`@xenova/transformers`) + MongoDB Atlas
Vector Search for hybrid search, `node-cron` for scheduled jobs, `multer`
for file uploads, Vitest for tests.

**Frontend** — React 19 + TypeScript, Vite, React Router 7, Tailwind
CSS 4, Axios.

**Infra / other** — npm workspaces (monorepo), Zoom OAuth + webhooks for
meeting ingestion, AES-256-GCM token encryption.

## Folder structure

crowd-source-faq/
├── run.sh                      # one-command local dev runner (env setup + both servers)
├── docs/
│   └── CHANGELOG.md            # detailed phase-by-phase build log + known limitations
├── apps/
│   ├── backend/                 # Express + TypeScript API
│   │   ├── server.ts             # app setup, middleware chain, route mounting
│   │   ├── config/
│   │   │   └── db.ts             # MongoDB connection (cached/lazy)
│   │   ├── models/                # Mongoose schemas (User, FAQ, CommunityPost, SupportRequest, ...)
│   │   ├── controllers/            # request handlers, one file per resource/feature
│   │   ├── routes/                 # Express routers, one file per resource — mounted in server.ts
│   │   ├── middleware/              # auth (protect/authorize), admin guard, metrics
│   │   ├── utils/                    # AI clients, search/RRF, crypto, rate limiting, sanitization, etc.
│   │   ├── services/                  # cross-cutting business logic (knowledge base dual-publish)
│   │   ├── scripts/                    # one-off ops scripts (backfill embeddings, create vector index)
│   │   ├── types/                       # ambient TypeScript declarations (Express req augmentation)
│   │   └── __tests__/                    # Vitest unit tests
│   │
│   └── frontend/                # React + Vite SPA
│       ├── src/
│       │   ├── main.tsx              # entry point
│       │   ├── App.tsx                # route table
│       │   ├── pages/                  # one component per public/user route
│       │   ├── admin/
│       │   │   ├── pages/                # one component per /admin/* route
│       │   │   └── components/            # AdminLayout (sidebar), AdminRoute (role guard), shared widgets
│       │   ├── components/ui/              # shared UI: Navbar, Button, SearchBar, ChatWidget, ProtectedRoute
│

## Getting started

### Prerequisites
- Node.js 20+
- A MongoDB connection string (a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster works — Atlas Vector Search for semantic search requires Atlas specifically, not a local `mongod`)
- A free [Gemini API key](https://aistudio.google.com/) (for the AI features — everything else works without one)

### Quick start
```bash
./run.sh
```
On first run this will:
1. Copy `apps/backend/.env.example` → `apps/backend/.env.local` and prompt you for `MONGODB_URI` and `JWT_SECRET` (leave the secret blank to auto-generate one)
2. Copy `apps/frontend/.env.example` → `apps/frontend/.env.local`
3. `npm install` both apps (only if `node_modules` is missing)
4. Start both dev servers

Then open:
- Frontend → http://localhost:5173
- Backend API → http://localhost:6767

### Manual setup (equivalent to what `run.sh` does)
```bash
cp apps/backend/.env.example apps/backend/.env.local     # fill in MONGODB_URI, JWT_SECRET, etc.
cp apps/frontend/.env.example apps/frontend/.env.local

npm install --workspace=apps/backend
npm install --workspace=apps/frontend

npm run dev --workspace=apps/backend     # http://localhost:6767
npm run dev --workspace=apps/frontend    # http://localhost:5173
```

### Becoming an admin
Register a normal account through the UI, then in MongoDB (Atlas →
Browse Collections → `yaksha_faq_users`) manually change that user's
`role` field to `admin` or `moderator`. Log out and back in (so the new
JWT carries the updated role), then visit `/admin`.

### Enabling AI features
Add to `apps/backend/.env.local`:
GEMINI_API_KEY=your-gemini-api-key-here
That's the only required addition — powers the chat widget, community
auto-answer pipeline, and FAQ audit pipeline. Full list of every env
var (Zoom OAuth, scheduler cron settings, freshness thresholds, etc.)
is documented inline in `apps/backend/.env.example`.

## Available scripts

Run from the repo root unless noted:

| Command | What it does |
|---|---|
| `./run.sh` | Full local dev setup + run (backend + frontend) |
| `npm run dev --workspace=apps/backend` | Backend dev server with hot reload (`tsx watch`) |
| `npm run dev --workspace=apps/frontend` | Frontend dev server (Vite) |
| `npm run build --workspace=apps/backend` | Compile backend TypeScript → `apps/backend/dist` |
| `npm run build --workspace=apps/frontend` | Type-check + build frontend → `apps/frontend/dist` |
| `npm test --workspace=apps/backend` | Run backend unit tests (Vitest) |
| `npm run backfill-embeddings --workspace=apps/backend` | (One-off) generate embeddings for existing FAQs |
| `npm run create-vector-index --workspace=apps/backend` | (One-off) create the Atlas Vector Search index |

## API overview

All backend routes are mounted under `/api`. High-level groups:

| Base path | Covers |
|---|---|
| `/api/auth` | register, login, `/me`, soft-delete account |
| `/api/faq`, `/api/public` | FAQ CRUD (admin/mod write), public browse |
| `/api/search` | hybrid keyword + vector search, autocomplete |
| `/api/chat` | AI chat widget (RAG over the FAQ set) |
| `/api/community` | posts, comments, voting, bookmarks, reporting |
| `/api/reputation` | reputation log, leaderboard |
| `/api/support` | ticket create/list/reply/status, Golden Ticket, support categories |
| `/api/freshness` | flag/vote/review-queue for stale FAQs |
| `/api/zoom` | OAuth connect, webhook receiver, manual transcript upload |
| `/api/knowledge` | transcript knowledge + Zoom insight review (admin) |
| `/api/moderation` | ban/suspend/warn (admin) |
| `/api/admin` | dashboard stats, user management, auto-answer + FAQ-audit triggers |
| `/api/app-settings`, `/api/feature-flags` | admin-configurable settings/toggles |
| `/api/metrics`, `/api/health` | Prometheus metrics, health check |

Every route file under `apps/backend/routes/` is a short, readable list
of `router.get/post/patch/delete(...)` lines — that's the fastest way
to see exactly what's exposed and which middleware guards it.

## Status

Feature-complete across 8 build phases (see `docs/CHANGELOG.md` for
what shipped in each). Type-checks and builds are clean on both apps,
and a unit test suite passes, but **this has not yet had a full
production-readiness pass** — see the "Known production-readiness
gaps" section at the bottom of `docs/CHANGELOG.md` before deploying
publicly (secrets/`.gitignore`, a Zoom webhook signature bug, missing
404/error-boundary pages, thin error handling, no mobile nav, and no
deployment config are the main open items).
