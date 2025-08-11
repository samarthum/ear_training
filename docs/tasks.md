### Ear Training MVP — Tasks (Sequential, Efficient, Agent-Friendly)

Follow these checklists in order. Each section is designed to be independently completable and to minimize rework. Files and routes are named to match `spec.md` and `plan.md`.

Execution rules
- Prefer small, frequent commits scoped to a section below
- Keep TS strict; fix lint/type errors before moving on
- Only import Tone.js in client components
- Never disclose whether an email exists in OTP/magic-link flows

---

### 0) Repo Bootstrap & Tooling
- [x] Initialize Next.js 14 App Router project with TypeScript
  - [x] Create project (App Router); ensure `src/` not used unless you prefer it consistently
  - [x] Set `strict: true` in `tsconfig.json`
- [x] Add core dependencies
  - [x] `next`, `react`, `react-dom`, `next-auth`, `@auth/prisma-adapter`
  - [x] `prisma`, `@prisma/client`
  - [x] `zod`
  - [x] `tone`, `tonal`
  - [x] `tailwindcss`, `postcss`, `autoprefixer`
  - [x] `class-variance-authority`, `tailwind-merge` (for shadcn)
  - [x] `lucide-react` (icons)
- [x] Add dev dependencies
  - [x] `typescript`, `eslint`, `eslint-config-next`, `prettier`
- [x] Tailwind setup
  - [x] `tailwind.config` content points to `app/**/*.{ts,tsx}`, `components/**/*.{ts,tsx}`, `lib/**/*.{ts,tsx}`
  - [x] Create `styles/globals.css` with Tailwind base/components/utilities imports
  - [x] Wire `globals.css` in root layout
- [x] shadcn/ui setup ✅ **COMPLETED**
  - [x] Added minimal shadcn-style `Button` and `cn` util; installed `@radix-ui/react-slot`, `tailwindcss-animate`
  - [x] Generate additional components: `Card`, `ToggleGroup`, `Select`, `Progress`, `Dialog`, `Toast` ✅ **COMPLETED via CLI**
  - [x] Note: CLI `npx shadcn@latest add` now working with Tailwind v4! All components installed successfully.
- [x] Linting/formatting
  - [x] Configure ESLint + Prettier; add scripts: `lint`, `typecheck`, `format`
- [x] Basic repository hygiene
  - [x] `.gitignore` covers `.env*`, `.next`, `node_modules`
  - [ ] Add `README.md` with run instructions

---

### 1) Environment & Secrets
- [x] Create `.env.local` with essential variables ✅ **COMPLETED**
  - [x] `DATABASE_URL="file:./dev.db"` (SQLite for local development)
  - [x] `AUTH_SECRET=` (auto-generated via `npx auth secret`)
  - [x] `EMAIL_FROM` optional; defaults to `onboarding@resend.dev` if not set
  - [x] Google OAuth env present: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (also supports `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`)
  - [x] Resend API key present for OTP email delivery: `RESEND_API_KEY` (also supports `AUTH_RESEND_KEY`)
- [x] Generate `AUTH_SECRET` locally ✅ **COMPLETED**
- [x] Set up working environment file ✅ **COMPLETED**
  - **Note**: Using SQLite for local dev, change to PostgreSQL for production

---

### 2) Database (Prisma + Neon)
- [x] Local SQLite database setup ✅ **COMPLETED** (switch to Neon for production)
- [x] Implement `prisma/schema.prisma` exactly per `spec.md`
  - [x] Auth models: `User`, `Account`, `Session`, `VerificationToken`
  - [x] App models: `Drill`, `Attempt`, `UserStat`, `OtpCode`
  - [x] Enum: `DrillType`
- [x] Add Prisma client singleton `lib/db/prisma.ts`
- [x] Run `prisma generate` and `prisma db push` ✅ **COMPLETED**
  - **Note**: Schema configured for SQLite locally, tables created successfully
- [ ] Optional: Seed default drills in `prisma/seed.ts`
  - [ ] Create three drills: Intervals, Chords, Progressions with sensible `config`

---

### 3) Auth.js v5 Foundation ✅ **COMPLETED**
- [x] Create root `auth.ts`
  - [x] Export `{ handlers, auth, signIn, signOut }`
  - [x] Configure `PrismaAdapter(prisma)`
- [x] Providers: `Google`, `Credentials` (OTP) — magic link removed by scope decision
  - [x] `session: { strategy: "jwt" }` ⚠️ **IMPORTANT**: Changed to JWT for Credentials compatibility
  - [x] `callbacks` enrich `session.user.id` with proper JWT/session handling
- [x] Route handler `app/api/auth/[...nextauth]/route.ts`
  - [x] `export const { GET, POST } = handlers`
- [x] Middleware `middleware.ts` implemented
  - [x] Protect `/dashboard` and `/practice/*`
- [x] Test: OTP sign-in flow working ✅ (email delivery via Resend if configured, else console fallback)
  - **Note**: Google OAuth now configured via env

---

### 4) Email Delivery & OTP ✅ **COMPLETED**
- [x] Console logging for OTP codes (production needs actual email service)
- [ ] Magic link email template — out of scope (magic link removed)
- [x] OTP system fully implemented ✅ **TESTED**
- [x] Implement `POST /api/otp/request`
  - [x] Validate `{ email }` via Zod (never disclose existence)
  - [x] Throttle: deny if unexpired code exists for email
  - [x] Generate 6-digit code; `bcrypt.hash(code)`; store `OtpCode` with TTL 10m
