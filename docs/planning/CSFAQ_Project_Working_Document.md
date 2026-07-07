> Original planning document — some details differ from the final
> implementation. See the root [README.md](../../README.md) and
> [docs/CHANGELOG.md](../CHANGELOG.md) for what was actually built.

# CSFAQ — Project Working Document

## Purpose

Crowd Source FAQ (CSFAQ) is a support platform for the **Vicharanashala
internship (Applied AI · Open-source software engineering · IIT Ropar)**.
Interns have the same handful of questions every cohort (NOC dates,
stipend timing, exam relaxations, hostel access) — this project turns
that repeated 1:1 answering into a searchable, self-serve FAQ, backed
by a community forum for anything the FAQ doesn't cover yet, and an
AI layer that keeps the FAQ current instead of going stale.

## Scope

Three layers, in order of how a student actually reaches an answer:

1. **FAQ (public, no login needed)** — keyword + semantic search,
   voice search, and an AI chat widget that answers from the FAQ
   content directly.
2. **Community Q&A (login required)** — for anything the FAQ misses.
   Post, answer, upvote, accept an answer, earn reputation. AI
   auto-answers the easy ones so humans focus on the hard ones.
3. **Support desk (login required)** — for things that need a human
   and can't wait for community answers: NOC issues, account problems,
   anything urgent. Escalation via Golden Ticket for genuinely urgent
   cases.

Underneath all three: an **ingestion pipeline** that turns recorded
Zoom orientation sessions into FAQ content automatically, so answers
given live in a session don't have to be manually re-typed into the
FAQ afterward.

## Why this architecture

- **FAQ is the front door, not the forum.** Most students want an
  answer, not a conversation. The community forum exists for the long
  tail, not as the primary flow.
- **AI proposes, humans dispose.** Every AI-generated answer
  (auto-answer, FAQ audit, Zoom extraction) either meets a high
  confidence bar before going live, or lands in a review queue — it
  never silently overwrites something a human approved.
- **Freshness is a process, not a one-time migration.** An internship
  FAQ goes stale every cohort (dates change, policies change). The
  freshness/peer-review system exists so the FAQ doesn't quietly
  rot after the team that built it moves on.
- **Decoupled frontend/backend.** React SPA + Express API, talking
  over a versioned `/api` surface, so either side can be redeployed
  independently and the API can eventually serve other clients
  (a future Yaksha assistant embed, for instance).

## Build phases (summary — see `docs/CHANGELOG.md` for full detail)

| Phase | What it added |
|---|---|
| 0 | Auth foundation (JWT, register/login) |
| 1 | Core FAQ + keyword search |
| 2 | Community Q&A (posts, comments, voting, reputation) |
| 3 | Hybrid semantic search (embeddings + Atlas Vector Search) |
| 4 | AI pipelines (auto-answer, FAQ audit) via Gemini |
| 5 | Zoom transcript ingestion (OAuth + webhook + manual upload) |
| 6 | Freshness detection, Golden Ticket, support categories, soft-delete, moderation |
| 7 | Admin dashboard, Prometheus metrics |
| 8 | AI chat widget, voice search, reporting UI, admin support queue |

## Non-goals (explicitly out of scope)

- Multi-tenant support (this is a single-cohort platform, not a SaaS product)
- Native mobile apps (responsive web only, and even that has known gaps — see CHANGELOG)
- Real-time chat/notifications (SMS/email/push are not implemented)
- Multi-provider AI failover (only Gemini is wired up; the provider seam exists but Anthropic/OpenAI/XAI/MiniMax are unimplemented)

## Who this document is for

Anyone picking up the project after the fact — to understand *why* it's
shaped the way it is, not just *what* the code does. For the latter,
read the code; the routes/controllers are intentionally short and
literal (see `BACKEND_INTEGRATION.md`).