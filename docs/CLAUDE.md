# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an ear training web application MVP for beginner-intermediate musicians, focusing on Western tonal music. The app provides game-like practice sessions for intervals, chord qualities, and chord progressions, always starting with tonal context (drone + I chord).

## Tech Stack

- **Framework**: Next.js 14+ with App Router, TypeScript, Tailwind CSS, shadcn/ui
- **Authentication**: Auth.js (NextAuth v5) with Google OAuth, Email magic link, and Email OTP
- **Database**: Neon Postgres with Prisma ORM and @auth/prisma-adapter  
- **Audio**: Tone.js for audio synthesis and playback (client-side only)
- **Music Theory**: tonal library for music theory utilities
- **Optional UI**: react-piano for input, VexFlow/OSMD (deferred)

## Latest Tech Stack Features & Best Practices

### Next.js 14+ App Router
- **Server Components by Default**: Use async Server Components for data fetching
- **Native `fetch()` API**: Built-in caching with `cache: 'force-cache'`, `cache: 'no-store'`, or `next: { revalidate: 60 }`
- **Metadata API**: Use `export const metadata = { title: '...', description: '...' }` instead of `<Head>`
- **Route Handlers**: Use `app/api/*/route.ts` with `export const { GET, POST } = handlers`

### Auth.js v5 (NextAuth v5)
- **Unified `auth()` Function**: Replaces `getServerSession` - use `const session = await auth()` in Server Components
- **New Configuration Pattern**: Root `auth.ts` file with `export const { handlers, auth, signIn, signOut } = NextAuth({...})`
- **Environment Variables**: Use `AUTH_*` prefix instead of `NEXTAUTH_*` (e.g., `AUTH_SECRET`, `AUTH_GOOGLE_ID`)
- **Edge Compatibility**: Separate `auth.config.ts` for middleware without database adapters

### Prisma ORM Latest
- **JSON Protocol**: Now default in v5+ (remove from previewFeatures)
- **Client Extensions**: Use `$extends()` for custom functionality and middleware
- **Preview Features**: Enable with `previewFeatures = ["driverAdapters"]` for external drivers
- **Type Safety**: Generated types automatically include relations and custom fields

### Tone.js Audio Best Practices
- **User Gesture Required**: Always call `await Tone.start()` on first user interaction
- **Transport Scheduling**: Use `Tone.Transport` for precise timing and synchronization
- **Proper Disposal**: Dispose audio nodes between questions to prevent overlapping
- **Context Management**: Use `Tone.now()` for accurate scheduling relative to AudioContext

### Tailwind CSS Modern Patterns  
- **Utility-First Composition**: Prefer `className="flex items-center gap-4"` over custom CSS
- **Arbitrary Values**: Use `w-[calc(100%-2rem)]` for precise measurements
- **Responsive Design**: Use `sm:`, `md:`, `lg:` prefixes for breakpoint-specific styles
- **Performance**: Tailwind v4 uses native CSS cascade layers for better performance

### Tonal Music Theory Library
- **Modular Imports**: Import specific modules `import { Note, Scale, Chord } from "tonal"`
- **Note Operations**: Use `Note.transpose("C4", "5P")` for interval transposition  
- **Scale Generation**: Use `Scale.get("C major").notes` for scale degrees
- **Chord Analysis**: Use `Chord.detect(["C", "E", "G"])` for chord identification

## Architecture

- **Client**: Next.js RSC + client components for drill interfaces
- **API**: App Router route handlers under `/app/api/*`
- **Auth**: Root config in `auth.ts`, handlers at `/app/api/auth/[...nextauth]/route.ts`
- **Database**: Prisma client singleton with Neon DATABASE_URL
- **State**: Drill attempts POST to API → DB, UserStat counters updated synchronously

## Key Development Commands

Since this is a new project with only a spec.md file, the typical commands would be:

```bash
# Install dependencies (when package.json exists)
npm install

# Development server
npm run dev

# Build for production
npm run build

# Database operations
npx prisma generate
npx prisma db push
npx prisma studio

# Linting and type checking
npm run lint
npm run typecheck
```

## Database Schema

