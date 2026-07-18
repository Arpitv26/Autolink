# AutoLink Session State

Last updated: 2026-07-18
Owner: Arpit
Current phase: Phase 4 AI Core shipped in repo (deploy + phone smoke next)

## Current Snapshot
- Expo Router app on Expo SDK 54 with Google OAuth and Supabase session persistence.
- Foundation, Social Feed, and Mod Planner core are implemented.
- AI Core is implemented in code: `ai_query_log` migration, `supabase/functions/ai-chat`, `hooks/useAutoLinkAI.ts`, GiftedChat UI on the AI tab (non-streaming, JWT auth, 20/day limit).
- Live docs synced to match shipped Foundation/Feed/Planner + CI.
- CI runs install, TypeScript, ESLint, and focused Vitest logic tests.

## Recently Completed
- Docs sync across AGENTS, README, agent_docs, and CODEX archival banner.
- Added `supabase/migrations/20260718140000_ai_query_log.sql` (applied remote).
- Implemented Edge Function `ai-chat` with JWT user identity (never trusts body `userId`).
- Rebuilt AI tab with GiftedChat + vehicle context badge + loading/typing + limit errors.
- Hardened AI errors + explicit session Authorization on invoke; redeployed `ai-chat`.
- AI now injects Mod Planner build + recent vehicle Feed posts into the system prompt; darker AI bubbles.
- `npm run verify` passing after AI Core.

## Verification
- `npm run verify`: passing
- Physical-device Expo Go still needed for Planner gestures and AI chat after deploy

## Backend Status
- Migrations through `20260718130000_mod_planner_builds.sql` were previously applied.
- **New:** apply `20260718140000_ai_query_log.sql` with `npx supabase db push`.
- **New:** set `OPENAI_API_KEY` secret and deploy `ai-chat` before phone AI smoke.

## Open Decisions
- Pro billing/provider and extra Pro benefits remain undecided.
- Username editing remains locked.
- Apple Sign-In remains deferred.
- Full freeform canvas positions can be expanded later; current Planner uses category zones + sort order.
- AI streaming deferred; MVP uses loading/typing indicator only.
- Feed build-chip UI still deferred (`build_id` is persisted).

## Known Constraints and Risks
- Never expose OpenAI or service-role keys in the Expo client.
- The dev Pro flag only changes local UI gating; database entitlement remains authoritative.
- Supabase migrations are the backend source of truth.
- Catalog is mocked JSON for demo cost/control.

## Next 3 Tasks
1. Expo Go smoke the Planner add/remove/reorder/share loop on a physical device.
2. Apply AI migration + set OpenAI secret + deploy `ai-chat`, then smoke the AI tab.
3. Add EAS preview builds once AI chat is demo-stable.

## Key Files To Load First
- `AGENTS.md`
- `docs/session_state.md`
- `app/(tabs)/ai.tsx`
- `hooks/useAutoLinkAI.ts`
- `supabase/functions/ai-chat/index.ts`
- `supabase/migrations/20260718140000_ai_query_log.sql`
- `app/(tabs)/planner.tsx`
- `hooks/useBuildPlanner.ts`

## Starter Prompt For New Sessions
```text
Read AGENTS.md and docs/session_state.md. Foundation, Social Feed, Mod Planner, and AI Core (GiftedChat + Edge Function) are in the repo. Next: confirm Arpit applied db push + secrets + function deploy, then Expo Go smoke Planner + AI. Do not code unless explicitly asked.
```
