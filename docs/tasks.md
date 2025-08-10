### Ear Training MVP — Tasks (Sequential, Efficient, Agent-Friendly)

Follow these checklists in order. Each section is designed to be independently completable and to minimize rework. Files and routes are named to match `spec.md` and `plan.md`.

Execution rules
- Prefer small, frequent commits scoped to a section below
- Keep TS strict; fix lint/type errors before moving on
- Only import Tone.js in client components
- Never disclose whether an email exists in OTP/magic-link flows

---

### 0) Repo Bootstrap & Tooling
- [ ] Initialize Next.js 14 App Router project with TypeScript
  - [ ] Create project (App Router); ensure `src/` not used unless you prefer it consistently
  - [ ] Set `strict: true` in `tsconfig.json`
- [ ] Add core dependencies
  - [ ] `next`, `react`, `react-dom`, `next-auth`, `@auth/prisma-adapter`
  - [ ] `prisma`, `@prisma/client`
  - [ ] `zod`
  - [ ] `tone`, `tonal`
  - [ ] `tailwindcss`, `postcss`, `autoprefixer`
  - [ ] `class-variance-authority`, `tailwind-merge` (for shadcn)
  - [ ] `lucide-react` (icons)
- [ ] Add dev dependencies
  - [ ] `typescript`, `eslint`, `eslint-config-next`, `prettier`
- [ ] Tailwind setup
  - [ ] `tailwind.config` content points to `app/**/*.{ts,tsx}`, `components/**/*.{ts,tsx}`, `lib/**/*.{ts,tsx}`
  - [ ] Create `styles/globals.css` with Tailwind base/components/utilities imports
  - [ ] Wire `globals.css` in root layout
- [ ] shadcn/ui setup
  - [ ] Install shadcn CLI; initialize
  - [ ] Generate components: `Button`, `Card`, `ToggleGroup`, `Select`, `Progress`, `Dialog`, `Toast`
- [ ] Linting/formatting
  - [ ] Configure ESLint + Prettier; add scripts: `lint`, `typecheck`, `format`
- [ ] Basic repository hygiene
  - [ ] `.gitignore` covers `.env*`, `.next`, `node_modules`
  - [ ] Add `README.md` with run instructions

---

### 1) Environment & Secrets
- [ ] Create `.env.example`
  - [ ] `DATABASE_URL=`
  - [ ] `AUTH_SECRET=`
  - [ ] `GOOGLE_CLIENT_ID=`
  - [ ] `GOOGLE_CLIENT_SECRET=`
  - [ ] `EMAIL_SERVER=` (for magic link SMTP) and/or provider keys (Resend/Postmark/Mailgun)
  - [ ] `EMAIL_FROM=`
- [ ] Generate `AUTH_SECRET` locally and document in README
- [ ] Copy `.env.example` → `.env` (local)

---

### 2) Database (Prisma + Neon)
- [ ] Create Neon project/database; enable `sslmode=require`
- [ ] Implement `prisma/schema.prisma` exactly per `spec.md`
  - [ ] Auth models: `User`, `Account`, `Session`, `VerificationToken`
  - [ ] App models: `Drill`, `Attempt`, `UserStat`, `OtpCode`
  - [ ] Enum: `DrillType`
- [ ] Add Prisma client singleton `lib/db/prisma.ts`
- [ ] Run `prisma generate` and `prisma db push`
- [ ] Optional: Seed default drills in `prisma/seed.ts`
  - [ ] Create three drills: Intervals, Chords, Progressions with sensible `config`

---

### 3) Auth.js v5 Foundation
- [ ] Create root `auth.ts`
  - [ ] Export `{ handlers, auth, signIn, signOut }`
  - [ ] Configure `PrismaAdapter(prisma)`
  - [ ] Providers: `Google`, `Email` (magic link), `Credentials` (OTP)
  - [ ] `session: { strategy: "database" }`
  - [ ] `callbacks` enrich `session.user.id`
- [ ] Route handler `app/api/auth/[...nextauth]/route.ts`
  - [ ] `export const { GET, POST } = handlers`
- [ ] Optional middleware `middleware.ts`
  - [ ] Protect `/dashboard` (and optionally `/practice/*`)
- [ ] Test: Google sign-in flow reaches dashboard (UI stub ok)

---

