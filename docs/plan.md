## Ear Training MVP — Delivery Plan

This plan operationalizes the MVP described in `spec.md` and the guidance in `CLAUDE.md`. It is organized by milestones, detailed tasks, file scaffolding, acceptance criteria, testing, deployment, and risks. Target stack: Next.js 15 (App Router) + React 19 + TypeScript + Tailwind + shadcn/ui; Auth.js v5; Prisma + Neon Postgres; Tone.js; tonal.

Note: We standardized on a server-first app architecture. Server pages render shared layout (`AppLayout` + `AppHeader`), and interactive drill logic lives in client components rendered inside those pages. Sessions currently use JWT strategy for credentials compatibility; DB sessions can be adopted later if needed.

### Goals (v0)
- Functional pitch hearing in tonal context: ≥80–90% accuracy on core intervals
- Chord quality recognition across keys
- Progression recognition for: I–IV–V–I, I–V–vi–IV, ii–V–I, I–vi–IV–V
- Product success signals: fast first sound (<3s after gesture), 7‑day streaks, rising accuracy, low in‑drill drop‑offs

### Non‑Goals (MVP)
- Mic/singing assessment, notation rendering, teacher dashboards, payments, native apps

---

## Milestones & High‑Level Timeline

1) M1: Platform, Auth, DB, Dashboard shell (Week 1–2)
2) M2: Interval Drill end‑to‑end (Week 2–3)
3) M3: Chord & Progression Drills (Week 3–4)
4) M4: Adaptivity + Stats UI + optional piano samples (Week 4–5)

Parallelizable tracks: UI scaffolding, audio helpers, theory builders, infra/deploy.

---

## Work Breakdown by Milestone

### M1 — Foundation: Repo, UI system, Auth (Google + OTP; magic link out of scope), DB

Epics
- Project scaffolding and DX
- Database schema (Prisma) + Neon
- Auth.js v5 configuration (+ route handlers)
- Basic pages: marketing `/`, `/sign-in`, `/dashboard`
- Email infra (magic link + OTP mailer)

Tasks
- Initialize Next.js 14 App Router project, TS, Tailwind, shadcn/ui
  - Configure Tailwind, import base styles in `styles/globals.css`
  - Generate shadcn components: `Button`, `Card`, `ToggleGroup`, `Select`, `Progress`, `Toast`, `Dialog`
  - Linting: ESLint + Prettier + TypeScript strict; set up basic GitHub Actions (lint/typecheck)
- Prisma + Neon
  - Create `prisma/schema.prisma` per spec (Auth.js adapter models + Drill, Attempt, UserStat, OtpCode, enum DrillType)
  - Add Prisma client singleton `lib/db/prisma.ts`
  - Add `.env.example` with `DATABASE_URL` and Auth/email vars
  - `npx prisma generate`; `npx prisma db push` to Neon
- Auth.js v5
  - Root `auth.ts` exporting `{ handlers, auth, signIn, signOut }`
  - Providers: Google, Email (magic link), Credentials (OTP)
  - Adapter: `@auth/prisma-adapter` with Prisma client
  - Session strategy: database (per spec; document JWT alternative for Edge)
  - Route handler: `app/api/auth/[...nextauth]/route.ts` → export `{ GET, POST } = handlers`
  - Middleware `middleware.ts` to protect `/dashboard` (optional)
  - Callbacks: enrich `session.user.id`
- OTP endpoints
  - `POST /api/otp/request` → create hashed code with TTL 10m, throttle by email/IP
  - `POST /api/otp/verify` → validate code, mark consumed, sign in via credentials
- Email delivery
  - `lib/mail/send.ts` wrapper for Resend/Postmark/Mailgun
  - Simple HTML templates for magic link and OTP email
- Basic pages
  - `/(marketing)/page.tsx` — landing page using design tokens and marketing components (Navbar, Hero, Features, Demo, How‑it‑works, Preview, Pricing, Waitlist, FAQ, Footer) with CTAs to waitlist and sign‑in
  - `/sign-in/page.tsx` with Google and OTP flows; OTP request/verify wired
  - `/dashboard/page.tsx` shell with placeholders for streak/accuracy/links

