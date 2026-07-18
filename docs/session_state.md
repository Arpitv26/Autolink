# AutoLink Session State

Last updated: 2026-07-18
Owner: Arpit
Current phase: Phase 2 foundation complete; Social Feed vertical slice implemented

## Current Snapshot
- Expo Router app on Expo SDK 54 with Google OAuth and Supabase session persistence.
- Signed-in users must complete a display name and first vehicle before entering the tab app.
- Foundation includes profile/avatar editing, garage CRUD, atomic primary switching/deletion, warm-dark UI, and server-owned Pro entitlement.
- Social Feed includes paginated posts, 1–5 image creation, optimistic likes, threaded comments/replies, follow/unfollow, profile Posts, and liked-post Favorites.
- Planner and AI remain placeholders with primary-vehicle context.
- CI runs install, TypeScript, ESLint, and focused Vitest logic tests.

## Recently Completed
- Split reusable garage/profile UI into `components/profile/`.
- Added `supabase/migrations/20260718080000_foundation_hardening.sql`:
  - `profiles.bio` and `profiles.pronouns`
  - protected `profiles.is_pro`
  - server-enforced 1/5 vehicle limits
  - atomic primary switch and delete/reassign functions
- Added lightweight resumable setup gate in `app/onboarding.tsx`.
- Added Social Feed schema and storage policies in
  `supabase/migrations/20260718090000_social_feed.sql`.
- Added Feed, post creation, comments/replies, likes, follows, and profile post/favorite sections.
- Added `.github/workflows/ci.yml`, `npm run verify`, and focused onboarding/entitlement tests.
- Added `supabase/.temp/` to `.gitignore` and removed local CLI state from tracking.
- Updated Expo dependencies; `expo-doctor` now passes all 18 checks.

## Verification
- `npm run verify`: passing
- `npx expo-doctor`: 18/18 checks passing
- Expo web production export: passing
- Physical-device interaction still requires a human Expo Go pass after migrations are applied.

## Backend Status
- All migrations were applied to the linked Supabase project on 2026-07-18.
- `supabase/seed.sql` was applied and the public Feed returned three demo posts.
- Re-run `npx supabase db push` after adding future migrations.

## Open Decisions
- Pro billing/provider and the benefits beyond extra vehicles remain undecided.
- Username editing remains locked.
- Apple Sign-In remains deferred.
- Feed ranking is chronological for MVP; recommendation/ranking work is deferred.
- Planner is the next product milestone; AI follows Planner.

## Known Constraints and Risks
- Never expose OpenAI or service-role keys in the Expo client.
- The dev Pro flag only changes local UI gating; database entitlement remains authoritative.
- Supabase migrations are the backend source of truth.
- Post uploads can leave files behind if a post is deleted; add lifecycle cleanup before production scale.
- Run physical-device checks for OAuth deep links, media picker permissions, and keyboard behavior.

## Next 3 Tasks
1. Complete the Expo Go end-to-end interaction smoke test.
2. Build the Mod Planner data model and first read/write vertical slice.
3. Add EAS preview builds after Planner navigation is stable.

## Key Files To Load First
- `AGENTS.md`
- `docs/session_state.md`
- `app/_layout.tsx`
- `app/onboarding.tsx`
- `app/(tabs)/feed.tsx`
- `app/(tabs)/profile.tsx`
- `app/create-post.tsx`
- `hooks/useOnboarding.tsx`
- `hooks/useGarageSetup.ts`
- `hooks/useFeed.ts`
- `hooks/useCreatePost.ts`
- `supabase/migrations/20260718080000_foundation_hardening.sql`
- `supabase/migrations/20260718090000_social_feed.sql`

## Starter Prompt For New Sessions
```text
Read AGENTS.md and docs/session_state.md. The Foundation and chronological Social Feed vertical slice are implemented. First verify migrations and Expo Go smoke-test status, then recommend the smallest reviewable Mod Planner slice. Do not code unless explicitly asked.
```
