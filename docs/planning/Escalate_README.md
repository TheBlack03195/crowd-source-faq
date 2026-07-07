> Original planning document — some details differ from the final
> implementation. See the root [README.md](../../README.md) and
> [docs/CHANGELOG.md](../CHANGELOG.md) for what was actually built.

# Escalation (Golden Ticket)

A way for a student to jump their own support ticket to the front of
the queue when it's genuinely urgent, by spending points instead of
just asking nicely.

## The currency: Spurti Points (SP)

- Every user starts with `User.sp = 100`.
- Admins can top up a user's balance:
  `POST /api/support/golden/award` (admin only,
  `{ userId, amount }`) — e.g. as a reward for a particularly helpful
  community answer. There's no automatic SP-earning event wired up yet
  (see "Known gaps" below) — awarding is manual.

## Escalating a ticket

1. Create a normal support ticket first (`POST /api/support`) — Golden
   Ticket escalates an *existing* ticket, it doesn't create one.
2. `POST /api/support/golden/:requestId` with `{ spAmount }`.
3. Server-side checks, in order:
   - `spAmount` must be a positive number
   - **Cooldown**: if `lastGoldenSubmissionAt` + `goldenCooldownHours`
     (admin-configurable, `/admin/settings`, default 48h) hasn't
     elapsed yet → `429` with hours remaining. This is the **only**
     rate limit — there's no separate per-day or per-week cap beyond
     the cooldown itself.
   - User must have `sp >= spAmount`.
   - The ticket must belong to the requesting user (can't escalate
     someone else's ticket) and must not already be escalated.
4. On success: `SupportRequest.isGolden = true`,
   `SupportRequest.spSpent = spAmount`, the user's `sp` balance is
   debited, and `lastGoldenSubmissionAt` is stamped (starting the next
   cooldown window).

**SP is spent on submission, not on outcome.** There is no refund if
the ticket is later rejected — the cost is for the queue-jump itself,
not a bet on getting a favorable resolution. This is a deliberate
design choice: refunding on rejection would let users retry-until-approved
for free, which defeats the point of spending anything at all.

## The Escalation Queue

`GET /api/support/golden/queue` — every currently-open or
in-progress golden ticket, sorted by `spSpent` descending (ties broken
by oldest-first). This is the queue admins actually work from.

**Anonymization**: non-admin viewers get the queue with identity
stripped (`issueType`, `description`, `status`, `spSpent`, `createdAt`
only — no `userId`/name). Admins/mods see the full document including
who filed it. This lets any student see "how much SP is it currently
taking to get to the front of the line" without seeing who's ahead of
them.

## Checking your own balance

`GET /api/support/golden/balance` — returns `{ sp, cooldownRemainingMs }`
for the logged-in user. The frontend (`GoldenTicketPage.tsx`) uses this
to disable the escalate button and show a countdown while on cooldown.

## Known gaps

- **No automatic SP-earning events.** The plan was for SP to be
  earned organically (helpful answers, resolved tickets, etc.), but
  only the manual admin `award` endpoint exists right now — SP is
  effectively a fixed starting budget unless an admin tops it up.
- **No SP cost guidance in the UI.** A user can submit any positive
  `spAmount`; nothing suggests what a "reasonable" escalation spend is
  relative to the current queue, so users are guessing at how much to
  spend to actually jump ahead of others.
- **Cooldown is global, not queue-position-aware.** Even if the queue
  is empty and a ticket would be seen immediately anyway, the same
  cooldown applies — there's no "skip the cooldown if nothing is
  contending for priority" logic.