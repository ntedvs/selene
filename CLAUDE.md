# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `bun start` — start Expo dev server
- `bun install` — install dependencies

## Architecture

Selene is a React Native period-tracking app built with Expo SDK 54, expo-router, and Supabase.

**Path alias:** `~/` → `./src/`

**Routing (expo-router file-based):**

- `src/app/_layout.tsx` — root layout, wraps app in AuthProvider + FlowProvider, guards routes by auth state
- `src/app/auth.tsx` — login/signup screen (shown when unauthenticated)
- `src/app/index.tsx` — redirects to `/(tabs)/calendar`
- `src/app/(tabs)/` — tab navigator with Calendar and Profile tabs

**Backend:** Supabase (client in `src/lib/supabase.ts`). Auth via email/password. Env vars: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

**Data layer (`src/lib/`):**

- `logs.ts` — CRUD for the `logs` table (period, cramps, sex entries). Logs keyed by `(user_id, date, type)`.
- `predictions.ts` — pure functions for cycle prediction. Groups consecutive period dates into cycles, uses weighted-average cycle length to predict future periods. No server dependency.
- `settings.tsx` — FlowProvider context persisting default flow level to AsyncStorage.

**Key components:**

- `Calendar` (`src/components/calendar.tsx`) — infinite-scrolling month list via FlashList. Supports drag-to-select date ranges (via gesture-handler Pan) to bulk-log period days. Manages all log state and prediction computation.
- `MonthGrid` — memoized month grid with custom equality check. Renders day cells with colored arc indicators (period=red, cramps=amber, sex=purple) and prediction highlighting.
- `DaySheet` — bottom sheet modal for toggling log entries on a selected day. Swipe-to-dismiss via PanResponder.

## Style

- Dark theme (#000 background) throughout, accent color #e11d48 (rose)
- All styling via `StyleSheet.create`, no external style libraries
- Icons from lucide-react-native