The project uses Prisma with these key models:
- Standard Auth.js models (User, Account, Session, VerificationToken)
- App-specific models: Drill, Attempt, UserStat, OtpCode
- DrillType enum: INTERVAL, CHORD, PROGRESSION

## Audio Implementation

- Audio runs client-side only using Tone.js
- Context always provided: tonic drone + I arpeggio before prompts  
- Scheduling via Tone.Transport with proper disposal between questions
- Start with synth, lazy-load piano samples later

### Audio Best Practices & Code Patterns

#### Essential Audio Setup
```javascript
// Always start audio context on user gesture
document.querySelector("button")?.addEventListener("click", async () => {
  await Tone.start();
  console.log("audio is ready");
});

// Create audio context helper
export function ensureAudioReady() {
  if (Tone.context.state !== 'running') {
    return Tone.start();
  }
  return Promise.resolve();
}
```

#### Transport Scheduling Pattern
```javascript
// Create synths for context and prompts
const synthA = new Tone.FMSynth().toDestination();
const synthB = new Tone.AMSynth().toDestination();

// Schedule context (drone + I chord) 
const playContext = (key) => {
  const now = Tone.now();
  synthA.triggerAttackRelease(`${key}2`, "2n", now); // Drone
  synthA.triggerAttackRelease(`${key}4`, "8n", now + 0.5); // I
  synthA.triggerAttackRelease(`${key}4`, "8n", now + 1); // III  
  synthA.triggerAttackRelease(`${key}4`, "8n", now + 1.5); // V
};

// Schedule interval prompts
const playInterval = (key, interval, direction = "asc") => {
  const now = Tone.now();
  if (direction === "harm") {
    // Play harmonically (together)
    synthB.triggerAttackRelease(`${key}4`, "2n", now);
    synthB.triggerAttackRelease(Note.transpose(`${key}4`, interval), "2n", now);
  } else {
    // Play melodically (sequential)
    synthB.triggerAttackRelease(`${key}4`, "8n", now);
    const second = direction === "asc" ? 
      Note.transpose(`${key}4`, interval) : 
      Note.transpose(`${key}4`, Interval.invert(interval));
    synthB.triggerAttackRelease(second, "8n", now + 0.5);
  }
};
```

#### Proper Cleanup Between Questions
```javascript
// Dispose previous audio nodes before creating new ones
const cleanupAudio = () => {
  if (synthA) synthA.dispose();
  if (synthB) synthB.dispose();
  Tone.getTransport().cancel(); // Clear scheduled events
};

// Use in drill question transitions
const nextQuestion = async () => {
  cleanupAudio();
  await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
  // Create new synths and schedule new audio
};
```

## Drill Types

1. **Intervals**: Melodic (up/down) and harmonic, always in tonal context
2. **Chords**: Triad qualities (maj/min/dim/aug) with optional inversions  
3. **Progressions**: Major keys only - I–IV–V–I, I–V–vi–IV, ii–V–I, I–vi–IV–V

## Authentication Flows

Three auth methods:
- Google OAuth (standard)
- Email magic link (built-in Auth.js provider)  
- Email OTP (6-digit via Credentials provider with custom OtpCode table)

### Auth.js v5 Configuration Patterns

#### Root Auth Configuration (`auth.ts`)
```typescript
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Email from "next-auth/providers/email"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./lib/db/prisma"
import authConfig from "./auth.config"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" }, // Use JWT for better edge compatibility
  ...authConfig,
  providers: [
    Google,
    Email({
      // Email magic link configuration
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    }),
    Credentials({
      // OTP implementation
      credentials: {
        email: { type: "email" },
        code: { type: "text" }
      },
      async authorize(credentials) {
        // Verify OTP code against database
        const otpRecord = await prisma.otpCode.findFirst({
          where: {
            identifier: credentials.email,
            codeHash: hashCode(credentials.code),
            expiresAt: { gt: new Date() },
            consumedAt: null
          }
        });
        
        if (otpRecord) {
          // Mark as consumed and return user
          await prisma.otpCode.update({
            where: { id: otpRecord.id },
            data: { consumedAt: new Date() }
          });
          
          return {
            id: credentials.email,
            email: credentials.email,
          };
        }
        return null;
      }
    })
  ]
});
```

