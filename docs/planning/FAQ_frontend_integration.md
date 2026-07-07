> Original planning document — some details differ from the final
> implementation. See the root [README.md](../../README.md) and
> [docs/CHANGELOG.md](../CHANGELOG.md) for what was actually built.

# Frontend Integration Guide

How the React app is wired to the backend, and the conventions to
follow when adding a new page or feature.

## Stack

React 19 + TypeScript, Vite, React Router 7, Tailwind CSS 4, Axios.
No global state library — auth is the only cross-cutting state, and
it lives in a single context (`useAuth`).

## Talking to the API — `src/utils/api.ts`

A single shared Axios instance:

```ts
import { api } from '../utils/api';

const { data } = await api.get('/community/posts');
await api.post('/community/posts', { title, body, categoryId });
```

- Base URL comes from `VITE_API_URL` (defaults to `/api`, which works
  with the Vite dev-server proxy configured in `vite.config.ts` —
  pointing at `VITE_API_PROXY_TARGET`, default `http://localhost:6767`).
- A request interceptor attaches `Authorization: Bearer <token>`
  automatically from `localStorage` — you never set that header
  manually.
- A response interceptor clears the stored token on any `401` — pages
  don't need to handle "expired token" as a special case, just let the
  request fail and check `isAuthenticated` from `useAuth` afterward.

**Do not** create additional Axios instances or call `fetch` directly
against the backend — everything should go through this one instance
so the auth header and 401-handling stay consistent.

## Auth — `src/hooks/useAuth.tsx`

```tsx
import { useAuth } from '../hooks/useAuth';

function MyPage() {
  const { user, isAuthenticated, isLoading, login, register, logout } = useAuth();
  // ...
}
```

Important: guard on **`isAuthenticated`**, not `user !== null`. `user`
can be briefly `null` while the initial `GET /auth/me` session-confirm
call is in flight on page load — checking `user` directly causes a
flash-redirect-to-login on refresh. `isLoading` is `true` until that
confirm call resolves one way or the other.

## Protected routes — `src/components/ui/ProtectedRoute.tsx`

Wrap any route that requires login:

```tsx
<Route path="/support" element={<ProtectedRoute><SupportPage /></ProtectedRoute>} />
```

Admin/mod-only pages additionally use `src/admin/components/AdminRoute.tsx`
+ `AdminLayout.tsx` for the sidebar shell — see any existing
`/admin/*` route in `App.tsx` for the pattern.

## Adding a new page

1. Create the component in `src/pages/` (or `src/admin/pages/` for an
   admin page).
2. Register the route in `App.tsx`, wrapped in `<ProtectedRoute>` /
   `<AdminRoute><AdminLayout>` if it needs auth.
3. Add a nav entry in `src/components/ui/Navbar.tsx` (or the `links`
   array in `src/admin/components/AdminLayout.tsx` for admin pages).
4. Fetch data with the shared `api` instance inside a `useEffect`;
   follow the existing `loading` / `.finally(() => setLoading(false))`
   pattern used across `src/pages/*.tsx`.

## Shared types — `src/utils/types.ts`

Every shape returned by the API that's used in more than one component
(`Faq`, `Category`, `CommunityPost`, `Comment`, `ChatMessage`, ...)
lives here. Add new shared types here rather than redefining an
interface locally in a page/component file — several existing
components (`AdminSupport.tsx`, some admin pages) define their own
narrow local interfaces instead, which is fine for a shape used in
exactly one place, but anything reused should go in `types.ts`.

## Styling

Tailwind CSS 4 utility classes directly in JSX, no CSS modules or
styled-components. Palette in use: `emerald` (primary actions),
`slate` (neutral text/borders), `amber`/`red` (warnings/moderation),
`indigo`/`purple` (the Voice page's dark theme only — kept local to
that page, not part of the global palette).

## Known conventions worth following (not yet enforced by lint)

- Confirm destructive actions with `confirm()` before firing the
  request (see the report/take-down buttons in `PostDetailPage.tsx`)
  — not elegant, but consistent with the rest of the app; don't
  introduce a different pattern (toast library, custom modal) in just
  one new component.
- Keep page-level fetch logic simple and inline (`useEffect` + `api.get`)
  rather than introducing a data-fetching library — the app has no
  React Query/SWR dependency, and adding one for a single page would be
  inconsistent with everything else.