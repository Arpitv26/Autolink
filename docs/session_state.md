# AutoLink Session State

Last updated: 2026-07-18
Owner: Arpit
Current phase: Phase 3 Mod Planner first vertical slices shipped

## Current Snapshot
- Expo Router app on Expo SDK 54 with Google OAuth and Supabase session persistence.
- Foundation and Social Feed are complete, including vehicle-linked posts and Profile Posts filters.
- Mod Planner is no longer a placeholder: primary-vehicle builds load via `get_or_create_active_build`, parts come from a 120-item mocked catalog, live cost updates, category zones support reorder/move, and builds can be shared to Feed with photos.
- AI remains a placeholder with primary-vehicle context.
- CI runs install, TypeScript, ESLint, and focused Vitest logic tests.

## Recently Completed
- Automated Feed/Foundation smoke: `npm run verify`, Expo Doctor 18/18, web export.
- Added `supabase/migrations/20260718130000_mod_planner_builds.sql`:
  - `builds` / `build_items` with RLS and vehicle ownership checks
  - one active build per user+vehicle
  - trigger-maintained `total_cost`
  - optional `posts.build_id`
- Added `data/parts_catalog.json` (120 parts) and `lib/partsCatalog.ts` with filters/tests.
- Rebuilt `app/(tabs)/planner.tsx` with catalog browser, category zones, persistence, long-press move mode, and Share Build to Feed.
- Create-post accepts `vehicleId`, `buildId`, and prefilled `caption` for Planner share.

## Verification
- `npm run verify`: passing (including parts catalog tests)
- `npx expo-doctor`: 18/18 checks passing
- Physical-device Expo Go interaction still recommended for OAuth/media/drag gestures

## Backend Status
- Migrations synchronized through `20260718130000_mod_planner_builds.sql` after push.
- Re-run `npx supabase db push` after adding future migrations.

## Open Decisions
- Pro billing/provider and extra Pro benefits remain undecided.
- Username editing remains locked.
- Apple Sign-In remains deferred.
- Full freeform canvas positions can be expanded later; current Planner uses category zones + sort order.
- AI is the next major product milestone after Planner polish.

## Known Constraints and Risks
- Never expose OpenAI or service-role keys in the Expo client.
- The dev Pro flag only changes local UI gating; database entitlement remains authoritative.
- Supabase migrations are the backend source of truth.
- Catalog is mocked JSON for demo cost/control.

## Next 3 Tasks
1. Expo Go smoke the Planner add/remove/reorder/share loop on a physical device.
2. Start AI Edge Function proxy + GiftedChat with vehicle context.
3. Add EAS preview builds once AI chat is demo-stable.

## Key Files To Load First
- `AGENTS.md`
- `docs/session_state.md`
- `app/(tabs)/planner.tsx`
- `hooks/useBuildPlanner.ts`
- `lib/partsCatalog.ts`
- `data/parts_catalog.json`
- `components/planner/CatalogBrowser.tsx`
- `components/planner/CategoryZone.tsx`
- `app/create-post.tsx`
- `supabase/migrations/20260718130000_mod_planner_builds.sql`

## Starter Prompt For New Sessions
```text
Read AGENTS.md and docs/session_state.md. Foundation, Social Feed, and Mod Planner (catalog + persisted build editor + share-to-feed) are implemented. Recommend the smallest reviewable AI chat slice next. Do not code unless explicitly asked.
```