#### Edge-Compatible Config (`auth.config.ts`)
```typescript
import Google from "next-auth/providers/google"
import type { NextAuthConfig } from "next-auth"

// Edge-compatible configuration without database adapters
export default {
  providers: [Google],
  pages: {
    signIn: "/sign-in",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id;
      return session;
    },
  },
} satisfies NextAuthConfig;
```

#### Route Handler (`app/api/auth/[...nextauth]/route.ts`)
```typescript
import { handlers } from "@/auth"
export const { GET, POST } = handlers
```

#### Middleware (`middleware.ts`)  
```typescript
import authConfig from "./auth.config"
import NextAuth from "next-auth"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  // Custom middleware logic
  if (!req.auth && req.nextUrl.pathname.startsWith("/dashboard")) {
    return Response.redirect(new URL("/sign-in", req.url))
  }
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
```

#### Using Auth in Server Components
```typescript
import { auth } from "@/auth"

export default async function DashboardPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/sign-in")
  }

  return <div>Welcome {session.user.name}</div>
}
```

## Folder Structure

```
/app
  /api
    /auth/[...nextauth]/route.ts    # NextAuth v5 handlers
    /attempts/route.ts              # POST drill attempts
    /stats/route.ts                 # GET user statistics
    /otp/                          # OTP request/verify endpoints
  /(marketing)/page.tsx             # Landing page
  /sign-in/page.tsx                # Custom sign-in with tabs
  /dashboard/page.tsx              # User dashboard
  /practice/                       # Drill pages
    /intervals/page.tsx
    /chords/page.tsx

/auth.ts                           # NextAuth v5 configuration
/lib
  /db/prisma.ts                    # Prisma singleton
  /audio/transport.ts              # Tone.js helpers
  /theory/                         # Prompt builders using tonal
  /adaptivity/bias.ts              # Simple resurfacing weights
```

## Key Implementation Notes

- Use `ensureAudioReady()` on first user gesture for autoplay policies
- PromptPayload types for INTERVAL, CHORD, PROGRESSION with proper structure
- Lightweight adaptivity via in-memory bias weights that resurface missed items
- UserStat aggregates updated synchronously (no cron jobs)
- shadcn/ui components: Card, Button, ToggleGroup, Select, Progress, Toast, Dialog

### Database Best Practices & Patterns

#### Modern Prisma Client Setup
```typescript
// lib/db/prisma.ts - Singleton pattern with extensions
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient().$extends({
  // Add logging extension  
  query: {
    $allOperations: async ({ operation, model, args, query }) => {
      const start = performance.now()
      const result = await query(args)
      const end = performance.now()
      console.log(`${model}.${operation} took ${end - start}ms`)
      return result
    },
  },
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

#### Attempt Storage with Aggregation  
```typescript
// app/api/attempts/route.ts
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { drillId, prompt, answer, isCorrect, latencyMs } = await request.json()

  // Store attempt and update stats atomically
  const [attempt, userStat] = await prisma.$transaction([
    prisma.attempt.create({
      data: {
        userId: session.user.id,
        drillId,
        prompt,
        answer,
        isCorrect,
        latencyMs,
      }
    }),
    
    prisma.userStat.upsert({
      where: { userId: session.user.id },
      update: {
        totalAttempts: { increment: 1 },
        correctAttempts: { increment: isCorrect ? 1 : 0 },
        lastAttemptAt: new Date(),
        // Update heat map for missed items
        intervalHeat: isCorrect ? undefined : {
          // Increment miss count for this interval
          ...(userStat?.intervalHeat as any),
          [prompt.interval]: {
            seen: ((userStat?.intervalHeat as any)?.[prompt.interval]?.seen ?? 0) + 1,
            miss: ((userStat?.intervalHeat as any)?.[prompt.interval]?.miss ?? 0) + 1,
          }
        }
      },
      create: {
        userId: session.user.id,
        totalAttempts: 1,
        correctAttempts: isCorrect ? 1 : 0,
        lastAttemptAt: new Date(),
      }
    })
  ])

  return NextResponse.json({ 
    id: attempt.id, 
    isCorrect,
    stats: {
      totalAttempts: userStat.totalAttempts,
      correctAttempts: userStat.correctAttempts,
      accuracy: Math.round((userStat.correctAttempts / userStat.totalAttempts) * 100)
    }
  })
}
```

### Music Theory Integration Patterns

#### Prompt Generation with Tonal
```typescript
// lib/theory/intervals.ts
import { Note, Interval, Scale } from "tonal"

