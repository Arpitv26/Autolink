# AutoLink Session State

Last updated: 2026-07-18
Owner: Arpit
Current phase: Phase 2 Social Feed complete, including vehicle-linked posts

## Current Snapshot
- Expo Router app on Expo SDK 54 with Google OAuth and Supabase session persistence.
- Signed-in users must complete a display name and first vehicle before entering the tab app.
- Foundation includes profile/avatar editing, garage CRUD, atomic primary switching/deletion, warm-dark UI, and server-owned Pro entitlement.
- Social Feed includes paginated posts, 1–5 image creation with carousel dots, optional vehicle attachment, optimistic likes, threaded comments/replies, follow/unfollow, profile Posts/Favorites, and Profile Posts vehicle filters.
- Garage tab shows vehicles and manage controls only; vehicle-specific posts live under the Profile Posts tab filters, not as a Garage placeholder strip.
- Planner and AI remain placeholders with primary-vehicle context.
- CI runs install, TypeScript, ESLint, and focused Vitest logic tests.

## Recently Completed
- Split reusable garage/profile UI into `components/profile/`.
- Added foundation hardening and Social Feed migrations, including
  `supabase/migrations/20260718120000_vehicle_linked_posts.sql`.
- Added lightweight resumable setup gate in `app/onboarding.tsx`.
- Added Feed, post creation, comments/replies, likes, follows, and profile post/favorite sections.
- Added optional “Post about” vehicle selector on create-post; defaults to primary vehicle; supports general posts.
- Added TikTok-style multi-photo pagination dots and vehicle badges on Feed cards.
- Added Profile Posts filter chips: All posts + each garage vehicle.
- Removed unused Garage “Vehicle posts” placeholder tiles for a cleaner garage layout.
- Added `.github/workflows/ci.yml`, `npm run verify`, and focused onboarding/entitlement tests.
- Applied all migrations and optional demo seed to the linked Supabase project.

## Verification
- `npm run verify`: passing
- `npx expo-doctor`: 18/18 checks passing
- Expo web production export: passing
- Physical-device interaction still requires a human Expo Go pass.

## Backend Status
- Local and remote migrations are synchronized through
  `20260718120000_vehicle_linked_posts.sql`.
- `posts.vehicle_id` is nullable, ownership-validated, and set null if the vehicle is deleted.
- `supabase/seed.sql` seeded three demo posts (general posts, no vehicle attachment).
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
- `components/feed/PostCard.tsx`
- `hooks/useOnboarding.tsx`
- `hooks/useGarageSetup.ts`
- `hooks/useFeed.ts`
- `hooks/useCreatePost.ts`
- `hooks/useProfileFeedSections.ts`
- `supabase/migrations/20260718080000_foundation_hardening.sql`
- `supabase/migrations/20260718090000_social_feed.sql`
- `supabase/migrations/20260718120000_vehicle_linked_posts.sql`

## Starter Prompt For New Sessions
```text
Read AGENTS.md and docs/session_state.md. Foundation and Social Feed are implemented, including vehicle-linked posts, carousel dots, and Profile Posts vehicle filters. Garage no longer shows a Vehicle posts placeholder. First verify Expo Go smoke-test status, then recommend the smallest reviewable Mod Planner slice. Do not code unless explicitly asked.
```
