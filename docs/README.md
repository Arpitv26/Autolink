<div align="center">

# AutoLink

### *Plan it. Build it. Share it.*

**An AI-powered mobile platform for car enthusiasts to plan modifications, check compatibility, and connect with a community, all personalised to your specific vehicle.**

[![React Native](https://img.shields.io/badge/React_Native-Expo-0ea5e9?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o_mini-412991?style=for-the-badge&logo=openai&logoColor=white)](https://platform.openai.com)
[![Status](https://img.shields.io/badge/Status-In_Development-f59e0b?style=for-the-badge)](https://github.com)

</div>

---

## Current Implementation Status

Foundation and the chronological Social Feed vertical slice are implemented. The app now has
Google OAuth, a resumable profile/first-vehicle setup gate, profile/avatar editing, server-enforced
garage entitlements, paginated posts, 1–5 image uploads, optimistic likes, threaded comments,
follow/unfollow, and profile Posts/Favorites. Planner and AI are the remaining placeholder tabs;
Planner is the next milestone.

Backend behavior is migration-driven. Apply every file in `supabase/migrations/` before testing.

---

## Table of Contents

- [About the Project](#about-the-project)
- [The Problem](#the-problem)
- [Core Features](#core-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Download](#download)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [AI Assistant](#ai-assistant)
- [Automotive Data APIs](#automotive-data-apis)
- [Roadmap](#-roadmap)
- [Budget & Cost](#budget--cost)
- [Contributing](#contributing)
- [License](#license)

---

## About the Project

AutoLink is an AI-powered platform that brings the entire car build process into one place — helping enthusiasts plan modifications, verify part compatibility, and share builds with a community. It solves one of the biggest frustrations in car culture: **fragmentation**.

Right now, a car enthusiast planning a modification has to bounce between:
- **YouTube** for inspiration
- **Reddit** for compatibility questions
- **Google Sheets** to track their build budget
- **Instagram** to share progress
- **E-commerce sites** to compare prices

None of these tools talk to each other. **AutoLink changes that.**

> *MVP currently under development · iOS + Android · 12-week solo build*

---

## The Problem

No existing app combines all three pillars of the car modification experience:

| What enthusiasts need | Where they go today | The gap |
|---|---|---|
| AI modification advice | Reddit, YouTube comments | No structured AI tool |
| Visual build planning | Google Sheets, notes app | No dedicated build planner |
| Community & social sharing | Instagram, Reddit | Not built for car builds |
| Part compatibility checking | E-commerce sites | Scattered, inconsistent |
| Budget tracking | Manual spreadsheets | No integrated cost tool |

**AutoLink is the only app that combines all three: AI mod advice + visual build planner + social community feed.**

---

## Core Features

### AI Modification Assistant
A conversational AI chat interface where users ask natural language questions about modifications, part compatibility, and build advice — contextualised to their specific vehicle.

- Powered by **OpenAI GPT-4o mini**
- Vehicle-aware: AI automatically knows your car from your garage profile
- Provides **3 budget tiers** (budget / mid-range / premium) for every recommendation
- Explicitly flags fitment uncertainty rather than guessing
- Rate-limited to 20 queries/day per user (demo phase)

### Visual Modification Planner
A drag-and-drop canvas to visually plan and organise your entire build.

- Drag mod cards into category zones (suspension, exhaust, wheels, etc.)
- Real-time cost tracker updates as you add/remove parts
- Filter by category, brand, and price range
- Auto-saves to Supabase PostgreSQL
- Share your build directly to the Social Feed

### Social Community Feed
An Instagram-style feed built specifically for car enthusiasts.

- Infinite scroll feed of public builds
- Upload 1–5 photos per post from your camera roll
- Like, comment, and follow other enthusiasts
- Posts can link directly to a saved build in the Mod Planner

### Garage Profile
Personalise the entire app experience around your specific car.

- Sign in with Google (Apple Sign-In is deferred)
- Save 1 vehicle on Free or up to 5 on Pro — validated against the **NHTSA vPIC API**
- Vehicle context is automatically injected into every AI query
- Profile page showcases your builds and posts

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Mobile Framework** | Expo (React Native) + TypeScript | Fastest path to iOS + Android; Java background transfers to TS; 6× more job postings than Flutter |
| **Backend / BaaS** | Supabase | Free tier covers demo; PostgreSQL is relational (perfect for cars/parts/users); auth + storage included |
| **Database** | Supabase PostgreSQL | SQL knowledge transfers from CS coursework; predictable relational model |
| **Authentication** | Supabase Auth (Google OAuth) | Passwordless social login; Apple Sign-In deferred |
| **Image Storage** | Supabase Storage | 1GB free tier; direct upload from mobile; built-in CDN |
| **AI API** | OpenAI GPT-4o mini | Best cost/quality ratio ($0.15/M input tokens); excellent automotive knowledge |
| **Vehicle Data** | NHTSA vPIC + CarQuery API | Both 100% free, no API key needed; covers make/model/year/specs |
| **Push Notifications** | Expo Push Notifications + EAS | Free; works natively with Expo |
| **AI Coding Tools** | Cursor IDE + GitHub Copilot | Cursor's Composer mode scaffolds entire screens in minutes |

---

## Architecture

```
                      ┌───────────────────────────────────────────────────────────────┐
                      │                   AutoLink Mobile App                         │
                      │              (Expo / React Native / TypeScript)               │
                      │                                                               │
                      │   ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐  │
                      │   │   AI Chat    │   │    Build     │   │   Social Feed    │  │
                      │   │  (Gifted     │   │   Planner    │   │  (FlatList +     │  │
                      │   │   Chat UI)   │   │ (Reanimated  │   │   expo-image)    │  │
                      │   └──────┬───────┘   │  drag-drop)  │   └────────┬─────────┘  │
                      │          │           └──────┬───────┘            │            │
                      └──────────┼──────────────────┼────────────────────┼────────────┘
                                 │                  │                    │
                          ┌──────▼─────┐    ┌───────▼────────────────────▼─────────┐
                          │  OpenAI    │    │               Supabase               │
                          │  GPT-4o    │    │  ┌──────────┐   ┌────────────────┐   │
                          │  mini API  │    │  │PostgreSQL│   │    Storage     │   │
                          │            │    │  │ Database │   │  (Car images)  │   │
                          └────────────┘    │  └──────────┘   └────────────────┘   │
                                            │  ┌──────────┐   ┌────────────────┐   │
                          ┌─────────────┐   │  │   Auth   │   │   Realtime     │   │
                          │  NHTSA API  │   │  │  (JWT)   │   │  (WebSocket)   │   │
                          │  CarQuery   │   │  └──────────┘   └────────────────┘   │
                          │   (free)    │   └──────────────────────────────────────┘
                          └─────────────┘
```

---

## Getting Started

> For developers who want to run the project locally during early development.
> 
### Prerequisites

- Node.js `v20+` (Node 20–22 supported)
- npm or yarn
- Expo Go app on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))
- A [Supabase](https://supabase.com) account (free)
- An [OpenAI](https://platform.openai.com) API key configured in Supabase Edge Function secrets (never in client env)

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/your-username/autolink.git
cd autolink
```

**2. Install dependencies**
```bash
npm ci
```

**3. Set up environment variables**

Copy `.env.example` to `.env.local` in the root directory:
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_DEV_BYPASS_PRO_VEHICLE_PAYWALL=false
```

The dev Pro flag only changes local UI gating; Supabase remains authoritative. Do not place any
OpenAI or service-role key in Expo client env vars.

**4. Set up Supabase**

- Create and link a project at [supabase.com](https://supabase.com)
- Apply migrations with `npx supabase db push`
- Optionally run `supabase/seed.sql` after at least one profile exists
- Enable Google OAuth under **Authentication → Providers**

**5. Run the app**
```bash
npx expo start
```

Scan the QR code with Expo Go on your phone, or press `i` for iOS simulator / `a` for Android emulator.

Run the quality gate with:

```bash
npm run verify
npx expo-doctor
```

---

## Download

AutoLink will be available soon on:

- App Store
- Google Play

**Join the waitlist: autolink.app**

---

## Project Structure

```
autolink/
├── app/                        # Expo Router screens (file-based routing)
│   ├── (tabs)/
│   │   ├── ai.tsx              # AI Chat Assistant screen
│   │   ├── planner.tsx         # Modification Planner screen
│   │   ├── feed.tsx            # Social Feed screen
│   │   └── profile.tsx         # User Profile & Garage screen
│   ├── onboarding.tsx          # Lightweight profile + first-vehicle setup gate
│   ├── create-post.tsx         # 1–5 image post creation
│   ├── post/[id].tsx           # Comments and replies
│   └── _layout.tsx             # Root layout + auth gate
├── components/
│   ├── feed/
│   │   └── PostCard.tsx        # Social post card
│   └── profile/                # Shared garage, vehicle, and profile-post UI
├── lib/
│   ├── supabase.ts             # Supabase client configuration
│   ├── nhtsa.ts                # NHTSA vehicle API helpers
│   ├── onboarding.ts           # Pure completion rules
│   └── entitlements.ts         # Pure plan-limit rules
├── hooks/
│   ├── useGarageSetup.ts       # Garage data and mutations
│   ├── useOnboarding.tsx       # Setup status provider
│   ├── useCreatePost.ts        # Image upload and post creation
│   └── useFeed.ts              # Paginated feed + social mutations
├── assets/                     # Images, icons, fonts
└── supabase/
    ├── migrations/             # Backend source of truth
    └── seed.sql                # Optional demo posts
```

---

## Database Schema

Supabase migrations are the only schema source of truth. The implemented model currently includes:

- `profiles` and `vehicles`, with server-managed Pro entitlement and atomic primary-vehicle RPCs
- `posts`, `likes`, `comments`, and `follows`, with indexed chronological reads
- trigger-maintained post counters
- public `avatars` and `post-images` buckets with owner-scoped write policies
- Row Level Security on every app table

Planner/build tables are intentionally deferred until the Planner milestone. See
`supabase/migrations/` for exact SQL and policy definitions.

---

## AI Assistant

> Planned milestone. The current AI tab is a placeholder.

### How It Works

The AutoLink AI Assistant uses a two-step approach to answer modification questions:

1. **Vehicle extraction** — GPT-4o mini parses the user's message to identify year/make/model
2. **NHTSA verification** — The extracted vehicle is verified against the NHTSA vPIC API
3. **Context injection** — Verified vehicle info + the user's saved garage is injected into the system prompt
4. **AI response** — GPT-4o mini responds with modification advice contextualised to the specific vehicle

### System Prompt Design

```typescript
const AUTOLINK_SYSTEM_PROMPT = `
You are AutoLink AI, an expert automotive modification assistant.

## Your Knowledge Areas:
- Performance mods: engines, turbos, exhaust, intake, suspension, brakes
- Appearance mods: wheels, body kits, lighting, wraps, tints
- Part compatibility: year/make/model/trim fitment verification
- Budget planning: cost estimates, parts sourcing recommendations
- DIY vs. professional install guidance

## User's Current Garage: {vehicleContext}
## User's Saved Build: {buildContext}

## Behaviour Rules:
1. Always ask for vehicle year/make/model/trim if not provided
2. When checking compatibility, explicitly confirm fitment or flag uncertainty
3. Provide 3 price tiers: budget / mid-range / premium
4. Recommend reputable brands (KW, Bilstein, Borla, K&N, etc.)
5. Flag mods that may void warranty or fail emissions tests
6. If asked non-automotive questions, politely redirect
`;
```

### Cost at Demo Scale

| Metric | Calculation | Result |
|---|---|---|
| Daily queries | 100 users × 10 queries | 1,000/day |
| Monthly input tokens | 1,000 × 300 tokens × 30 days | 9M tokens |
| Monthly output tokens | 1,000 × 400 tokens × 30 days | 12M tokens |
| Input cost (GPT-4o mini) | 9M × $0.15/M | $1.35/month |
| Output cost (GPT-4o mini) | 12M × $0.60/M | $7.20/month |
| **Total AI cost** | | **~$5–8/month** |

> A Supabase Edge Function is used as an OpenAI proxy — hiding the API key from the client, enforcing per-user rate limits, and enabling response caching to reduce costs.

---

## Automotive Data APIs

AutoLink uses free government and community APIs for vehicle data — zero cost for demo scale.

| API | Provider | Data | Pricing | Coverage |
|---|---|---|---|---|
| **NHTSA vPIC**✓ | US Government | VIN decode, makes/models/years/trims, recalls | **Free, no key** | US vehicles (1981–present) |
| **CarQuery API** ✓ | CarQuery.com | Engine specs, dimensions, 90K+ variants | **Free, no key** | Global (1941–present) |
| **NHTSA Recalls** | US Government | Safety recalls, defect investigations | **Free, no key** | US vehicles |
| Edmunds API ⚠︎ | Edmunds.com | Full specs, pricing, dealer data | Free (registration required, becoming restrictive) | US vehicles |

### Example: Vehicle Lookup with NHTSA vPIC

```typescript
// Get all models for a make + year
const url = `https://vpic.nhtsa.dot.gov/api/vehicles/getmodelsformakeyear/
             make/Toyota/modelyear/2022?format=json`;

// Decode a VIN
const vinUrl = `https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/
                1HGBH41JXMN109186?format=json`;

// Sample VIN decode response:
// { Make: 'HONDA', Model: 'Civic', ModelYear: '2021',
//   Trim: 'Sport Touring', EngineCylinders: '4',
//   DisplacementL: '1.5', DriveType: 'FWD' }
```

> **Demo Strategy:** NHTSA vPIC for vehicle validation + CarQuery for specs + a static JSON file of ~150 popular aftermarket parts. This delivers 100% of demo functionality at $0 cost.

---

## Roadmap

| Phase | Weeks | Milestone | Status |
|---|---|---|---|
| **Foundation** | 1–2 | Auth, setup gate, profile, server-enforced garage, quality baseline | ✅ Implemented |
| **Social Feed** | 3–5 | Pagination, image posts, likes, comments, follows, profile sections | ✅ Implemented |
| **Planner** | 6–8 | Drag-and-drop canvas, mocked parts catalogue, cost tracker, persistence | ⏳ Next |
| **AI Core** | 9–10 | Edge Function proxy, chat UI, vehicle context, rate limiting | ⏳ Upcoming |
| **Polish** | 11–12 | Device hardening, EAS builds, store previews, demo video | ⏳ Upcoming |

### What's Real vs. Mocked in the Demo

| Feature | Approach | Rationale |
|---|---|---|
| Vehicle lookup (make/model/year) | **REAL** — NHTSA vPIC API | Free, instant, adds credibility |
| AI chat responses | **REAL** — OpenAI GPT-4o mini | Core feature — must be live AI |
| User auth + profiles | **REAL** — Supabase Auth | Easy to implement; shows security awareness |
| Parts catalogue | **MOCKED** — static JSON (~150 parts) | Real APIs cost $1,000+/year |
| Part compatibility | **HYBRID** — AI reasons about it | Sufficient for demo with appropriate caveats |
| Social feed posts | **REAL** — Supabase DB | Optional idempotent demo seed included |
| Image uploads | **REAL** — Supabase Storage | Required for authentic social feel |

---

## Budget & Cost

AutoLink is designed to run well within a $50/month budget during the demo phase.

| Service | What It Covers | Free Tier | Demo Cost |
|---|---|---|---|
| **OpenAI API** (GPT-4o mini) | AI assistant queries | $5 free credits | ~$5–8/month |
| **Supabase** (Free Plan) | Database + Auth + Storage + Realtime | 500MB DB, 1GB storage, 2GB bandwidth | **$0/month** |
| **Expo EAS Build** | iOS + Android builds | 30 builds/month | **$0/month** |
| **NHTSA vPIC API** | Vehicle make/model/year data | Completely free, no key | **$0/month** |
| **CarQuery API** | Vehicle specs + engine data | Completely free, no key | **$0/month** |
| Domain *(optional)* | autolink.app or similar | N/A | ~$10–15/year |

> ** Total Estimated Demo Cost: $5–8/month** — well within budget. The remaining ~$42 is buffer for usage spikes or optional tools.

### Cost Optimisation Tips

- **Use a Supabase Edge Function as an OpenAI proxy** — enables per-user rate limiting and response caching
- **Enable prompt caching** — keep the system prompt under 1,024 tokens; OpenAI caches repeated system prompts, saving ~50% on input costs
- **Set `max_tokens: 500`** on all AI calls — most modification answers fit within this limit
- **Pre-generate common responses** — cache the 20 most-asked questions in Supabase; return instantly without an API call
- **Daily ping cron job** — prevents Supabase from pausing the free-tier project after 1 week of inactivity

---

## Contributing

AutoLink is currently under active development. Feedback, ideas, and improvements are always welcome.

If you would like to contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

Please open an issue first to discuss major changes.

---

## License

This repository is publicly visible for transparency and learning purposes.  
All rights reserved. The AutoLink codebase may not be copied, redistributed, or used to create derivative products without permission.

---

<div align="center">

**AutoLink · Built by Arpit Verma**

*AutoLink PRD & Research Report generated with the assistance of Claude AI*

</div>
