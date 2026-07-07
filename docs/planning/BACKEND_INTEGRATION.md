> Original planning document — some details differ from the final
> implementation. See the root [README.md](../../README.md) and
> [docs/CHANGELOG.md](../CHANGELOG.md) for what was actually built.

# Backend Integration Guide

How to talk to the CSFAQ API from any client (the bundled React
frontend, a script, Postman, another service).

## Base URL

All routes are mounted under `/api`. Locally: `http://localhost:6767/api`.

## Authentication

JWT bearer tokens, not cookies.

1. `POST /api/auth/register` or `POST /api/auth/login` → returns
   `{ token, user }`.
2. Store the token client-side (the frontend uses `localStorage`).
3. Send it on every subsequent request:
   ```
   Authorization: Bearer <token>
   ```
4. `GET /api/auth/me` confirms the token is still valid and returns
   the current user — call this on app load to restore a session.

Tokens can be revoked server-side (ban/suspend/logout-all); a revoked
or expired token gets a `401`.

### Roles

`user` (default) → `moderator` → `admin`. Role is embedded in the JWT
and re-checked against the DB on every request (so a ban takes effect
immediately, not just on next login). Admin-only routes return `403`
for anyone else, `401` if not logged in at all.

## Request/response conventions

- Request bodies: JSON, validated with [Zod](https://zod.dev) schemas.
  A failed validation returns `400` with `{ error: "<message>" }`.
- Success responses are always an object, never a bare array —
  e.g. `{ items: [...] }`, `{ post: {...} }`, `{ request: {...} }`.
  Check each controller for the exact key; there's no single global
  envelope shape.
- Errors are always `{ error: "<human-readable message>" }`.
- Pagination (where present, e.g. `GET /api/support`) uses
  `?page=&limit=` query params and returns `{ items, total, page, limit }`.

## Rate limiting

Applied per-route where it matters (login/register, the AI chat
widget), keyed by user id when authenticated or IP for guests. A
limited request returns `429`.

## Route groups

| Base path | Auth | Covers |
|---|---|---|
| `/api/auth` | mixed | register, login, `/me`, soft-delete account |
| `/api/faq` | public read / admin+mod write | FAQ CRUD |
| `/api/public` | public | categories, published FAQ browse |
| `/api/search` | public | hybrid keyword+vector search, autocomplete |
| `/api/chat` | public, rate-limited | AI chat widget (RAG over the FAQ set) |
| `/api/community` | mixed | posts, comments, voting, bookmarks, reporting |
| `/api/reputation` | public | reputation log, leaderboard |
| `/api/support` | mixed | tickets, Golden Ticket, support categories |
| `/api/freshness` | mixed | flag/vote/review-queue for stale FAQs |
| `/api/zoom` | mixed | OAuth connect, webhook receiver, manual transcript upload |
| `/api/knowledge` | admin | transcript knowledge + Zoom insight review |
| `/api/moderation` | admin | ban/suspend/warn |
| `/api/admin` | admin+mod | dashboard stats, user management, pipeline triggers |
| `/api/app-settings`, `/api/feature-flags` | admin write / mixed read | configurable settings/toggles |
| `/api/metrics`, `/api/health` | public | Prometheus metrics, health check |

The fastest way to see exactly what's exposed and which middleware
guards each route is to read the corresponding file in
`apps/backend/routes/` — each is a short, literal list of
`router.get/post/patch/delete(...)` calls with no indirection.

## Example: login + authenticated request

```bash
# Login
curl -X POST http://localhost:6767/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@example.com","password":"hunter2"}'
# → { "token": "eyJ...", "user": { "id": "...", "role": "user", ... } }

# Use the token
curl http://localhost:6767/api/community/posts \
  -H "Authorization: Bearer eyJ..."
```

## Example: creating a FAQ (admin/moderator only)

```bash
curl -X POST http://localhost:6767/api/faq \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is the NOC deadline?",
    "answer": "Submit your NOC within 5 working days of the internship start date.",
    "categoryId": "<category-object-id>",
    "tags": ["noc", "deadline"]
  }'
```

## Errors you'll actually see

| Status | Meaning |
|---|---|
| 400 | Validation failed — check `error` for which field |
| 401 | Missing/expired/revoked token |
| 403 | Valid token, but role doesn't allow this action |
| 404 | Resource id doesn't exist |
| 429 | Rate limited — back off and retry |
| 500 | Unhandled server error — check backend logs |

## Environment variables the backend needs

See `apps/backend/.env.example` for the full, commented list.
Minimum to run locally: `MONGODB_URI`, `JWT_SECRET`. Add
`GEMINI_API_KEY` to enable the AI features (chat widget, auto-answer,
FAQ audit). Zoom OAuth vars are only needed for the live webhook flow —
manual transcript upload works without them.