Acceptance Criteria
- Google sign‑in works end‑to‑end
- Magic link flow delivers email and creates session
- OTP flow issues, verifies, and rate‑limits; invalid/expired/reuse handled
- Database is provisioned on Neon; Prisma client connects; adapter tables created
- `/dashboard` redirects unauthenticated users to `/sign-in`
- CI: Typecheck + lint pass on PRs
- Marketing landing page renders with light/dark support and passes Lighthouse ≥95 (Perf/Accessibility/SEO) on desktop
- Vercel build succeeds with Prisma client generation during build

### M2 — Interval Drill E2E

Epics
- Audio engine helpers (Tone.js) and unlock flow
- Theory: Interval prompt builder with tonal
- UI: Drill shell and interval answer grid
- Attempts API + server aggregation (UserStat)

Tasks
- Audio helpers `lib/audio/transport.ts`
  - `ensureAudioReady()` unlock AudioContext on first gesture
  - `playContext({ key, mode })` → tonic drone + I arpeggio
  - `playInterval({ key, interval, direction })` for asc/desc/harm
  - Node disposal/cleanup between prompts; cancel `Transport` events
- Theory `lib/theory/intervals.ts`
  - Builder returning `PromptPayload` with `interval` and `direction`
  - Utilities for correctness check and note math; limit register for clarity
- UI pages/components
  - `app/practice/intervals/page.tsx` (server wrapper) + `components/practice/IntervalsPracticeClient.tsx` (client): next/replay flow, latency timing
  - `components/DrillShell.tsx` (shared layout, key selector, play/answer controls)
  - `components/IntervalAnswerGrid.tsx` listing m2..P8 + Tritone
  - Toast feedback and correct label rendering
- Attempts API `app/api/attempts/route.ts` (POST)
  - Auth guard via `auth()`
  - Zod validation of body
  - Create `Attempt`; upsert `UserStat` with totals, streak logic, heat update
  - Return `{ id, isCorrect, totals }`
- Client `postAttempt()` helper and integration

Acceptance Criteria
- First sound plays within 3s after user gesture on modern devices
- Consecutive plays do not overlap; cleanup verified
- Interval drill: context + prompt + answer loop works; replay available
- Attempts are persisted; stats increment correctly; streak logic handles same day/yesterday/reset
- UI shows accuracy, streak, session count; immediate feedback on answer

### M3 — Chord & Progression Drills

Epics
- Theory: chord qualities + inversions, progressions P1–P4
- Audio: `playChord`, `playProgression` with compact voicings
- UI: chord and progression answer grids

Tasks
- Theory
  - `lib/theory/chords.ts`: qualities {maj, min, dim, aug}, inversion 0|1|2
  - `lib/theory/progressions.ts`: P1: I–IV–V–I; P2: I–V–vi–IV; P3: ii–V–I; P4: I–vi–IV–V; mapping to diatonic triads
  - Keep voicings compact in staff register; deterministic randomization
- Audio
  - `playChord({ key, quality, inversion })`
  - `playProgression({ key, pattern })` with simple voice‑leading
- UI
  - `app/practice/chords/page.tsx` with inversion toggle
  - Optional `app/practice/progressions/page.tsx` if separated; or include in chords page as mode
  - `ChordAnswerGrid.tsx` and progression choice grid

Acceptance Criteria
- Chord quality drill functions across multiple keys; correct answer detection
- Progression playback conveys functional movement; choices map to P1–P4
- Attempts recorded uniformly with proper `PromptPayload` kinds

### M4 — Adaptivity + Stats UI + Samples (optional)

Epics
- Client‑side adaptivity bias map
- Stats API and dashboard widgets
- Optional: piano multisamples (UIowa) lazy‑load via `Tone.Sampler`

Tasks
- Adaptivity `lib/adaptivity/bias.ts`
  - Per‑session weight map; increase on miss; decay/clear after N correct or session end
  - Weighted choice sampler integrated with prompt builders
- Stats API `app/api/stats/route.ts` (GET)
  - Returns `{ totals, intervalHeat, chordHeat, last7 }`
