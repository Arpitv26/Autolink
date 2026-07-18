agent_docs/product_requirements.md
Save as: agent_docs/product_requirements.md
Product Requirements — AutoLink
Must-Have Features (P0 — All required for demo)
Feature 1: AI Modification Assistant
Conversational AI chat for natural language car modification questions
User Story: "As a car enthusiast, I want to ask 'What exhaust fits my 2019 Civic?' and get a confident, personalised answer so I don't waste money on incompatible parts."
Acceptance Criteria:
  - Response within 5 seconds
  - Context personalised to user's saved vehicle
  - Budget tiers provided (budget / mid / premium) where relevant
  - Flags uncertainty rather than guessing
  - Rate-limited to 20 queries/day per user (demo phase)
  - Typing/loading indicator shown while AI responds (streaming deferred)
Tech: OpenAI GPT-4o mini via Supabase Edge Function proxy (JWT identifies user)
Feature 2: Visual Modification Planner
Category-zone build planner with mocked catalog and cost tracking
User Story: "As a car builder, I want to visually organise all my planned mods in one place — with costs — so I can see my full build at a glance and plan my budget."
Acceptance Criteria:
  - Add mod cards from mocked parts catalog (static JSON, ~120 parts)
  - Parts organise into category zones with reorder + long-press move
  - Filter by category, brand, price, and search
  - Total cost displayed and updates in real time
  - One active build per primary vehicle persists to Supabase
  - Share build to Social Feed (create-post persists optional `build_id`; Feed chip UI deferred)
Tech: react-native-reanimated + gesture-handler + Supabase PostgreSQL
Feature 3: Social Community Feed
Car-community feed for sharing build updates
User Story: "As a car enthusiast, I want to share my build progress and see what others are building so I can get inspired and feel part of a community."
Acceptance Criteria:
  - Infinite scroll feed (public posts from all users)
  - Upload 1–5 photos per post (from camera roll) with carousel pagination dots
  - Optionally attach one of the author's garage vehicles, or keep the post general
  - Like/unlike posts (optimistic UI update)
  - Comment with threaded replies (`parent_id`)
  - Follow/unfollow other users
  - Profile Posts tab filters by All + each garage vehicle
  - Garage tab manages vehicles only (no embedded Vehicle posts placeholder)
  - Optional `posts.build_id` when sharing from Planner
Tech: Supabase PostgreSQL + Supabase Storage + expo-image-picker
Feature 4: User Auth + Garage Profile
Social login and vehicle garage that personalises the whole app
User Story: "As a new user, I want to sign in quickly and tell the app what car I drive so every AI answer is relevant to my specific vehicle."
Acceptance Criteria:
  - Sign in with Google (Apple OAuth is optional for MVP)
  - Lightweight setup gate: display name + first vehicle
  - Profile editing: display name, avatar, bio, pronouns (username locked for now)
  - Garage: 1 free vehicle included; up to 4 additional vehicles unlocked via Pro (year/make/model validated via NHTSA)
  - Pro vehicle paywall can bundle additional premium features later (to be defined)
  - Vehicle context auto-injected into every AI query
  - Profile Posts/Favorites sections show social content; Garage focuses on vehicle CRUD
Tech: Supabase Auth (Google OAuth) + NHTSA vPIC API
---
Should Have (P1 — v1.1 if time allows)
Push notifications (likes, comments, follows)
VIN scanner (scan barcode to auto-populate garage)
Build cost history (track budget changes over time)
Feed build-chip when `posts.build_id` is set
---
Explicitly NOT in MVP (Deferred to v2+)
Real parts catalogue API (ACES/PIES costs $1K+/year — use mocked JSON)
Price comparison across sellers (requires affiliate API integrations)
Marketplace / in-app parts buying (payment processing, escrow, disputes)
In-app direct messaging (comments satisfy community need for now)
Native iOS/Android (Swift/Kotlin) — Expo cross-platform only
Freeform drag-and-drop canvas (current Planner uses category zones + sort_order)
---
Success Metrics (Demo Phase)
Primary
50+ accounts created
100+ posts made, 500+ likes
Secondary
500+ total AI queries sent
30+ saved builds created
>3 minutes average session length
>20% D7 retention (users return after 7 days)
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
Dark espresso/gold theme (`lib/theme.ts`) — not light orange marketing mockups
Friendly and approachable — warm tone, encouraging copy
Car-native — automotive design language, rich car photography
Confidence by default — always show what to do next; no dead ends
Navigation Structure
Bottom tab navigation with 4 tabs (post-auth default = Feed):
Feed — Social Community Feed (default landing)
Planner — Category-zone Modification Planner
AI — AI Chat Assistant
Profile — User profile, garage, Posts/Favorites
