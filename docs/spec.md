# Ear Training MVP — Product & Tech Spec (v0)

## What we’re building (and why)

**Product:** A web-based, game-like **ear-training app** for beginner–intermediate musicians (Western tonal focus). It delivers fast, enjoyable practice sessions that always start with a **tonal context** (drone + I chord) and then quiz **intervals**, **triad qualities**, and a few **common chord progressions**. It uses modern learning tactics (interleaving, light adaptivity, spaced review later) to maximize learning per minute.

**Who it’s for:** Singers and instrumentalists who want practical, real-music ears—not just trivia drills.

**MVP scope:**

* **Auth:** Google + Email (magic link + OTP).
* **DB:** Neon + Prisma; store attempts and lightweight stats.
* **Drills:** Intervals (melodic up/down + harmonic), Chords (maj/min/dim/aug), Progressions (I–IV–V–I, I–V–vi–IV, ii–V–I, I–vi–IV–V).
* **Engine:** Tone.js for context + prompt playback; synth first, piano samples later.
* **UX:** Simple shadcn UI, streak + accuracy, immediate feedback, light adaptivity (resurface misses).

**Outcomes (v0 learning goals):**

* **Functional pitch hearing:** Identify core intervals **in key context** (target ≥80–90% accuracy) both melodically and harmonically.
* **Chord quality recognition:** Distinguish **maj/min/dim/aug** in multiple keys.
* **Progression recognition:** Recognize/populate answers for **I–IV–V–I**, **I–V–vi–IV**, **ii–V–I**, **I–vi–IV–V** by ear in several keys.
* **Audiation basics (seed):** After context, anticipate tonic/scale-degree tendencies (full singing/notation comes later).

**Non-goals for MVP:** mic/singing assessment, notation rendering, teacher dashboards, payments, mobile apps.

**Success signals:**

* Fast first sound (<3s after user gesture),
* Daily active practice with 7-day streaks,
* Rising accuracy over sessions (e.g., +15–20 pts from baseline on weak items),
* Low drop-offs within a drill (clear feedback, snappy pacing).


## 0) Scope & Goals

**Users (beg/intl):** Western tonal focus.
**MVP drills:**

1. **Intervals** (melodic up/down + harmonic), always with **tonal context** (drone + I arpeggio).
2. **Chords** (triad quality; root-pos + optional inversions).
3. **Progressions** (major keys; starter set: I–IV–V–I, **I–V–vi–IV**, **ii–V–I**, **I–vi–IV–V**).
   **Persistence:** auth, attempts, basic stats (streak, accuracy), light adaptivity (resurface misses).
   **No mic / notation yet** (react-piano optional).
   **No cron** (aggregate in-request).

---

## 1) Tech Stack Decisions (locked)

* **Next.js 14+ (App Router)**, **TypeScript**, **Tailwind**, **shadcn/ui**.
* **Auth:** Auth.js (**NextAuth v5**). Providers: **Google OAuth** + **Email**.

  * Built-in **Email = magic link** (passwordless). ([Auth.js][1], [NextAuth][2])
  * **Email OTP (6-digit)** via **Credentials** provider + our OTP table (hash + expiry). (Credentials supports arbitrary fields.) ([NextAuth][4], [GitHub][3])
* **DB/ORM:** **Neon Postgres + Prisma** (+ **@auth/prisma-adapter**). ([Auth.js][5], [GitHub][6])
* **Audio:** **Tone.js** (transport, scheduling, synth + Sampler).
* **Music theory/UI utils:** **tonal** (theory), **react-piano** (optional input), **VexFlow/OSMD** (deferred).

---

## 2) High-level Architecture

* **Client**: Next.js RSC + client components for drills; Tone.js runs client-side only.
* **API**: App Router **route handlers** under `/app/api/*`.
* **Auth**: `auth.ts` root config; route proxy at `/app/api/auth/[...nextauth]/route.ts` exports handlers per v5 pattern. ([GitHub][7], [NextAuth][8])
* **DB**: Prisma client (singleton), Neon `DATABASE_URL`.
* **Files/Assets**: Small built-in synth first; optional piano multisamples (UIowa MIS) lazy-loaded later.
* **State**: Attempts POSTed to API → DB; `UserStat` counters updated synchronously (no cron).