- [x] Email sending via Resend when `RESEND_API_KEY` present; fallback to console logging otherwise
  - [x] `EMAIL_FROM` defaults to `onboarding@resend.dev`; for production, verify domain and use `login@yourdomain.com`
  - [x] Return `{ ok: true }`
- [x] Implement `POST /api/otp/verify`
  - [x] Validate `{ email, code }`
  - [x] Lookup latest unconsumed `OtpCode`; verify expiry/hash/attempts
  - [x] Mark consumed; call `signIn("credentials")` server-side
  - [x] Proper error handling and user creation
- [x] `/sign-in/page.tsx` ✅ **TESTED**
  - [x] Three auth methods: Google | Magic Link | OTP
  - [x] All forms properly wired to endpoints
  - **Note**: OTP flow verified working end-to-end!

---

### 5) Base Pages & Layout
- [ ] `/(marketing)/page.tsx` with CTA → `/sign-in`
- [x] `/dashboard/page.tsx` shell
  - [ ] Shows placeholders for accuracy, streak, last 7 days, links to drills
- [x] Root layout includes Tailwind CSS

---

### 6) Types & Validators
- [x] `/types/drills.ts` defines `PromptPayload` union and enums per `spec.md`
  - [x] Added `IntervalPrompt` type and narrowed interval drill types end-to-end
- [ ] `lib/validators/schemas.ts` (Zod)
  - [ ] Schemas for OTP request/verify
  - [ ] Schema for Attempts POST body

---

### 7) Audio Engine (Tone.js) ✅ **COMPLETED FOR INTERVALS**
// Intervals fully working; chords/progressions pending
- [x] `lib/audio/transport.ts` ✅ **FIXED & WORKING**
  - [x] `ensureAudioReady()` — unlock on first gesture
  - [x] `playContext({ key, mode })` — brief tonic reference (simplified from arpeggio)
  - [x] `playInterval({ key, interval, direction })` — asc/desc/harm (fixed Tone.js v15.1.22 API)
  - [ ] `playChord({ key, quality, inversion })`
  - [ ] `playProgression({ key, pattern })`
  - [x] Cleanup: proper timing & disposal to prevent conflicts
- [x] Guard imports: Tone.js properly imported in client components
  - **Note**: Upgraded Tone.js from v14.9.17 to v15.1.22 to fix API issues

---

### 8) Theory Builders (tonal)
- [x] `lib/theory/intervals.ts` ✅ **COMPLETED**
  - [x] Choose interval from allowed set; direction asc/desc/harm ✅ **RANDOMIZED**
  - [x] Randomized key selection (C, D, E, F, G, A, B) ✅ **ADDED**
  - [x] Return proper `PromptPayload` with interval in tonal format
  - [x] `isCorrectInterval()` helper ✅ **WORKING**
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

### 10) Interval Drill (UI + Flow) ✅ **MOSTLY COMPLETED**
- [ ] `components/KeySelector.tsx` (not needed yet - using random keys)
- [x] Interval answer grid inline (m2..P8 incl. tritone) ✅ **WORKING**
- [ ] `components/DrillShell.tsx` shared layout (can be extracted later)
- [x] `app/practice/intervals/page.tsx` (client) ✅ **FULLY FUNCTIONAL**
  - [x] Audio unlock on first user gesture (not on mount) ✅ **FIXED**
  - [x] `onNext()`: build prompt → play context → play interval → set pending ✅ **WORKING**
  - [x] `onAnswer(choice)`: compute correctness → feedback → auto-advance on correct ✅ **WORKING**
  - [x] Replay functionality ✅ **WORKING**
  - [x] Proper loading states and disabled buttons during playback
  - [ ] POST attempt to API (not implemented yet)
  - [ ] Display real user stats (accuracy, streak, session count)
- [x] Verified: first sound <3s after gesture; no overlap; proper feedback ✅ **WORKING**

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
- [x] Install deps: `npm install` ✅
- [x] Dev server: `npm run dev` ✅ (runs on port 3002 if 3000 occupied)
- [x] Prisma: `npx prisma generate` | `npx prisma db push` | `npx prisma studio` ✅
- [x] Lint/type: `npm run lint` | `npm run typecheck` ✅
- [x] Auth secret: `npx auth secret` ✅ (already generated)

**Current Status**: Core interval training is fully functional! Audio engine working with Tone.js v15.1.22. Users can practice interval recognition with proper tonal context, randomized keys/intervals, immediate feedback, and replay functionality.

---

- [x] ✅ Google + OTP operational with safe throttling (magic link removed by scope)
- [x] ✅ **Intervals playable with tonal context and correct checks** (**NEW - COMPLETED**)
- [ ] Chords, Progressions playable with tonal context and correct checks  
- [ ] Attempts persisted; `UserStat` totals, streak, heatmaps accurate
- [ ] Adaptivity bias influences next item; Stats UI reflects progress
- [x] ✅ **First sound consistently <3s after gesture; no overlapping audio** (**NEW - COMPLETED**)
- [ ] Deployed to production; basic monitoring in place

**✅ MAJOR MILESTONES COMPLETED**: 
- Authentication system is fully operational! ✅
- shadcn/ui components setup completed via CLI ✅
- **Audio engine fully functional for intervals!** ✅ **NEW**
- **Interval drill working end-to-end!** ✅ **NEW**

**Current Status**: Core interval training is working! Users can:
- Practice interval recognition with proper tonal context
- Hear randomized keys and intervals (asc/desc/harmonic)
- Get immediate feedback and auto-advance
- Replay intervals as needed

**Next Priority**: Attempts API implementation for progress tracking