export interface IntervalPrompt {
  kind: "INTERVAL"
  key: string
  mode: "major"
  interval: string
  direction: "asc" | "desc" | "harm"
  context: {
    drone: string
    arpeggioNotes: string[]
  }
}

export function generateIntervalPrompt(key = "C"): IntervalPrompt {
  const intervals = ["2m", "2M", "3m", "3M", "4P", "5P", "6m", "6M", "7m", "7M", "8P"]
  const directions = ["asc", "desc", "harm"] as const
  
  const interval = intervals[Math.floor(Math.random() * intervals.length)]
  const direction = directions[Math.floor(Math.random() * directions.length)]
  
  // Generate context using tonal
  const scaleNotes = Scale.get(`${key} major`).notes
  const arpeggioNotes = [1, 3, 5, 8].map(degree => 
    Scale.degrees(`${key}4 major`)(degree)
  )
  
  return {
    kind: "INTERVAL",
    key,
    mode: "major", 
    interval,
    direction,
    context: {
      drone: `${key}2`,
      arpeggioNotes
    }
  }
}

export function validateIntervalAnswer(prompt: IntervalPrompt, answer: string): boolean {
  return prompt.interval === answer
}
```

#### Chord Progression Generation
```typescript
// lib/theory/progressions.ts  
import { Progression, Chord } from "tonal"

const COMMON_PROGRESSIONS = [
  ["I", "IV", "V", "I"],      // I–IV–V–I
  ["I", "V", "vi", "IV"],     // I–V–vi–IV (pop progression)  
  ["ii", "V", "I"],           // ii–V–I (jazz cadence)
  ["I", "vi", "IV", "V"]      // I–vi–IV–V ('50s progression)
]

export function generateProgressionPrompt(key = "C") {
  const progression = COMMON_PROGRESSIONS[Math.floor(Math.random() * COMMON_PROGRESSIONS.length)]
  const chords = Progression.fromRomanNumerals(key, progression)
  
  return {
    kind: "PROGRESSION" as const,
    key,
    romanNumerals: progression,
    chords: chords.map(chord => ({
      symbol: chord,
      notes: Chord.get(chord).notes
    })),
    context: {
      drone: `${key}2`,
      tonicChord: Chord.get(`${key}maj`).notes
    }
  }
}
```

## Environment Variables

```bash
# Database
DATABASE_URL="postgresql://..."

# Auth.js v5 (Note: AUTH_ prefix, not NEXTAUTH_)
AUTH_SECRET="..."
AUTH_GOOGLE_ID="..."
AUTH_GOOGLE_SECRET="..."
AUTH_TRUST_HOST=true  # For production behind proxy

# Email providers (choose one)
AUTH_RESEND_KEY="..."     # For Resend
EMAIL_SERVER="smtp://..."  # For magic links
EMAIL_FROM="noreply@yourapp.com"

# Optional: Custom auth URL (usually auto-detected)
# AUTH_URL="https://yourapp.com"
```

### UI Component Patterns with shadcn/ui + Tailwind

#### Modern Drill Interface Component
```tsx
// components/DrillInterface.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"  
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

interface DrillInterfaceProps {
  question: IntervalPrompt
  onAnswer: (answer: string) => void
  stats: { accuracy: number; streak: number }
}

