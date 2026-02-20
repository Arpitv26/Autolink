agent_docs/testing.md
Save as: agent_docs/testing.md
Testing Strategy — AutoLink
Philosophy
This is a demo-phase app. The goal is &quot;it works reliably for a recruiter demo,&quot; not production-grade test coverage. Focus on manual smoke tests + TypeScript type safety to catch most bugs.
---
Testing Layers
Layer 1: TypeScript (Primary Safety Net)
Run after every change:
npm run type-check   # tsc --noEmit — catches type errors without building
This catches ~70% of bugs for a TypeScript app before you even open the simulator.
Layer 2: ESLint (Code Quality)
npm run lint         # eslint . --ext .ts,.tsx
Configured to catch: unused imports, missing dependencies in useEffect, potential null refs.
Layer 3: Manual Smoke Tests (After Each Feature)
After implementing each feature, test these flows on Expo Go (physical device or simulator):
Auth flow:
☐ Tap &quot;Sign in with Google&quot; → Google OAuth opens → redirects back → profile screen appears
☐ Sign out → landing screen appears
☐ Sign back in → session restored automatically
Garage flow:
☐ Add vehicle → year picker → make dropdown (from NHTSA) → model dropdown → save
☐ Vehicle appears on profile page
☐ Vehicle context appears in AI chat header
AI Chat flow:
☐ Type &quot;What coilovers fit my [vehicle]?&quot; → response within 5 seconds
☐ Response includes budget tiers
☐ Typing indicator appears while waiting
☐ Send 21 messages in one day → 21st gets rate limit error message
Mod Planner flow:
☐ Browse parts catalog → filter by category
☐ Drag a part card → drops into zone → cost updates
☐ Build auto-saves to Supabase (verify in Supabase dashboard)
☐ Tap &quot;Share to Feed&quot; → post appears in feed
Social Feed flow:
☐ Feed loads with posts visible
☐ Tap heart → like count increments immediately (optimistic update)
☐ Tap heart again → unlike
☐ Tap comment icon → type comment → submit → appears in thread
☐ Upload photo → post appears in feed with image
Image upload:
☐ Select image from camera roll → upload to Supabase Storage → public URL returned
☐ Image renders in post card
---
Pre-Commit Hooks
Setup (one-time)
npm install --save-dev husky lint-staged
npx husky init
.husky/pre-commit content:
#!/bin/sh
npx lint-staged
package.json:
&quot;lint-staged&quot;: {
  &quot;*.{ts,tsx}&quot;: [
    &quot;eslint --fix&quot;,
    &quot;prettier --write&quot;
  ]
}
The pre-commit hook runs automatically before every git commit. Do not bypass it (--no-verify) unless there&apos;s a documented emergency.
---
Supabase Verification
After database operations, verify in Supabase Dashboard:
Table Editor → check rows were created/updated correctly
Authentication → verify user accounts are created
Storage → verify images uploaded to correct bucket
Logs → check Edge Function logs for AI call errors
Or use Supabase CLI
npx supabase db inspect     # Check schema
npx supabase logs           # View function logs
---
Common Issues &amp; Fixes
| Issue | Likely Cause | Fix |
|-------|-------------|-----|
| Supabase project paused | Free tier inactivity | Add GitHub Action to ping project daily |
| AI returning generic answers | Missing vehicle context | Check vehicleContext is passed to Edge Function |
| Image upload failing | Bucket RLS policy | Check storage bucket policies in Supabase dashboard |
| Drag-and-drop janky | Missing gesture handler setup | Ensure GestureHandlerRootView wraps app root |
| Auth not persisting | AsyncStorage not configured | Check supabase client `storage: AsyncStorage` setting |
| &quot;Network request failed&quot; | Dev server and phone not on same WiFi | Use `--tunnel` flag: `npx expo start --tunnel` |
---
Before Demo Day Checklist
☐ All 4 P0 features work end-to-end on a physical device
☐ App loads in &lt; 2 seconds on a mid-range Android
☐ AI responses consistently arrive in &lt; 5 seconds
☐ Feed is seeded with 10–15 realistic-looking posts
☐ At least 5 beta testers (friends/classmates) have used the app
☐ No console.error messages during normal usage
☐ App icon and splash screen are set
☐ Onboarding flow is complete (3 screens)
☐ Deployed to TestFlight or shareable APK link ready
☐ Screen recording of the full demo flow ready as backup
AutoLink • Codex CLI Config + Docs • February 2026 • Arpit Verma @ UBC
