agent_docs/testing.md
Save as: agent_docs/testing.md
Testing Strategy — AutoLink
Philosophy
This is a demo-phase app. Goal: reliable recruiter demo. Primary gate is `npm run verify` + Expo Go smoke tests.
---
Testing Layers
Layer 1: Automated quality gate
npm run verify   # type-check + lint + Vitest
CI: `.github/workflows/ci.yml` runs `npm ci` then `npm run verify` on push/PR.
Focused unit tests live next to pure logic (e.g. `lib/partsCatalog.test.ts`, `lib/onboarding.test.ts`, `lib/entitlements.test.ts`).
Layer 2: Manual Smoke Tests (After Each Feature)
Auth flow:
☐ Tap "Sign in with Google" → OAuth → returns to app
☐ Sign out → sign-in screen
☐ Sign back in → session restored
Setup gate (not marketing onboarding):
☐ New user without display name/vehicle → `/onboarding`
☐ Complete name + first vehicle → tabs unlock
Garage flow:
☐ Add vehicle → year → make (NHTSA) → model → save
☐ Vehicle appears on Profile Garage
☐ Primary vehicle context appears in AI header / Planner
AI Chat flow:
☐ Type "What coilovers fit my [vehicle]?" → response within ~5 seconds
☐ Response references the garage vehicle when possible
☐ Loading/typing indicator while waiting
☐ Daily limit message after 20 queries
Mod Planner flow:
☐ Open Planner with a primary vehicle → active build loads/creates
☐ Browse catalog → filter by category/brand/price/search
☐ Add part → category zone + total cost update
☐ Reorder with chevrons; long-press then tap another zone to move
☐ Reload app → build items persist
☐ Share Build to Feed → caption/vehicle/build prefilled → publish with photos
Social Feed flow:
☐ Feed loads with posts
☐ Create post with 2+ photos → carousel dots update
☐ “Post about” vehicle → badge on card
☐ Like/unlike optimistic
☐ Comments/replies
☐ Profile Posts: All + vehicle filters
☐ Garage has no Vehicle posts placeholder strip
Image upload:
☐ Camera roll → Supabase Storage → renders in PostCard
---
Husky / lint-staged
Not installed. Optional future. Do not assume pre-commit hooks exist.
Use `npm run verify` locally and rely on GitHub Actions.
---
Supabase Verification
Table Editor → rows created/updated
Authentication → users exist
Storage → images in correct bucket
Edge Functions → Logs for `ai-chat` errors
CLI: `npx supabase functions logs ai-chat` (or dashboard Logs)
---
Common Issues & Fixes
| Issue | Likely Cause | Fix |
|-------|-------------|-----|
| Supabase project paused | Free tier inactivity | Wake project in dashboard |
| AI generic answers | Missing vehicle context | Check vehicleContext passed to Edge Function |
| AI 401 | Missing/invalid JWT | Ensure user signed in; invoke uses session |
| Image upload failing | Bucket RLS | Check storage policies |
| "Network request failed" | Phone/Mac different networks | `npx expo start --tunnel` |
---
Before Demo Day Checklist
☐ All P0 features work on a physical device
☐ App loads quickly on mid-range Android
☐ AI responses arrive in < 5 seconds
☐ Feed seeded with realistic posts
☐ No console.error during normal usage
☐ App icon and splash screen set (Phase 5)
☐ Marketing onboarding (3 animated screens) if time — setup gate already exists
☐ TestFlight or shareable APK ready
☐ Screen recording of full demo as backup
