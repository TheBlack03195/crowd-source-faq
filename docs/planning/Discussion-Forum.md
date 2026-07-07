> Original planning document — some details differ from the final
> implementation. See the root [README.md](../../README.md) and
> [docs/CHANGELOG.md](../CHANGELOG.md) for what was actually built.

# Discussion Forum (Community Q&A)

The community layer for anything the FAQ doesn't already answer.
Login required to post/answer/vote; browsing is public.

## Model

A **post** (`models/CommunityPost.ts`) has:
- `title`, `body`, `authorId`, `categoryId`, `tags`
- `status`: `open` → `resolved` (an answer was accepted) or `closed`
  (locked by the author or a moderator — no new comments)
- `upvotes`, `acceptedCommentId`
- `isReported` / `isTakenDown` (moderation flags)
- an embedded `comments[]` array — **comments are not a separate
  top-level collection**, they live inside their parent post document.
  Each comment has `content`, `authorId`, `isAccepted`, `upvotes`/`downvotes`,
  `isDeleted` (soft-delete), `isReported`.

## Endpoints (all under `/api/community`)

| Method + path | Auth | What it does |
|---|---|---|
| `GET /posts` | public | list posts (filterable, e.g. `?isReported=true` for admin) |
| `GET /posts/:id` | public | single post + its comments |
| `GET /posts/:id/related` | public | similar posts (for "you might also find this useful") |
| `POST /posts` | login | create a post |
| `PATCH /posts/:id` | login (author) | edit title/body/tags |
| `POST /posts/:id/vote` | login | upvote/downvote a post |
| `POST /posts/:id/resolve` | login (author) | mark resolved (separate from accepting a specific comment) |
| `POST /posts/:id/close` / `/reopen` | login (author or mod) | lock/unlock new comments |
| `POST /posts/:id/report` | login | flag for moderator review |
| `POST /posts/:id/take-down` / `/restore` | **admin/mod only** | remove/restore a post |
| `POST /posts/:postId/comments` | login | answer a post |
| `PATCH` / `DELETE .../comments/:commentId` | login (author or mod) | edit / soft-delete a comment |
| `POST .../comments/:commentId/accept` | login (post author or mod) | mark an answer accepted |
| `POST .../comments/:commentId/vote` | login | upvote/downvote a comment |
| `POST .../comments/:commentId/report` | login | flag a comment |
| `POST .../comments/:commentId/dismiss-report` | **admin/mod only** | clear a comment's report flag |
| `GET /comments/reported` | **admin/mod only** | every reported comment across all posts, for the moderation queue |
| `POST /bookmarks/:postId` | login | toggle-save a post |
| `GET /bookmarks` | login | list your saved posts |

## Reputation

Every vote/accept mutates the target user's `User.reputation` and
writes an entry to `ReputationLog` (so it's auditable, not just a
running counter). Current point values (`utils/reputation.ts`):

| Event | Points |
|---|---|
| Post upvoted | +2 (reversed: −2 if the upvote is later removed) |
| Comment upvoted | +2 (reversed: −2) |
| Answer accepted | +5 (reversed: −5 if un-accepted) |
| Content removed by a moderator | −5 |

Vote removal (un-voting) always reverses the exact amount originally
awarded — this is deliberate, to prevent reputation farming via
repeated vote/unvote cycles on the same content.

`GET /api/reputation/leaderboard` — public, top 50 by reputation.
`GET /api/reputation/history/:userId` — admin only, full event log
for one user (useful for investigating a reputation dispute).

## Moderation & reporting flow

1. Any logged-in user can report a post or a comment
   (`POST .../report`) — this only sets `isReported: true`, it does
   **not** remove the content or notify anyone in real time.
2. An admin/mod checks `/admin/community`, which lists reported posts
   (`GET /posts?isReported=true`) and reported comments
   (`GET /comments/reported`) side by side.
3. For a post: **Take down** (`isTakenDown: true`, hides it from
   normal listings) or **Dismiss report** (clears the flag, post stays
   up).
4. For a comment: **Remove** (soft-deletes it via the existing
   author/mod-permitted `DELETE` comment endpoint — there's no
   separate "take down" action for comments, deletion already covers
   it) or **Dismiss report**.
5. Removing content also applies the `content_removed` reputation
   penalty (−5) to whoever posted it.

## Known gap

Reporting has no rate limit and no dedupe — the same user can report
the same post multiple times, and there's no "you already reported
this" indicator client-side. Low risk (it's a boolean flag, not
spammable into a queue explosion) but worth hardening if abuse becomes
a real problem.