---

## 3) Data Model (Prisma)

> Includes the standard Auth.js models (from the official adapter schema) + app models. ([GitHub][6])

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ---- Auth.js / NextAuth v5 adapter models (official) ----
// (From @auth/prisma-adapter: keep field names/types)
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?

  accounts Account[]
  sessions Session[]

  // App-specific
  createdAt DateTime @default(now())
}

model Account {
  id                       String  @id @default(cuid())
  userId                   String
  type                     String
  provider                 String
  providerAccountId        String
  refresh_token            String?
  access_token             String?
  expires_at               Int?
  token_type               String?
  scope                    String?
  id_token                 String?
  session_state            String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// ---- App models ----
enum DrillType {
  INTERVAL
  CHORD
  PROGRESSION
}

model Drill {
  id        String   @id @default(cuid())
  type      DrillType
  name      String
  // JSON schema differs by type; e.g. key range, allowed items, etc.
  config    Json
  authorId  String? // future (teacher/creator)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Attempt {
  id         String   @id @default(cuid())
  userId     String
  drillId    String
  // Prompt payload stored for audit/replay:
  prompt     Json     // { key:"C", context:"I+drone", item:{...} }
  // Client metrics:
  latencyMs  Int
  // Answer & result:
  answer     Json     // { selection:"m3" } or { chord:"min" } etc.
  isCorrect  Boolean
  createdAt  DateTime @default(now())

  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  drill Drill @relation(fields: [drillId], references: [id], onDelete: Cascade)

  @@index([userId, createdAt])
  @@index([drillId])
}

model UserStat {
  userId      String   @id
  // Simple aggregates to avoid cron
  totalAttempts  Int     @default(0)
  correctAttempts Int    @default(0)
  streakDays      Int    @default(0)
  lastAttemptAt   DateTime?
  // Per-domain weak spots (optional, compact)
  intervalHeat    Json?  // { "m6": {seen: n, miss: n}, ... }
  chordHeat       Json?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model OtpCode {
  // For email OTP (Credentials provider)
  id         String   @id @default(cuid())
  identifier String   // email
  codeHash   String   // hash(code + salt)
  expiresAt  DateTime
  consumedAt DateTime?
  attempts   Int      @default(0)
  ip         String?
  createdAt  DateTime @default(now())

  @@index([identifier])
}
```

---

## 4) Auth Flows

### 4.1 Providers

* **Google OAuth** (standard).
* **Email (magic link)** — built-in provider; stores verification tokens in DB; deliver via SMTP or services like Resend/Postmark/Mailgun. ([Auth.js][1])
* **Email OTP (6-digit)** — **Credentials** provider:

  * **Issue**: user enters email → request code → server creates `OtpCode` row, sends email with 6-digit code.
  * **Verify**: user submits email+code → Credentials `authorize()` loads `OtpCode`, checks hash+expiry+attempts, consumes if valid, and returns a user (create if first login).
  * Why Credentials: supports arbitrary fields like `{ email, code }`. ([NextAuth][4])

### 4.2 Files

`/auth.ts` (root):

* `NextAuth()` config with:

  * `providers: [Google, Email, Credentials(OTP)]`
  * `adapter: PrismaAdapter(prisma)`
  * `session: { strategy: "database" }` (or keep JWT; DB is fine here) ([Auth.js][9])
  * `callbacks` to enrich `session.user.id`
  * `pages` (optional) for custom sign-in / verify screens
  * `events` (optional) for logging

`/app/api/auth/[...nextauth]/route.ts`:

```ts
import { handlers } from "@/auth";
export const { GET, POST } = handlers;
```

(Per v5 handlers pattern.) ([GitHub][7])

**Email magic link templates**: minimal HTML in `lib/mail/*` (logo, button).
**OTP email**: subject “Your login code”, body “123456 (valid 10 min)”.

**Rate-limits**: throttle OTP issuance by email/IP; increment `attempts`.

---

## 5) Routes & API Contracts

### 5.1 App pages (App Router)

* `/` — marketing splash (value prop + Start button).
* `/sign-in` — choose Google / Email; tabs: **Magic Link** | **OTP Code**.
* `/dashboard` — streak, accuracy, last 7 days chart, quick links.
* `/practice/intervals` — drill page.
* `/practice/chords` — drill page (quality + progressions).

### 5.2 API (Route Handlers)

`POST /api/otp/request`

* **Body**: `{ email: string }`
* **200**: `{ ok: true }` (never disclose existence).
* **Action**: create `OtpCode` (hash), send email, TTL 10 min.

`POST /api/otp/verify`

* **Body**: `{ email: string, code: string }`
* **200**: `{ ok: true }` and set session via `signIn("credentials", ...)` on server action.

`POST /api/attempts`

* **Body**:

  ```ts
  {
    drillId: string,
    prompt: PromptPayload, // see §6
    answer: Record<string, any>,
    isCorrect: boolean,
    latencyMs: number
  }
  ```
* **Auth**: required.
* **200**: `{ id, isCorrect, totals: { totalAttempts, correctAttempts, streakDays } }`
* **Action**: create `Attempt`, update `UserStat` + heatmap keys; apply lightweight adaptivity token.

`GET /api/stats`

* **Auth**: required.
* **200**: `{ totals, intervalHeat, chordHeat, last7: Array<{d, c, t}> }`

---

## 6) Exercise Engine (client)

### 6.1 Tone context helper

`/lib/audio/transport.ts`

* `ensureAudioReady()` — resumes AudioContext on first user gesture (autoplay policies).
* `playContext({ key, mode })` — schedule tonic drone (sine/triangle) + I arpeggio (I–V–I with short delays).
* `playInterval({ key, quality, direction })` — schedule melodic/harmonic interval.
* `playChord({ key, quality, inversion })` — play triad.
* `playProgression({ key, pattern })` — e.g., I–IV–V–I or I–V–vi–IV with simple voice-leading.

**Implementation notes**

* Use **Tone.Transport**; schedule with `Transport.seconds`.
* Start with **synth** (tiny bundle); expose `Sampler` for later piano samples.
* Provide `dispose()` safeguards between questions (avoid overlapping nodes).

### 6.2 Prompt builders (theory)

`/lib/theory/*` using **tonal**:

* `chooseKey()` → C major by default, or user-selected.
* **Intervals**: pick from allowed set; compute semitones; get note names within range; decide melodic up/down or harmonic.
* **Chords**: quality in {maj, min, dim, aug}; inversion off by default.
* **Progressions (major)**:

  * P1: **I–IV–V–I**
  * P2: **I–V–vi–IV** (pop)
  * P3: **ii–V–I** (cadence)
  * P4: **I–vi–IV–V** (“’50s”)
    Each realized as diatonic triads; keep voicings compact.

Return a **PromptPayload**:

```ts
type PromptPayload =
  | { kind: "INTERVAL", key: "C", mode:"major", interval: "m3", direction:"asc" | "desc" | "harm" }
  | { kind: "CHORD", key: "G", quality: "min" | "maj" | "dim" | "aug", inversion: 0|1|2 }
  | { kind: "PROGRESSION", key: "D", steps: Array<"I"|"ii"|"IV"|"V"|"vi"> }
```

### 6.3 Adaptivity (v0-lite)

* Maintain an in-memory bias map per session (e.g., `{ "m6": weight 3 }`).
* On miss, multiply weight for that item; sampler draws next items with weighted choice.
* Reset/decay weights after N correct or on session end.
* Also reflect in `intervalHeat` / `chordHeat` server-side.

---

## 7) UI Flows & Components

### 7.1 Drill screen (shared layout)

* **Top bar**: Key selector (`C, G, D, …`), Mode (major), toggles: **Asc / Desc / Harm** (intervals), **Inversions** (chords), **Progressions** dropdown.
* **Center card**:

  * **Play** (first click → `ensureAudioReady()` + play context + prompt).
  * **Answer grid** (shadcn `Button`s):

    * Intervals: m2, M2, m3, M3, P4, Tritone, P5, m6, M6, m7, M7, P8.
    * Chords: Maj, Min, Dim, Aug.
    * Progression: choices like `I–IV–V–I`, `I–V–vi–IV`, etc.
  * **Optional** `react-piano` for interval/chord answers by playing the notes (M2, etc.).
* **Feedback**: toast (“Correct”/“Try again”), show correct label; **Replay** button.
* **Footer**: accuracy %, streak, session count.

**shadcn/ui to use**: `Card`, `Button`, `ToggleGroup`, `Select`, `Slider` (tempo later), `Progress`, `Toast`, `Dialog` (results).

---

## 8) Folder Structure (Next.js App Router)

```
/app
  /api
    /auth/[...nextauth]/route.ts      # export handlers (v5)  ← cites
    /attempts/route.ts                # POST create Attempt
    /stats/route.ts                   # GET per-user stats
    /otp
      request/route.ts                # POST request code
      verify/route.ts                 # POST verify code
  /(marketing)
    page.tsx                          # landing
  /sign-in
    page.tsx                          # custom sign-in (Google | Email tabs)
  /dashboard
    page.tsx
  /practice
    /intervals/page.tsx
    /chords/page.tsx

/auth.ts                               # NextAuth config (v5)  ← cites
/middleware.ts                         # optional protected routes

/components
  /ui/*                                # shadcn generated components
  DrillShell.tsx
  IntervalAnswerGrid.tsx
  ChordAnswerGrid.tsx
  KeySelector.tsx
  StatsSummary.tsx
  ReactPianoInput.tsx                  # optional

/lib
  /db/prisma.ts                        # prisma singleton
  /auth/session.ts                     # server helpers (auth())
  /mail/send.ts                        # common mail sender (Resend/Mailgun/Postmark)
  /audio/transport.ts                  # Tone.js helpers (ensureAudioReady, playX)
  /audio/samples.ts                    # mapping (future, lazy-loaded UIowa set)
  /theory/intervals.ts                 # prompt builders
  /theory/chords.ts
  /theory/progressions.ts
  /adaptivity/bias.ts                  # simple resurfacing weights
  /validators/schemas.ts               # zod schemas for API bodies
  /utils/date.ts, /utils/rand.ts

/prisma
  schema.prisma

/styles
  globals.css
  tailwind.css

/public
  /audio/*                              # optional samples (small set)
  /icons/*

/types
  drills.ts                             # PromptPayload, enums

.env.example
```

---

## 9) API & Server Implementation Details

### 9.1 `/app/api/attempts/route.ts` (POST)

* **Auth**: `const session = await auth(); if(!session) return 401`
* **Validate** body with zod.
* **Insert** Attempt; **upsert** `UserStat`:

  * `totalAttempts += 1`
  * `correctAttempts += isCorrect ? 1 : 0`
  * `streakDays` logic: compare `lastAttemptAt` date vs today; if same day already counted, keep; if yesterday, +1; else reset to 1.
  * Update heatmaps: increment `seen`, `miss` for item key (e.g., "m6").
* **Return** updated totals.

### 9.2 OTP endpoints

* **request**: generate 6-digit, `bcrypt.hash(code+salt)`, store with 10-min expiry; send email. Deny new code if not expired (cooldown).
* **verify**: lookup latest unconsumed code for email; check expiry/hash; mark consumed; call `signIn("credentials")` server-side to create session.

> Auth.js docs confirm: Email magic link is the built-in passwordless provider; Credentials can be used to implement custom OTP flows. ([Auth.js][1], [NextAuth][4])

---

## 10) Client Exercise Logic (pseudo)

```ts
// intervals/page.tsx (client)
useEffect(() => ensureAudioReady(), []);
const onNext = async () => {
  const prompt = buildIntervalPrompt(config);    // theory/*
  await playContext(prompt.key);
  await playInterval(prompt);
  setPendingAnswer(prompt);
};
const onAnswer = async (choice) => {
  const correct = isCorrectInterval(pendingAnswer, choice);
  playFeedback(pendingAnswer, correct);          // optional replay
  await postAttempt({ prompt: pendingAnswer, answer:{interval:choice}, isCorrect: correct, latencyMs });
  bias.register(pendingAnswer, correct);         // adaptivity
  onNext();
};
```

---

## 11) Config & Environment

`.env`

```
# Neon
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DB?sslmode=require"

# NextAuth
AUTH_SECRET="complex-long-string"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Email Magic Link (choose one provider)
# e.g. Resend / Postmark / Mailgun – see Auth.js guides
RESEND_API_KEY="..."
POSTMARK_API_TOKEN="..."
MAILGUN_KEY="..."
```

**Notes**

* Use **Prisma Adapter**; keep models exactly as adapter expects. ([GitHub][6])
* App Router handlers export `{ GET, POST }` from `handlers` (v5). ([GitHub][7])

---

## 12) UX/Copy & Defaults

* **Defaults**: Key=C major; Intervals set = m2..P8; Chords = Maj/Min/Dim/Aug; Progressions = P1..P4.
* **Context audio**: 1 bar drone @ -12 dB + I arpeggio (quarter-note triplet feel), then prompt.
* **Answering**: buttons first; add `react-piano` as optional.
* **Feedback**: toast & subtle confetti on streak milestones.

---

## 13) Testing Checklist

* **Audio**: Autoplay unlock flow (user gesture). Multiple consecutive plays don’t overlap.
* **Auth**: Google sign-in; Email magic-link roundtrip; OTP request throttling; OTP verify (expiry, wrong code, reuse).
* **DB**: Prisma migrations apply on Neon; indexes hit for `Attempt` queries.
* **Drills**: Each progression resolves correctly within key; interval semitone math correct.

---

## 14) Build Plan (Milestones)

* **M1**: Auth.js v5 (Google + Email magic link + OTP), Prisma+Neon, dashboard shell.
* **M2**: Interval drill (context + prompt + answers + storage).
* **M3**: Chord & Progression drills (qualities + P1–P4), inversions toggle.
* **M4**: Adaptivity bias + stats widgets; optional react-piano; lazy-load sample pack.

---

## 15) References (auth bits)

* **Auth.js Email (magic link) docs** — built-in passwordless flow; stores verification tokens. ([Auth.js][1], [NextAuth][2])
* **Credentials provider** — supports arbitrary fields (email+code), typical pattern for custom OTP. ([NextAuth][4])
* **OTP via custom provider** — community discussion/tutorials (design is viable). ([GitHub][3], [YouTube][10])
* **v5 handlers pattern & Prisma adapter** — current docs & adapter schema. ([GitHub][7])

---

[1]: https://authjs.dev/getting-started/authentication/email?utm_source=chatgpt.com "Email Providers"
[2]: https://next-auth.js.org/providers/email?utm_source=chatgpt.com "Email | NextAuth.js"
[3]: https://github.com/nextauthjs/next-auth/discussions/2812?utm_source=chatgpt.com "Using custom provider with OTP capabilities #2812"
[4]: https://next-auth.js.org/providers/credentials?utm_source=chatgpt.com "Credentials"
[5]: https://authjs.dev/getting-started/adapters/prisma?utm_source=chatgpt.com "Prisma adapter - Auth.js"
[6]: https://github.com/nextauthjs/next-auth/blob/main/packages/adapter-prisma/prisma/schema.prisma?utm_source=chatgpt.com "schema.prisma - nextauthjs/next-auth"
[7]: https://github.com/nextauthjs/next-auth/issues/12167?utm_source=chatgpt.com "Migrating to v5 (NextAuth) · Issue #12167"
[8]: https://next-auth.js.org/configuration/initialization?utm_source=chatgpt.com "Initialization | NextAuth.js"
[9]: https://authjs.dev/concepts/session-strategies?utm_source=chatgpt.com "Session Strategies - Auth.js"
[10]: https://www.youtube.com/watch?v=Q4WNccCkfsQ&utm_source=chatgpt.com "Build OTP Service and Add 2FA with NextAuth v5 in Next.js ..."
