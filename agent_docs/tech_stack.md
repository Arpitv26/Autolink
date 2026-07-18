agent_docs/tech_stack.md
Save as: agent_docs/tech_stack.md
Tech Stack & Tools — AutoLink
Core Stack Summary
| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| Mobile Framework | Expo (React Native) | SDK 54 | iOS + Android from one codebase |
| Language | TypeScript | 5.x | Type-safe JS |
| Backend/BaaS | Supabase | Latest | Database + Auth + Storage + Edge Functions |
| Database | PostgreSQL (via Supabase) | 15+ | Relational data for users/builds/posts |
| AI API | OpenAI GPT-4o mini | Latest | Car modification AI assistant (via Edge Function) |
| Vehicle Data | NHTSA vPIC | Free | Make/model/year — wired; CarQuery planned |
| Image Storage | Supabase Storage | Free tier | Car build photos, avatars |
| Auth | Supabase Auth (Google OAuth) | — | Social login, no passwords |
| Navigation | Expo Router | v6 (SDK 54) | File-based routing |
| Quality | Vitest + ESLint + GitHub Actions | — | `npm run verify` / CI |
| Deployment | Expo EAS Build | Free tier | iOS TestFlight + Android APK (Phase 5) |
---
Project Setup Commands
1. Install dependencies
cd Autolink
npm ci
2. Env
Copy `.env.example` → `.env.local` with:
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
EXPO_PUBLIC_DEV_BYPASS_PRO_VEHICLE_PAYWALL=false
3. Backend
npx supabase db push
4. Run
npx expo start
5. Quality gate
npm run verify
---
Supabase Client Setup
See `lib/supabase.ts` — AsyncStorage session persistence, anon key only.
DO NOT put OPENAI_API_KEY in Expo env — use Supabase Edge Function secrets.
---
Key Libraries
Navigation: Expo Router tabs — Feed, Planner, AI, Profile (default landing = Feed)
Planner UX: category zones + chevron reorder + long-press move (`components/planner/`)
AI Chat UI: `react-native-gifted-chat` (non-streaming MVP)
Image Picker: `expo-image-picker` for social posts
Catalog: `data/parts_catalog.json` + `lib/partsCatalog.ts`
---
Environment Variables (.env.local)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_DEV_BYPASS_PRO_VEHICLE_PAYWALL=false
DO NOT put OPENAI_API_KEY here — use: npx supabase secrets set OPENAI_API_KEY=...
---
Folder Structure
AutoLink/
├── app/
│   ├── (tabs)/
│   │   ├── feed.tsx
│   │   ├── planner.tsx       # Build editor (implemented)
│   │   ├── ai.tsx            # GiftedChat + Edge Function
│   │   └── profile.tsx
│   ├── create-post.tsx
│   ├── post/[id].tsx
│   ├── onboarding.tsx        # Setup gate
│   └── _layout.tsx
├── components/
│   ├── feed/PostCard.tsx
│   ├── planner/
│   └── profile/
├── data/parts_catalog.json
├── lib/
│   ├── supabase.ts
│   ├── nhtsa.ts
│   ├── partsCatalog.ts
│   ├── onboarding.ts
│   ├── entitlements.ts
│   └── theme.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useGarageSetup.ts
│   ├── useFeed.ts
│   ├── useCreatePost.ts
│   ├── useBuildPlanner.ts
│   ├── useAutoLinkAI.ts
│   └── useProfileFeedSections.ts
├── types/
│   ├── feed.ts
│   └── planner.ts
├── .github/workflows/ci.yml
├── supabase/
│   ├── migrations/
│   ├── functions/ai-chat/
│   └── seed.sql
└── agent_docs/
---
Free Tier Notes
Supabase free tier may pause after inactivity — keep a ping or wake the project before demos.
OpenAI costs stay low with max_tokens: 500 and 20 queries/day per user.