- Dashboard widgets `components/StatsSummary.tsx`
  - Accuracy %, streak days, last 7 days chart
- Samples (optional)
  - `lib/audio/samples.ts` mapping; lazy‑load; fallback to synth if not ready

Acceptance Criteria
- Missed items resurface more frequently within session
- Dashboard shows accurate totals and recent activity
- Optional sampler does not regress first‑sound latency; lazy loading verified

---

## Detailed Implementation Notes

### Folder Structure (App Router)
```
/app
  /api
    /auth/[...nextauth]/route.ts
    /attempts/route.ts
    /stats/route.ts
    /otp/
      request/route.ts
      verify/route.ts
  /(marketing)/page.tsx
  /sign-in/page.tsx
  /dashboard/page.tsx
  /practice/intervals/page.tsx
  /practice/chords/page.tsx

/auth.ts
/middleware.ts

/components
  /ui/*
  DrillShell.tsx
  IntervalAnswerGrid.tsx
  ChordAnswerGrid.tsx
  KeySelector.tsx
  StatsSummary.tsx
  ReactPianoInput.tsx (optional)

/lib
  /db/prisma.ts
  /auth/session.ts
  /mail/send.ts
  /audio/transport.ts
  /audio/samples.ts (optional)
  /theory/intervals.ts
  /theory/chords.ts
  /theory/progressions.ts
  /adaptivity/bias.ts
  /validators/schemas.ts
  /utils/date.ts
  /utils/rand.ts

/prisma/schema.prisma
/styles/globals.css
/public/audio/* (optional)
/types/drills.ts
.env.example
```

### Auth
- Root `auth.ts` with `NextAuth({...})` exporting `{ handlers, auth, signIn, signOut }`
- Providers: `Google`, `Credentials` (OTP)
  - Note: Magic link is out of scope for MVP and not implemented.
- Adapter: `PrismaAdapter(prisma)`
- Session: `{ strategy: "jwt" }` in current implementation for Credentials compatibility; DB sessions can be adopted later if needed.
- Route handler: `app/api/auth/[...nextauth]/route.ts` re‑exports `{ GET, POST }`
- Middleware protects `/dashboard`, `/practice/*`, and handles `/sign-in` redirect if already authenticated
- OTP
  - Issue: bcrypt hash of 6‑digit code + salt; TTL 10m; throttle issuance by email/IP; store attempts
  - Verify: lookup latest unconsumed code; check expiry/hash/attempts; mark consumed; `signIn("credentials")`
  - Emails: subject "Your login code", body "123456 (valid 10 min)"

### Database
- Models: Auth.js adapter (User, Account, Session, VerificationToken) + Drill, Attempt, UserStat, OtpCode, enum DrillType
- Indexes: per spec (`Attempt` indices on `[userId, createdAt]` and `[drillId]`)
- Streak logic: compare `lastAttemptAt` date to today; same‑day no change; yesterday +1; else reset to 1
- Heatmaps: compact JSON `{ [itemKey]: { seen, miss } }`

### API Contracts
- `POST /api/otp/request` → `{ ok: true }` (always) — never disclose existence
- `POST /api/otp/verify` → `{ ok: true }` and sets session
- `POST /api/attempts` → `{ id, isCorrect, totals: { totalAttempts, correctAttempts, streakDays } }`
- `GET /api/stats` → `{ totals, intervalHeat, chordHeat, last7 }`
- Validate request bodies with Zod (`lib/validators/schemas.ts`)

### Audio Engine (Tone.js)
- Use `Tone.Transport` for timing; `Tone.now()` for scheduling
- Ensure unlock on first user gesture (`ensureAudioReady()`)
- Provide cleanup guards and cancel scheduled events between questions
- Start with small synths; expose `Sampler` wiring for optional samples

### Theory Builders (tonal)
- Intervals: choose from m2..P8 (+ Tritone), direction asc/desc/harm; constrain octave
- Chords: maj/min/dim/aug; optional inversion 0|1|2
- Progressions: P1–P4; diatonic triads; keep voicings compact
- Return `PromptPayload` union with stable fields