### 4) Email Delivery & OTP
- [ ] `lib/mail/send.ts` generic sender (choose one: Resend/Postmark/Mailgun/SMTP)
- [ ] Magic link email template (minimal)
- [ ] OTP email template: subject "Your login code", body `123456 (valid 10 min)`
- [ ] Implement `POST /api/otp/request`
  - [ ] Validate `{ email }` via Zod (never disclose existence)
  - [ ] Throttle: deny if unexpired code exists for email; optional per-IP throttle
  - [ ] Generate 6-digit code; `bcrypt.hash(code + salt)`; store `OtpCode` with TTL 10m
  - [ ] Send email
  - [ ] Return `{ ok: true }`
- [ ] Implement `POST /api/otp/verify`
  - [ ] Validate `{ email, code }`
  - [ ] Lookup latest unconsumed `OtpCode` for email; check expiry/hash/attempts
  - [ ] Mark consumed; call `signIn("credentials")` server-side; return `{ ok: true }`
- [ ] `/sign-in/page.tsx`
  - [ ] Tabs: Google | Magic Link | OTP; wire forms to endpoints

---

### 5) Base Pages & Layout
- [ ] `/(marketing)/page.tsx` with CTA → `/sign-in`
- [ ] `/dashboard/page.tsx` shell
  - [ ] Shows placeholders for accuracy, streak, last 7 days, links to drills
- [ ] Root layout includes Tailwind CSS and Toaster provider

---

### 6) Types & Validators
- [ ] `/types/drills.ts` defines `PromptPayload` union and enums per `spec.md`
- [ ] `lib/validators/schemas.ts` (Zod)
  - [ ] Schemas for OTP request/verify
  - [ ] Schema for Attempts POST body

---

### 7) Audio Engine (Tone.js)
- [ ] `lib/audio/transport.ts`
  - [ ] `ensureAudioReady()` — unlock on first gesture
  - [ ] `playContext({ key, mode })` — tonic drone + I arpeggio
  - [ ] `playInterval({ key, interval, direction })` — asc/desc/harm
  - [ ] `playChord({ key, quality, inversion })`
  - [ ] `playProgression({ key, pattern })`
  - [ ] Cleanup: dispose nodes and cancel scheduled events between prompts
- [ ] Guard imports: Only used in client components; dynamic import if needed

---

### 8) Theory Builders (tonal)
- [ ] `lib/theory/intervals.ts`
  - [ ] Choose interval from allowed set; direction asc/desc/harm
  - [ ] Constrain register for clarity; return `PromptPayload`
  - [ ] `isCorrectInterval()` helper
- [ ] `lib/theory/chords.ts`
  - [ ] Qualities {maj, min, dim, aug}; inversion 0|1|2; return payload
- [ ] `lib/theory/progressions.ts`
  - [ ] P1: I–IV–V–I; P2: I–V–vi–IV; P3: ii–V–I; P4: I–vi–IV–V
  - [ ] Map to diatonic triads; keep voicings compact

---

### 9) Attempts API (Storage + Aggregation)
- [ ] `app/api/attempts/route.ts` (POST)
  - [ ] Auth via `auth()`; 401 if missing
  - [ ] Zod-validate body `{ drillId, prompt, answer, isCorrect, latencyMs }`
  - [ ] Create `Attempt`
  - [ ] Upsert `UserStat`: totals, correct, `lastAttemptAt`, heatmaps
  - [ ] Streak logic: same day = keep; yesterday = +1; else reset=1
  - [ ] Return `{ id, isCorrect, totals }`

---

### 10) Interval Drill (UI + Flow)
- [ ] `components/KeySelector.tsx`
- [ ] `components/IntervalAnswerGrid.tsx` (m2..P8 incl. tritone)
- [ ] `components/DrillShell.tsx` shared layout: Play/Replay, feedback, footer stats
- [ ] `app/practice/intervals/page.tsx` (client)
  - [ ] `useEffect(ensureAudioReady)` on mount
  - [ ] `onNext()`: build prompt → play context → play interval → set pending
  - [ ] `onAnswer(choice)`: compute correctness → feedback → POST attempt → update adaptivity → `onNext()`
  - [ ] Render accuracy, streak, session count
- [ ] Verify: first sound <3s after gesture; no overlap; toast feedback

---

### 11) Chord Drill
- [ ] `components/ChordAnswerGrid.tsx` (Maj/Min/Dim/Aug)
- [ ] Extend `DrillShell` to toggle inversions
- [ ] `app/practice/chords/page.tsx`
  - [ ] Build chord prompt; play context + chord; answer → POST attempt
