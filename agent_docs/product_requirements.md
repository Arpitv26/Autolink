agent_docs/product_requirements.md
Save as: agent_docs/product_requirements.md
Product Requirements — AutoLink
Must-Have Features (P0 — All required for demo)
Feature 1: AI Modification Assistant
Conversational AI chat for natural language car modification questions
User Story: &quot;As a car enthusiast, I want to ask &apos;What exhaust fits my 2019 Civic?&apos; and get a confident, personalised answer so I don&apos;t waste money on incompatible parts.&quot;
Acceptance Criteria:
  - Response within 5 seconds
  - Context personalised to user&apos;s saved vehicle
  - Budget tiers provided (budget / mid / premium) where relevant
  - Flags uncertainty rather than guessing
  - Rate-limited to 20 queries/day per user (demo phase)
  - Typing indicator shown while AI responds
Tech: OpenAI GPT-4o mini via Supabase Edge Function proxy
Feature 2: Visual Modification Planner
Drag-and-drop canvas for planning car mods with cost tracking
User Story: &quot;As a car builder, I want to visually organise all my planned mods in one place — with costs — so I can see my full build at a glance and plan my budget.&quot;
Acceptance Criteria:
  - Add mod cards from mocked parts catalog (static JSON)
  - Mod cards are draggable into category zones
  - Filter by category, brand, price
  - Total cost displayed and updates in real time
  - Build auto-saves to Supabase
  - Share build directly to Social Feed
Tech: react-native-reanimated + Supabase PostgreSQL
Feature 3: Social Community Feed
Instagram-style feed for sharing car builds
User Story: &quot;As a car enthusiast, I want to share my build progress and see what others are building so I can get inspired and feel part of a community.&quot;
Acceptance Criteria:
  - Infinite scroll feed (public posts from all users)
  - Upload 1–5 photos per post (from camera roll)
  - Like/unlike posts (optimistic UI update)
  - Comment with threaded replies
  - Follow/unfollow other users
  - Posts can link to a specific saved Mod Planner build
Tech: Supabase PostgreSQL + Supabase Storage + expo-image-picker
Feature 4: User Auth + Garage Profile
Social login and vehicle garage that personalises the whole app
User Story: &quot;As a new user, I want to sign in quickly and tell the app what car I drive so every AI answer is relevant to my specific vehicle.&quot;
Acceptance Criteria:
  - Sign in with Google (Apple OAuth is optional for MVP)
  - Profile setup: username, display name, avatar
  - Garage: 1 free vehicle included; up to 4 additional vehicles unlocked via Pro (year/make/model validated via NHTSA)
  - Pro vehicle paywall can bundle additional premium features later (to be defined)
  - Vehicle context auto-injected into every AI query
  - Profile page shows user&apos;s builds and posts
Tech: Supabase Auth (Google OAuth) + NHTSA vPIC API
---
Should Have (P1 — v1.1 if time allows)
Push notifications (likes, comments, follows)
VIN scanner (scan barcode to auto-populate garage)
Build cost history (track budget changes over time)
Dark mode
---
Explicitly NOT in MVP (Deferred to v2+)
Real parts catalogue API (ACES/PIES costs $1K+/year — use mocked JSON)
Price comparison across sellers (requires affiliate API integrations)
Marketplace / in-app parts buying (payment processing, escrow, disputes)
In-app direct messaging (comments satisfy community need for now)
Native iOS/Android (Swift/Kotlin) — Expo cross-platform only
---
Success Metrics (Demo Phase)
Primary
50+ accounts created
100+ posts made, 500+ likes
Secondary
500+ total AI queries sent
30+ saved builds created
&gt;3 minutes average session length
&gt;20% D7 retention (users return after 7 days)
---
User Personas
| Persona | Age | Profile | Primary Need |
|---------|-----|---------|-------------|
| The Beginner | 18–24 | First car, wants mods, overwhelmed | Guided AI + learn-as-you-go |
| The Planner | 22–30 | Has modded before, wants organisation | Visual build planner + cost tracking |
| The Showoff | 20–35 | Loves sharing builds on Instagram/Reddit | Social feed + build showcase |
Primary persona — Alex:
22-year-old university student, 2019 Honda Civic Sport
Spends 3+ hours on YouTube/Reddit to verify coilover fitment; still not sure
Wants to ask, get a confident answer, add to build plan, share progress
---
UX Design Direction
Clean and minimal — white/light backgrounds, generous whitespace
Friendly and approachable — warm tone, encouraging copy
Car-native — automotive design language (bold cards, rich car photography)
Confidence by default — always show what to do next; no dead ends
Navigation Structure
Bottom tab navigation with 4 tabs:
🤖 AI — AI Chat Assistant (default landing screen)
🔧 Planner — Drag-and-drop Modification Planner
📸 Feed — Social Community Feed
👤 Profile — User profile, garage, saved builds
