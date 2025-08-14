## Restructuring Tasks Checklist

Use this as a living checklist while implementing the dashboard/practice restructure. Tick items as you complete them.

### Milestone 1 — Information Architecture & Routing
- [x] Create `src/app/practice/page.tsx` with three category tiles: Intervals (enabled), Chords (disabled), Rhythm (disabled).
- [ ] Add proper disabled visuals and `aria-disabled` semantics for disabled tiles; prevent navigation when disabled.
- [x] Move current Intervals drill implementation to `src/app/practice/intervals/identify/page.tsx` (uses existing `IntervalsPracticeClient`).
- [x] Convert `src/app/practice/intervals/page.tsx` into an Intervals subtype selector with three tiles: Identification (enabled → `/practice/intervals/identify`), Comparison (disabled), Singing (disabled).
- [x] Replace `src/app/practice/chords/page.tsx` with a Chords subtype selector (Identification, Inversions, Progressions — all disabled for now).
- [x] Add `src/app/practice/chords/identify/page.tsx`, `.../inversions/page.tsx`, `.../progressions/page.tsx` as disabled placeholders.
 - [x] Add `src/app/practice/rhythm/page.tsx` as a placeholder (disabled or “Coming soon”).
- [x] Redirect `"/practice/progressions"` to `"/practice/chords"` (progressions nested under chords).

### Milestone 2 — Component Updates
- [x] Extend `PracticeCard` to accept `disabled?: boolean`, `icon: React.ReactNode`, and optional `kicker?: string`/`ctaLabel?: string`.
- [x] Ensure disabled cards are non-focusable (`tabIndex={-1}`) and announced as disabled for screen readers.
- [x] Replace emoji props with icon nodes across usages.
- [x] Create `KpiChip` (compact stat chip) component with props: `icon`, `label`, `value`, `ariaLabel`.
- [x] Create `TimeframeToggle` component with `value: '7d' | '30d' | 'all'` and `onChange` handler (URL param integration ready).

### Milestone 3 — Stats Service (Timeframe Support)
- [x] Update `getUserStats(userId)` → `getUserStats(userId, range: '7d' | '30d' | 'all' = '7d')`.
- [x] Implement date-range filtering for attempts to compute totals for 7d/30d/all.
 - [x] Return `range` metadata in the response and ensure accuracy/streak semantics remain correct.
- [x] Update API at `src/app/api/stats/route.ts` to accept `?range=7d|30d|all` and pass to service.

### Milestone 4 — Dashboard Simplification
- [x] Trim hero copy to 1–2 lines while keeping “Welcome back, {name}”.
- [x] Add primary CTA “Start practice” linking to `/practice` (top area).
- [x] Add sticky bottom CTA on small screens with the same action.
- [x] Replace existing stat cards on mobile with a horizontally scrollable row of `KpiChip`s: Attempts, Accuracy, Streak.
- [x] Add `TimeframeToggle` (7d/30d/All) controlling the chips and API query.
- [x] Swap emoji icons for lucide icons (`Target`, `TrendingUp`, `Flame`).

### Milestone 5 — Header / Navigation
- [x] Update `AppHeader` primary nav to `Dashboard` and `Practice` (remove direct `Intervals/Chords/Progressions` links).
- [x] Keep Sign out as-is for now; confirm route works post-changes.

### Milestone 6 — Accessibility & Visual Polish
- [ ] Ensure all major actions have 44×44pt hit areas on mobile.
- [ ] Verify color contrast for chips and cards meets WCAG AA (body ≥ 4.5:1; large text ≥ 3:1).
- [ ] Add `aria-label`s for KPI chips (include values and timeframe in the label).
- [ ] Ensure disabled tiles meet contrast and are clearly distinguishable.

### Milestone 7 — QA & Validation
- [ ] Manual test routes: `/practice`, `/practice/intervals`, `/practice/intervals/identify`, `/practice/chords`, `/practice/rhythm`.
- [ ] Confirm redirect from `/practice/progressions` → `/practice/chords`.
- [ ] Verify Intervals Identification drill still creates/uses the same `drill` record and stats continue to accrue.
- [ ] Test timeframe toggle: stats chips update for 7d/30d/all; URL param persists on refresh.
- [ ] Mobile thumb-reach: sticky bottom CTA visible and functional; no overlap with system UI.
- [ ] Basic a11y pass with keyboard navigation and VoiceOver (labels, disabled state announcements).

### Done Criteria
- [ ] `"/practice"` is the single entry point to all practice types, with clear enabled/disabled states.
- [ ] Dashboard is simplified with concise hero, primary CTA to `/practice`, KPI chips with timeframe toggle.
- [ ] Navigation updated; no dead links; progressions accessible under chords.
- [ ] Accessibility and mobile ergonomics meet the guidelines above.


