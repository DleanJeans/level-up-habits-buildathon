# Level Up Habits — 1-Hour MVP Plan

Gamified habit tracker. React Native (Expo) for Web. Local-first with AsyncStorage.
Focus: checkbox & numeral habits that award stars, daily star total, day-to-day star graph.

**Scope**
- ✅ Checkbox habits (fixed stars), numeral habits (tiered 1–3⭐ + optional extra), bad habits (subtract stars)
- ✅ Daily star total, 7-day star bar chart, floating-point stars (0.05 increments)
- ❌ Time-based habits, one-off tasks, cues/routines/rewards, timeline log, weekly+ periods, reminders, auto-tracking, mood logging

---

## Phase 1 — Project Bootstrap (~5 min)
- [ ] Init Expo project (web-only), install deps
- [ ] Folder structure: `src/models/`, `src/store/`, `src/screens/`, `src/components/`

## Phase 2 — Data Model & Storage (~10 min)
- [ ] `src/models/types.ts` — `Habit`, `HabitLog`, `HabitType` types
- [ ] `src/store/storage.ts` — AsyncStorage CRUD helpers
- [ ] `src/store/starCalculator.ts` — `calculateStars(habit, logValue)` pure function

## Phase 3 — Habit CRUD Screen (~15 min)
- [ ] `src/screens/HabitsScreen.tsx` — habit list with add button
- [ ] `src/components/HabitForm.tsx` — create/edit form (type toggle, tiers, extra rule)
- [ ] Delete habit functionality

## Phase 4 — Daily Log Screen (~15 min)
- [ ] `src/screens/DailyLogScreen.tsx` — log habits for a day
- [ ] Checkbox toggle + numeral stepper controls
- [ ] Daily star total display
- [ ] Day navigation (left/right arrows)

## Phase 5 — Star Graph (~10 min)
- [ ] `src/screens/StatsScreen.tsx` — 7-day bar chart of daily star totals

## Phase 6 — Navigation & Polish (~5 min)
- [ ] Bottom tab navigator: Today | Habits | Stats
- [ ] Minimal styling: ⭐ emoji, green (good) / red (bad) color coding