### Adaptivity (v0‑lite)
- In‑memory bias map per session keyed by item (e.g., interval string)
- Increase weight on miss; decay/reset after N correct or on session end
- Server heatmaps reflect misses for long‑term stats

### UI/UX
- Drill screen: key selector, mode (major), toggles (Asc/Desc/Harm, Inversions), Play + Answer grids
- Feedback: toast for correct/try again; show correct label; replay
- Footer metrics: accuracy %, streak, session count
- Loading & disabled states for audio unlock and network calls
- Header/navigation: `AppHeader` is a Server Component guarded with `server-only`; `AppLayout` renders it server-side while practice pages render client children for interactivity.

---

## Testing & Quality

Unit
- Theory builders: interval semitone math; progression resolution; chord quality correctness
- Utility functions: date diff for streaks; weighted sampler

Integration
- API route handlers: attempts creation + stats upsert; OTP issue/verify + throttling
- Auth callbacks attach `user.id` to session

- E2E (Playwright)
- Sign‑in flows (Google mocked), OTP happy/edge cases
- Interval drill loop: context → prompt → answer → store attempt → feedback → next

Manual QA (Audio)
- Autoplay unlock on first gesture (desktop + mobile)
- Consecutive plays do not overlap; replay works
- First sound latency budget < 3s from gesture

Tooling
- Scripts: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run e2e`
- CI: run typecheck/lint/unit; optional e2e on protected branches

---

## Deployment & Environments

Environments
- Local: `.env` with `DATABASE_URL`, `AUTH_SECRET`, Google keys, email provider keys
- Staging: Vercel preview + Neon branch; seeded admin/test users
- Production: Vercel + Neon prod

Steps
1. Create Neon project and database; set `sslmode=require`
2. Configure Vercel project; set env vars (AUTH_*, DATABASE_URL, email provider)
3. Deploy main; run `prisma db push` (or migrations flow) against Neon
4. Verify route handlers and auth callback URLs

Operational Notes
- Log auth and OTP events (rate‑limit triggers, failures)
- Set `AUTH_TRUST_HOST=true` behind proxy
- Add basic CSP and CORS defaults

---

## Estimates (rough)
- M1: 4–6 dev‑days
- M2: 3–4 dev‑days
- M3: 4–5 dev‑days
- M4: 3–4 dev‑days

---

## Risks & Mitigations
- Audio autoplay restrictions on mobile → strict unlock pattern; test across iOS/Android
- First‑sound latency with samples → default to synth; lazy‑load samples post‑first‑sound
- OTP deliverability → use reputable provider; add cooldowns; never disclose account existence
- Schema drift / adapter expectations → keep adapter schema exact; run `prisma generate` on changes
- Edge compatibility vs DB sessions → default DB sessions; consider JWT if moving to edge middleware heavy usage

---

## Definition of Done (MVP)
- All three auth methods operational; OTP rate‑limited and safe
- Intervals, Chords, Progressions drills playable with tonal context; correct answer checking
- Attempts persisted; UserStat aggregates updated; streak logic correct
- Adaptivity bias influences next item selection; stats UI reflects progress
- First sound consistently <3s from gesture; no overlapping audio between questions
- Deployed to production with environment configuration and basic monitoring

---

## Task Checklist (condensed)

- [x] Init repo, Next.js, Tailwind, shadcn/ui, ESLint/Prettier
- [x] Prisma schema + Neon; `prisma db push` (local SQLite for dev; Neon for prod later)
- [x] `auth.ts` + route handlers; providers configured (Google + OTP; magic link deferred)
- [x] OTP endpoints + emails + throttling
- [x] Marketing, Sign‑in, Dashboard shells
- [x] Audio helpers (ensureAudioReady, playContext, playInterval, cleanup)
- [x] Interval theory builder + UI (client) — Attempts API integration pending
- [ ] Chord + Progression theory & audio; UI grids
- [ ] Adaptivity bias + integration
- [ ] Stats API + dashboard widgets
- [ ] Optional piano samples (lazy)
- [ ] Unit/integration/E2E tests; CI green
- [ ] Deploy staging → prod