- [ ] Verify multiple keys and inversion toggle

---

### 12) Progression Drill
- [ ] Progression choices grid (P1–P4)
- [ ] Either separate page `app/practice/progressions/page.tsx` or a mode on chords page
- [ ] Use `playProgression` with simple voice-leading
- [ ] Answer selection → POST attempt

---

### 13) Adaptivity (v0-lite)
- [ ] `lib/adaptivity/bias.ts`
  - [ ] Per-session weight map keyed by item
  - [ ] Increase on miss; decay/reset after N correct or at session end
  - [ ] Weighted choice sampler integrated in prompt selection
- [ ] Integrate in Interval/Chord/Progression `onNext()` flows

---

### 14) Stats API + Dashboard Widgets
- [ ] `app/api/stats/route.ts` (GET)
  - [ ] Auth guard
  - [ ] Return `{ totals, intervalHeat, chordHeat, last7 }`
  - [ ] Compute `last7` with day buckets from `Attempt`
- [ ] `components/StatsSummary.tsx` (accuracy %, streak, last 7 days)
- [ ] Wire `/dashboard/page.tsx` to API and render widgets

---

### 15) Optional: Piano Samples (Sampler)
- [ ] `lib/audio/samples.ts` mapping (UIowa)
- [ ] Lazy-load `Tone.Sampler` after first-sound achieved
- [ ] Fallback to synth if sampler not ready
- [ ] Verify no regression to <3s first-sound requirement

---

### 16) UX Polish & Defaults
- [ ] Defaults: Key = C major; Interval set m2..P8; Chords = Maj/Min/Dim/Aug; Progressions = P1–P4
- [ ] Confetti on streak milestones (subtle)
- [ ] Loading/disabled states on buttons during playback and network calls
- [ ] Accessible labels and focus states (shadcn defaults + Tailwind)

---

### 17) Testing (Unit, Integration, E2E)
- [ ] Unit tests
  - [ ] Interval math and correctness checks
  - [ ] Progression mapping to chords
  - [ ] Streak calculation util
  - [ ] Weighted sampler
- [ ] Integration tests
  - [ ] OTP issue/verify: success, expired, wrong code, reuse, throttle
  - [ ] Attempts API: create attempt, update stats, heatmap increments
  - [ ] Stats API: returns totals and last7 buckets
- [ ] E2E (Playwright or Cypress)
  - [ ] Sign-in (mock Google), magic link stub, OTP flows
  - [ ] Interval drill loop end-to-end
  - [ ] Chord/progression drill basic loops
- [ ] CI
  - [ ] GitHub Actions: run `typecheck`, `lint`, unit tests; optional e2e on protected branches

---

### 18) Deployment (Vercel + Neon)
- [ ] Create Vercel project; connect repo
- [ ] Set env vars: `DATABASE_URL`, `AUTH_*`, email provider, `AUTH_TRUST_HOST=true`
- [ ] Deploy preview; verify auth callbacks and route handlers
- [ ] Run `prisma db push` against Neon prod
- [ ] Smoke test: sign-in paths, drills, attempts persistence, stats

---

### 19) Post-Deploy Ops & Risk Mitigation
- [ ] Add structured logging for OTP requests/verifications and Attempts API
- [ ] Add basic error boundaries and toasts for network/audio errors
- [ ] Monitor first-sound latency; fall back to synth when sampler delays
- [ ] Recheck OTP throttle thresholds; verify no disclosure of account existence

---

### Quick Command Reference (for agent convenience)
- [ ] Install deps: `npm install`
- [ ] Dev server: `npm run dev`
- [ ] Prisma: `npx prisma generate` | `npx prisma db push` | `npx prisma studio`
- [ ] Lint/type: `npm run lint` | `npm run typecheck`
- [ ] Auth secret: `npx auth secret`

---

### Definition of Done (MVP)
- [ ] Google, Magic Link, OTP all operational with safe throttling
- [ ] Intervals, Chords, Progressions playable with tonal context and correct checks
- [ ] Attempts persisted; `UserStat` totals, streak, heatmaps accurate
- [ ] Adaptivity bias influences next item; Stats UI reflects progress
- [ ] First sound consistently <3s after gesture; no overlapping audio between prompts
- [ ] Deployed to production; basic monitoring in place


