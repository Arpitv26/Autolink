# AutoLink Session State

Last updated: 2026-02-21
Owner: Arpit
Current phase: Phase 1 (Foundation) - Profile + entitlement + cross-tab context polish

## Quick Update Checklist (60 sec)
- [ ] Update `Last updated` date.
- [ ] Update `Current phase` if changed.
- [ ] Move finished work into `Recently Completed`.
- [ ] Refresh `In-Progress Area` with the active task.
- [ ] Add/remove items in `Open Decisions`.
- [ ] Set `Next 3 Tasks` in priority order.
- [ ] Verify `Key Files To Load First` still matches active scope.

## 1) Current Snapshot
- App scaffolded with Expo Router + TypeScript.
- Supabase client + Google OAuth auth flow implemented.
- Bottom tabs reordered to product-style flow: `Feed`, `Planner`, `AI`, `Profile`.
- Default post-auth landing route now opens `Feed`.
- Profile tab has active polish work (green theme, garage UX, profile editing, Pro gating behavior).
- AI/Planner/Feed remain placeholder UIs, but now show shared primary-vehicle context.

## 2) Recently Completed
- Persisted active-vehicle switching to database primary state:
  - Vehicle switch now updates `vehicles.is_primary` and propagates across tabs.
  - Files: `hooks/useGarageSetup.ts`, `app/(tabs)/profile.tsx`
- Upgraded Garage vehicle UX:
  - Added visible "Your vehicles" card list with `Primary`/`Active` status and direct `Set active`.
  - Added delete confirmation modal before vehicle deletion.
  - Files: `app/(tabs)/profile.tsx`
- Smoothed active-vehicle interaction polish:
  - Added non-bouncy card reorder glide for vehicle activation.
  - Prevented Garage section flicker during vehicle switch via silent vehicle refresh.
  - Files: `app/(tabs)/profile.tsx`, `hooks/useGarageSetup.ts`
- Implemented hybrid Pro vehicle gate:
  - Free users limited to 1 vehicle.
  - Additional vehicles gated behind Pro UI.
  - Dev bypass supported via `EXPO_PUBLIC_DEV_BYPASS_PRO_VEHICLE_PAYWALL`.
  - Files: `hooks/useGarageSetup.ts`, `app/(tabs)/profile.tsx`
- Added profile photo picker flow (camera roll -> Supabase Storage -> `profiles.avatar_url`):
  - Files: `hooks/useProfileDataForm.ts`, `app/profile-data.tsx`
  - Added storage migration: `supabase/migrations/20260221120000_profile_avatars_storage.sql`
- Switched Pro entitlement source to database (`profiles.is_pro`) instead of metadata:
  - File: `hooks/useGarageSetup.ts`
  - Added migration: `supabase/migrations/20260221133000_profiles_is_pro.sql`
- Added cross-tab primary vehicle context banners:
  - New hook: `hooks/usePrimaryVehicleContext.ts`
  - Wired in: `app/(tabs)/feed.tsx`, `app/(tabs)/planner.tsx`, `app/(tabs)/ai.tsx`
- Updated root/tab routing flow:
  - `Feed` first in tabs: `app/(tabs)/_layout.tsx`
  - Default redirect to feed: `app/_layout.tsx`, `app/index.tsx`
- Added process rule in master docs:
  - Decision logging requires explicit user approval before writing workflow/product decisions to docs.
  - Files: `AGENTS.md`, `CODEX.md`

## 3) In-Progress Area
- Profile tab UX refinement:
  - visual polish
  - interaction polish
  - copy/state polish
- Next immediate focus:
  - loading/error/empty-state polish for Profile and placeholder tabs
- Prep for onboarding skeleton gate (lightweight now, full polished onboarding later).

## 4) Open Decisions
- Pro paywall bundle details (beyond extra vehicles) are TBD by product.
- Placeholder website links in settings stay as-is until web launch.
- Username editing remains locked for now; revisit during onboarding work.
- Apple Sign-In implementation deferred until explicitly requested.

## 5) Known Constraints
- Do not expose API keys in client.
- Do not call OpenAI directly from mobile client.
- No `any` in TypeScript.
- Stay in current phase scope unless explicitly approved.
- Ask for explicit permission before writing workflow/product decisions into docs.

## 6) Risks / Watchlist
- Ensure auth/profile initialization errors remain visible to user.
- Keep docs aligned with real behavior (especially RLS, storage policies, and feature limits).
- Avoid putting Supabase calls back into screen components.
- Ensure required Supabase migrations are applied in dashboard before testing affected flows.

## 7) Next 3 Tasks (Suggested)
1. Build and validate profile + placeholder-tab loading/error/edge-state polish (#4 focus).
2. Build lightweight onboarding skeleton gate and include profile-completeness progress strip (#5 in onboarding scope).
3. Verify profile vehicle flows and cross-tab context on Expo Go, then commit profile polish slice.

## 8) Key Files To Load First
- `AGENTS.md`
- `CODEX.md`
- `docs/session_state.md`
- `app/_layout.tsx`
- `app/index.tsx`
- `app/(tabs)/_layout.tsx`
- `app/(tabs)/profile.tsx`
- `app/(tabs)/feed.tsx`
- `app/(tabs)/planner.tsx`
- `app/(tabs)/ai.tsx`
- `app/profile-data.tsx`
- `hooks/useAuth.ts`
- `hooks/useGarageSetup.ts`
- `hooks/usePrimaryVehicleContext.ts`
- `hooks/useProfileIdentity.ts`
- `hooks/useProfileDataForm.ts`
- `supabase/migrations/20260220170000_phase1_profiles_vehicles.sql`
- `supabase/migrations/20260221120000_profile_avatars_storage.sql`
- `supabase/migrations/20260221133000_profiles_is_pro.sql`

## 9) Starter Prompt For New Sessions
Use this exactly (edit only if needed):

```text
Read AGENTS.md, CODEX.md, and docs/session_state.md.
Then load:
app/_layout.tsx, app/index.tsx, app/(tabs)/_layout.tsx, app/(tabs)/profile.tsx, app/(tabs)/feed.tsx, app/(tabs)/planner.tsx, app/(tabs)/ai.tsx, app/profile-data.tsx, hooks/useAuth.ts, hooks/useGarageSetup.ts, hooks/usePrimaryVehicleContext.ts, hooks/useProfileIdentity.ts, hooks/useProfileDataForm.ts, supabase/migrations/20260220170000_phase1_profiles_vehicles.sql, supabase/migrations/20260221120000_profile_avatars_storage.sql, supabase/migrations/20260221133000_profiles_is_pro.sql.
Summarize current state, blockers, and the exact next step.
Do not code yet.
```
