agent_docs/project_brief.md
Save as: agent_docs/project_brief.md
Project Brief (Persistent) — AutoLink
Product Vision
AutoLink is the only mobile app that combines AI-powered car modification advice, a visual drag-and-drop build planner, and a social community feed — all personalised to your specific vehicle.
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
Use Zod for runtime validation of API responses where possible
Architecture
Screens in app/(tabs)/ — Expo Router file-based routing
Business logic in hooks/ — custom hooks only, no logic in screens
Supabase calls only in hooks, never directly in components
OpenAI calls ONLY via Supabase Edge Function — never from client
Styling
Use StyleSheet.create() — no inline styles
Consistent spacing: 8pt grid (8, 16, 24, 32)
Colors: white/light backgrounds, warm accent (#FF6B35 or similar car-brand orange)
---
Quality Gates
npm run lint must pass before every commit
npm run type-check must pass before every commit
Test on Expo Go (physical device or simulator) after each feature
No console.error in production code — handle errors with user-facing messages
---
Key Commands
Development
npx expo start              # Start dev server
npx expo start --ios        # iOS simulator
npx expo start --android    # Android emulator
Quality
npm run lint                # ESLint
npm run type-check          # TypeScript (tsc --noEmit)
Build &amp; Deploy
eas build --platform ios --profile preview    # TestFlight build
eas build --platform android --profile preview # APK build
eas submit --platform ios                      # Submit to TestFlight
Supabase
npx supabase db push        # Apply migrations
npx supabase functions deploy ai-chat         # Deploy Edge Function
---
What is Mocked vs Real (Demo Strategy)
| Feature | Approach | Reason |
|---------|----------|--------|
| Vehicle lookup (make/model/year) | REAL — NHTSA vPIC API | Free, adds credibility |
| AI chat responses | REAL — OpenAI GPT-4o mini | Core feature, must be live |
| User auth + profiles | REAL — Supabase Auth | Easy, shows security awareness |
| Parts catalog | MOCKED — static JSON (~150 parts) | Real APIs cost $1K+/year |
| Part compatibility | HYBRID — AI reasons about it | AI can caveat uncertainty |
| Social feed posts | REAL — Supabase DB | Core feature; seed 10–15 posts |
| Image uploads | REAL — Supabase Storage | Required for social authenticity |
| Price comparisons | MOCKED — hardcoded ranges | Real affiliate data post-launch |
---
Security Rules
Row Level Security (RLS) enabled on ALL Supabase tables — no exceptions
Public profile discovery fields may be readable; private and user-owned data must remain owner-only via RLS (enforced by policies, not app logic)
OpenAI API key lives ONLY in Supabase Edge Function environment variables
No passwords ever stored — Google OAuth only for MVP
Image uploads: validate file type and size before uploading
---
Update Cadence
Update AGENTS.md &quot;Current State&quot; section after completing each phase milestone.
Update agent_docs/database_schema.md any time the schema changes.
Update this file when new conventions or constraints are established.
