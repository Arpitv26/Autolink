agent_docs/project_brief.md
Save as: agent_docs/project_brief.md
Project Brief (Persistent) — AutoLink
Product Vision
AutoLink is the only mobile app that combines AI-powered car modification advice, a visual category-zone build planner, and a social community feed — all personalised to your specific vehicle.
Tagline: Plan it. Build it. Share it.
---
Developer Context
Developer: Arpit Verma, 2nd year CS @ UBC
Background: Strong CS fundamentals (Java, C++, C, Python) — newer to mobile/backend
Collaborator: James (design/idea side)
Timeline: 12 weeks, solo dev, ~10–15 hrs/week
Budget: ≤$25/month hard cap
---
Coding Conventions
TypeScript
All function parameters and return types must be explicitly typed
any is FORBIDDEN — use unknown with type guards
Prefer type over interface for data shapes
Architecture
Screens in app/(tabs)/ — Expo Router file-based routing
Business logic in hooks/ — custom hooks only, no logic in screens
Supabase calls only in hooks, never directly in components
OpenAI calls ONLY via Supabase Edge Function — never from client
Styling
Use StyleSheet.create() — no inline styles
Consistent spacing: 8pt grid (8, 16, 24, 32)
Colors: dark espresso/gold theme in `lib/theme.ts` (not light orange mockups)
---
Quality Gates
npm run verify must pass (type-check + lint + Vitest) before every commit
CI: `.github/workflows/ci.yml` runs the same gate
Test on Expo Go (physical device) after each feature that touches gestures/media/auth
No console.error in production code — handle errors with user-facing messages
Husky/prettier are optional future tooling — not currently installed
---
Key Commands
Development
npx expo start              # Start dev server
npx expo start --tunnel     # If phone Wi‑Fi cannot reach Mac
Quality
npm run verify              # type-check + lint + test
npm run type-check
npm run lint
npm run test
Build & Deploy
eas build --platform ios --profile preview    # Phase 5
eas build --platform android --profile preview
Supabase
npx supabase db push
npx supabase secrets set OPENAI_API_KEY=...
npx supabase functions deploy ai-chat
---
What is Mocked vs Real (Demo Strategy)
| Feature | Approach | Reason |
|---------|----------|--------|
| Vehicle lookup (make/model/year) | REAL — NHTSA vPIC API | Free, adds credibility |
| AI chat responses | REAL — OpenAI GPT-4o mini | Core feature, must be live |
| User auth + profiles | REAL — Supabase Auth | Easy, shows security awareness |
| Parts catalog | MOCKED — static JSON (~120 parts) | Real APIs cost $1K+/year |
| Part compatibility | HYBRID — AI reasons about it | AI can caveat uncertainty |
| Social feed posts | REAL — Supabase DB | Optional vehicle/build link + demo seed |
| Image uploads | REAL — Supabase Storage | Required for social authenticity |
| Price comparisons | MOCKED — hardcoded ranges | Real affiliate data post-launch |
---
Security Rules
Row Level Security (RLS) enabled on ALL Supabase tables — no exceptions
Public profile discovery fields may be readable; private and user-owned data must remain owner-only via RLS
OpenAI API key lives ONLY in Supabase Edge Function environment variables
AI Edge Function identifies the user from JWT — never trust client-supplied userId
No passwords ever stored — Google OAuth only for MVP
Image uploads: validate file type and size before uploading
---
Update Cadence
Update AGENTS.md "Current State" section after completing each phase milestone.
Update docs/session_state.md at end of work sessions.
Update agent_docs/database_schema.md when schema changes (migrations remain SoT).
Update this file when new conventions or constraints are established.
