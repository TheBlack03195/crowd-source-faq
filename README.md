# Crowd Source FAQ — Phase 0: Foundation

This is the scaffolding phase: auth, JWT, middleware chain, and a working
login/register flow end-to-end. No FAQ, search, or AI features yet —
those come in later phases.

## What's in this phase

**Backend** (`apps/backend`)
- Express + TypeScript (ESM), lazy-cached MongoDB connection (`config/db.ts`)
- Full middleware chain: cors → helmet → morgan → json → rate-limit → routes → 404 → error handler
- `User` model with roles (`user`/`moderator`/`admin`), soft-delete fields, bcrypt password hashing
- `RevokedToken` model (TTL-indexed) for JWT revocation support
- `protect` + `authorize(...roles)` middleware, `adminOnly` shorthand
- Auth endpoints: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET /api/health` — reports server + DB connection status
- Zod validation middleware, per-route + global rate limiting
- One passing unit test (`__tests__/authorize.test.ts`)

**Frontend** (`apps/frontend`)
- Vite + React 19 + TypeScript + Tailwind CSS v4
- `useAuth` hook/context with the **isAuthenticated confirmation pattern**:
  guards on a confirmed `GET /auth/me` response, not just `user !== null`,
  to avoid the login-redirect race condition
- Pages: Home, Login, Register, Account (protected)
- `ProtectedRoute` wrapper, Axios instance with JWT interceptor
- Dev server proxies `/api` to the backend on port 6767

## Running it

```bash
./run.sh
```

First run prompts for `MONGODB_URI` (use a free MongoDB Atlas cluster or
local mongod) and `JWT_SECRET` (auto-generated if left blank), then saves
them to `apps/backend/.env.local`. Subsequent runs skip the prompt.

Backend: http://localhost:6767
Frontend: http://localhost:5173

## Verified in this build

- ✅ Backend type-checks clean (`tsc --noEmit`)
- ✅ Backend unit tests pass (`vitest run`)
- ✅ Backend boots and correctly attempts DB connection / fails gracefully without one
- ✅ Frontend type-checks and builds clean (`vite build`)
- ⚠️ Full live end-to-end (register → login → protected page) has **not**
  been run against a real MongoDB instance — no MongoDB was available in
  the build sandbox. Run `./run.sh` with a real `MONGODB_URI` to confirm
  the last mile yourself.

## Next: Phase 1

FAQ + Category + Batch models, plain `$text` keyword search, guest FAQ
browsing, and the FAQPage/HomePage upgrade — no AI yet.