export function DrillInterface({ question, onAnswer, stats }: DrillInterfaceProps) {
  const intervals = [
    { label: "m2", value: "2m" },
    { label: "M2", value: "2M" },
    { label: "m3", value: "3m" }, 
    { label: "M3", value: "3M" },
    { label: "P4", value: "4P" },
    { label: "TT", value: "4A" }, // Tritone
    { label: "P5", value: "5P" },
    { label: "m6", value: "6m" },
    { label: "M6", value: "6M" },
    { label: "m7", value: "7m" },
    { label: "M7", value: "7M" },
    { label: "P8", value: "8P" },
  ]

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">
          Interval Training - {question.key} Major
        </CardTitle>
        <div className="flex items-center justify-between">
          <Badge variant="secondary">
            Accuracy: {stats.accuracy}%
          </Badge>
          <Badge variant="outline">
            Streak: {stats.streak}
          </Badge>
        </div>
        <Progress value={stats.accuracy} className="w-full" />
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Play controls */}
        <div className="text-center space-y-2">
          <Button size="lg" className="w-full">
            🔊 Play Context + Interval
          </Button>
          <div className="text-sm text-muted-foreground">
            Direction: {question.direction === "asc" ? "↗️ Ascending" : 
                       question.direction === "desc" ? "↘️ Descending" : 
                       "🎵 Harmonic"}
          </div>
        </div>

        {/* Answer grid */}  
        <div className="grid grid-cols-4 gap-3">
          {intervals.map((interval) => (
            <Button
              key={interval.value}
              variant="outline"
              className="aspect-square text-lg font-semibold hover:bg-primary hover:text-primary-foreground transition-colors"
              onClick={() => onAnswer(interval.value)}
            >
              {interval.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
```

#### Responsive Dashboard Layout
```tsx
// app/dashboard/page.tsx
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect("/sign-in")

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">
          Welcome back, {session.user.name}
        </h1>
        <p className="text-muted-foreground">
          Continue your ear training journey
        </p>
      </div>

      {/* Stats overview - responsive grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <span className="text-2xl">🎯</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">127</div>
            <p className="text-xs text-muted-foreground">+12 from last week</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
            <span className="text-2xl">📈</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89%</div>
            <p className="text-xs text-muted-foreground">+5% improvement</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <span className="text-2xl">🔥</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7 days</div>
            <p className="text-xs text-muted-foreground">Personal best!</p>
          </CardContent>
        </Card>
      </div>

      {/* Practice options - responsive layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <PracticeCard 
          title="Intervals"
          description="Practice identifying intervals in tonal context"
          href="/practice/intervals"
          icon="🎵"
        />
        <PracticeCard
          title="Chords" 
          description="Recognize chord qualities and inversions"
          href="/practice/chords"
          icon="🎹"
        />
        <PracticeCard
          title="Progressions"
          description="Identify common chord progressions"  
          href="/practice/progressions"
          icon="🎼"
        />
      </div>
    </div>
  )
}
```

## Development Milestones

1. Auth.js v5 setup with all three providers + Prisma/Neon + dashboard shell
2. Interval drill with context + prompt + answers + storage
3. Chord & Progression drills with qualities and progressions
4. Adaptivity bias + stats widgets + optional react-piano + sample loading

## Quick Reference: Essential Commands

```bash
# Project setup
npm install
npm run dev

# Database operations  
npx prisma generate
npx prisma db push
npx prisma studio

# Code quality
npm run lint
npm run typecheck

# Auth.js secret generation
npx auth secret
```

## Common Patterns & Troubleshooting

### Audio Context Issues
- **Problem**: Audio doesn't play on mobile
- **Solution**: Ensure `Tone.start()` is called after user gesture
- **Pattern**: Always use `ensureAudioReady()` helper

### Auth.js v5 Migration  
- **Problem**: `getServerSession is not defined`
- **Solution**: Use `const session = await auth()` instead
- **Pattern**: Import from root `auth.ts`, not `next-auth/next`

### Prisma Type Safety
- **Problem**: Relations not typed correctly
- **Solution**: Run `npx prisma generate` after schema changes
- **Pattern**: Use `include` for relations, `select` for specific fields

### Tailwind Performance
- **Problem**: Large CSS bundle size
- **Solution**: Use `content` config to scan only necessary files
- **Pattern**: Prefer utility classes over custom CSS

### Tonal.js Music Theory
- **Problem**: Interval calculations incorrect  
- **Solution**: Use `Note.transpose()` and `Interval.distance()`
- **Pattern**: Always validate note names before operations

---

**Note**: This documentation reflects the latest versions and best practices as of 2024. Always check official documentation for the most current patterns and API changes.