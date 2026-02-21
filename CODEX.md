🔗 AutoLink

Codex CLI Config + Reference Docs

Prepared for Arpit Verma • UBC CS • February 2026

How to use: Save CODEX.md in your project root. Create an agent_docs/ folder and save the remaining files inside it. Reference these from Codex CLI sessions as needed.

Files in This Document

CODEX.md — project root — Codex CLI session config

agent_docs/tech_stack.md — full stack, libraries, setup commands

agent_docs/code_patterns.md — TypeScript rules, component/hook patterns

agent_docs/project_brief.md — conventions, mock vs real strategy, security rules

agent_docs/product_requirements.md — P0 features, user stories, success metrics

agent_docs/database_schema.md — full PostgreSQL schema + RLS policies

agent_docs/ai_assistant.md — Edge Function code, system prompt, cost controls

agent_docs/testing.md — smoke test checklist, pre-commit hooks

Recommended Codex CLI Session Starters

Paste one of these at the start of a Codex session depending on what you're building:

"Read AGENTS.md and CODEX.md. Tell me the current phase and what to build next."

"Read AGENTS.md and agent_docs/tech_stack.md. Scaffold the Expo project for Phase 1."

"Read agent_docs/database_schema.md. Create all Supabase tables with RLS policies."

"Read agent_docs/ai_assistant.md. Build the Edge Function and useAutoLinkAI hook."

"Read agent_docs/code_patterns.md. Build the infinite scroll social feed."

"Read agent_docs/testing.md. Run through the smoke test checklist for the current feature."

💡 Context tip: Load only the agent_docs/ file relevant to your current task — not all of them at once. The table at the bottom of CODEX.md shows which file maps to which task.

CODEX.md

Save as: CODEX.md (project root)

CODEX.md — Codex CLI Configuration for AutoLink

Project Context

App: AutoLink — AI-powered car enthusiast platform

Stack: Expo (React Native) + TypeScript | Supabase | OpenAI GPT-4o mini

Stage: MVP Development — 12-week demo build

Developer: Arpit Verma, 2nd year CS @ UBC

---

Directives

**Read `AGENTS.md` first** — it contains the current phase, active tasks, and blockers. Always start here.

**Load context selectively** — only read `agent_docs/` files relevant to the current task; don't load everything at once.

**Plan before coding** — propose a brief plan and wait for approval before making changes.

**One feature at a time** — implement, verify, commit before moving to the next.

**Verify after every change** — run `npm run type-check` and `npm run lint` after each file edit.

**Commit at milestones** — create a git commit after each working feature slice.

**Decision docs require approval** — before writing workflow/product decisions to docs, ask Arpit for explicit permission.

**Where to log decisions after approval** — use `docs/session_state.md` for session-scoped decisions and `AGENTS.md`/`CODEX.md` for persistent process rules.

**Session close-out required** — before ending a session, update `docs/session_state.md` with completed work, blockers, and next 3 tasks (when approval is required, ask first).

**Explain user-side actions step-by-step** — if Arpit needs to do anything manually, provide simple, explicit, non-technical steps.

**Capture persistent instructions** — when Arpit gives instructions that are likely useful in future sessions, ask permission to add them to `AGENTS.md`/`CODEX.md`, then update after approval.

---

Recommended Workflow (Terminal)

Start a Codex session

codex

Good opening prompts:

"Read AGENTS.md and tell me what phase we're on and what to build next"

"Read AGENTS.md and agent_docs/tech_stack.md, then scaffold Phase 1"

"Read agent_docs/database_schema.md and set up the Supabase tables"

Suggested Per-Feature Prompts

Phase 1 start: "Read AGENTS.md and agent_docs/tech_stack.md. Scaffold the Expo project, install all dependencies, and set up the Supabase client."

Auth: "Read agent_docs/tech_stack.md and implement Google OAuth using Supabase Auth."

Database: "Read agent_docs/database_schema.md and create all the Supabase tables with RLS policies."

AI chat: "Read agent_docs/ai_assistant.md and build the Supabase Edge Function and the useAutoLinkAI hook."

Social feed: "Read agent_docs/code_patterns.md and build the infinite scroll social feed with like/comment support."

---

What NOT To Do

Do NOT use any type in TypeScript — ever

Do NOT call OpenAI directly from React Native — use the Supabase Edge Function

Do NOT delete files without explicit confirmation

Do NOT modify database schemas without flagging it first

Do NOT add features outside the current phase

Do NOT expose API keys in client-side code

Do NOT skip npm run lint and npm run type-check after changes

---

Commands

npx expo start                    # Dev server

npx expo start --tunnel           # If phone on different network

npm run lint                      # ESLint — run after every change

npm run type-check                # TypeScript — run after every change

git add -A && git commit -m "..."  # Commit after each feature milestone

npx supabase functions deploy ai-chat   # Deploy AI Edge Function

eas build --platform ios --profile preview    # iOS build

eas build --platform android --profile preview # Android build

---

Context Loading Guide

Load these files based on what you're working on — not all at once:

| Task | Files to load |

|------|--------------|

| Starting / orientation | `AGENTS.md` |

| Setting up the project | `AGENTS.md` + `agent_docs/tech_stack.md` |

| Database work | `agent_docs/database_schema.md` |

| Building components | `agent_docs/code_patterns.md` |

| AI chat feature | `agent_docs/ai_assistant.md` |

| Understanding requirements | `agent_docs/product_requirements.md` |

| Checking conventions | `agent_docs/project_brief.md` |

| Testing / pre-deploy | `agent_docs/testing.md` |

agent_docs/tech_stack.md

Save as: agent_docs/tech_stack.md

Tech Stack & Tools — AutoLink

Core Stack Summary

| Layer | Technology | Version | Purpose |

|-------|------------|---------|---------|

| Mobile Framework | Expo (React Native) | SDK 52+ | iOS + Android from one codebase |

| Language | TypeScript | 5.x | Type-safe JS (your Java background transfers well) |

| Backend/BaaS | Supabase | Latest | Database + Auth + Storage + Edge Functions |

| Database | PostgreSQL (via Supabase) | 15+ | Relational data for users/builds/posts |

| AI API | OpenAI GPT-4o mini | Latest | Car modification AI assistant |

| Vehicle Data | NHTSA vPIC + CarQuery | Free | Make/model/year/specs — no key needed |

| Image Storage | Supabase Storage | Free tier | Car build photos, avatars |

| Push Notifications | Expo Push Notifications | Free | Likes, comments, follows |

| Auth | Supabase Auth (Google OAuth) | — | Social login, no passwords |

| Navigation | Expo Router | v3+ | File-based routing like Next.js |

| Deployment | Expo EAS Build | Free tier | iOS TestFlight + Android APK |

---

Project Setup Commands

1. Install Expo CLI

npm install -g @expo/cli

2. Create AutoLink project

npx create-expo-app AutoLink --template

Select: Blank (TypeScript)

3. Install core dependencies

cd AutoLink

npx expo install expo-router expo-image expo-image-picker expo-av

npx expo install react-native-reanimated react-native-gesture-handler

npx expo install @supabase/supabase-js @react-native-async-storage/async-storage

4. Install UI/chat libraries

npm install react-native-gifted-chat openai

5. Run on phone (scan QR with Expo Go app)

npx expo start

---

Supabase Client Setup

// lib/supabase.ts

import { createClient } from '@supabase/supabase-js';

import AsyncStorage from '@react-native-async-storage/async-storage';

export const supabase = createClient(

  process.env.EXPO_PUBLIC_SUPABASE_URL!,

  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,

  {

    auth: {

      storage: AsyncStorage,

      autoRefreshToken: true,

      persistSession: true,

      detectSessionInUrl: false,

    },

  }

);

---

Key Libraries

Navigation (Expo Router)

// app/(tabs)/index.tsx — file-based routing

// Bottom tabs: (tabs)/ai.tsx, (tabs)/planner.tsx, (tabs)/feed.tsx, (tabs)/profile.tsx

import { Tabs } from 'expo-router';

export default function TabsLayout() {

  return (

    <Tabs>

      <Tabs.Screen name="ai" options={{ title: 'AI', tabBarIcon: ... }} />

      <Tabs.Screen name="planner" options={{ title: 'Planner' }} />

      <Tabs.Screen name="feed" options={{ title: 'Feed' }} />

      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />

    </Tabs>

  );

}

Drag-and-Drop (Reanimated)

import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

import { Gesture, GestureDetector } from 'react-native-gesture-handler';

// Use GestureDetector + Pan gesture for draggable mod cards

AI Chat UI

import { GiftedChat, IMessage } from 'react-native-gifted-chat';

// Mature, production-ready chat component — use this, don't build from scratch

Image Picker (for social posts)

import * as ImagePicker from 'expo-image-picker';

const result = await ImagePicker.launchImageLibraryAsync({

  mediaTypes: ImagePicker.MediaTypeOptions.Images,

  allowsMultipleSelection: true,

  quality: 0.8,

});

---

Environment Variables (.env.local)

EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co

EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

DO NOT put OPENAI_API_KEY here — use Supabase Edge Function instead

---

Folder Structure

AutoLink/

├── app/                    # Expo Router screens

│   ├── (tabs)/

│   │   ├── ai.tsx          # AI Chat screen

│   │   ├── planner.tsx     # Mod Planner screen

│   │   ├── feed.tsx        # Social Feed screen

│   │   └── profile.tsx     # Profile/Garage screen

│   ├── _layout.tsx         # Root layout + auth guard

│   └── onboarding.tsx      # Onboarding flow

├── components/             # Reusable UI components

│   ├── PostCard.tsx

│   ├── ModCard.tsx

│   ├── VehiclePicker.tsx

│   └── AIMessage.tsx

├── lib/

│   ├── supabase.ts         # Supabase client

│   ├── openai.ts           # AI hook (calls Edge Function, not OpenAI directly)

│   └── nhtsa.ts            # NHTSA API helpers

├── data/

│   └── parts_catalog.json  # Mocked ~150 aftermarket parts

├── hooks/

│   ├── useAuth.ts

│   ├── useBuilds.ts

│   └── usePosts.ts

├── supabase/

│   └── functions/

│       └── ai-chat/        # Edge Function for OpenAI proxy

└── agent_docs/             # AI agent documentation (this folder)

---

Free Tier Limits (Feb 2026)

| Service | Free Limit | Risk |

|---------|-----------|------|

| Supabase DB | 500MB storage | Very safe for demo |

| Supabase Storage | 1GB | ~3,000 car photos |

| Supabase Bandwidth | 2GB/month | Fine for 100 users |

| Supabase Auth | Unlimited users | No limit |

| Supabase Edge Functions | 500K invocations/month | Well within demo range |

| Expo EAS Build | 30 builds/month | Plenty for dev cycle |

| NHTSA vPIC | Unlimited | Government API |

| CarQuery | Unlimited (attribution required) | No rate limits at demo scale |

⚠️ **Supabase Pause Warning:** Free tier projects pause after 1 week of inactivity.

Fix: Add a daily health-check ping (cron job or GitHub Action) to keep the project alive.

---

Error Handling Pattern

// Always wrap Supabase calls — never assume they succeed

async function fetchBuilds(userId: string) {

  const { data, error } = await supabase

    .from('builds')

    .select('*, build_items(*)')

    .eq('user_id', userId)

    .order('created_at', { ascending: false });

  if (error) {

    console.error('fetchBuilds error:', error.message);

    // Show user-friendly error, not raw error message

    throw new Error('Could not load your builds. Please try again.');

  }

  return data;

}

---

Naming Conventions

Files: kebab-case.tsx for screens, PascalCase.tsx for components

Types: PascalCase — type UserProfile = { ... }

Hooks: camelCase starting with use — useAuth, useBuilds

Supabase table names: snake_case — build_items, user_profiles

Constants: SCREAMING_SNAKE_CASE — MAX_QUERIES_PER_DAY = 20

No any type — use unknown with type guards, or define interfaces

agent_docs/code_patterns.md

Save as: agent_docs/code_patterns.md

Code Patterns — AutoLink

TypeScript Rules (Non-Negotiable)

// ❌ FORBIDDEN — never use any

const data: any = response.json();

// ✅ CORRECT — use unknown with type guards, or define proper types

type ApiResponse<T> = { data: T | null; error: string | null };

function isUserProfile(val: unknown): val is UserProfile {

  return typeof val === 'object' && val !== null && 'username' in val;

}

---

Component Pattern (Functional + Typed Props)

// components/PostCard.tsx

import { View, Text, Image, Pressable, StyleSheet } from 'react-native';

import { Post } from '../types/database';

type PostCardProps = {

  post: Post;

  onLike: (postId: string) => void;

  isLiked: boolean;

};

export function PostCard({ post, onLike, isLiked }: PostCardProps) {

  return (

    <View style={styles.card}>

      <Text style={styles.username}>{post.profiles.username}</Text>

      {post.image_urls[0] && (

        <Image source={{ uri: post.image_urls[0] }} style={styles.image} />

      )}

      <Pressable onPress={() => onLike(post.id)} style={styles.likeButton}>

        <Text>{isLiked ? '❤️' : '🤍'} {post.likes_count}</Text>

      </Pressable>

    </View>

  );

}

const styles = StyleSheet.create({

  card: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 16, overflow: 'hidden' },

  username: { fontWeight: '600', padding: 12 },

  image: { width: '100%', aspectRatio: 1 },

  likeButton: { padding: 12 },

});

---

Custom Hook Pattern

// hooks/usePosts.ts

import { useState, useEffect } from 'react';

import { supabase } from '../lib/supabase';

import { Post } from '../types/database';

export function usePosts() {

  const [posts, setPosts] = useState<Post[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {

    fetchPosts();

  }, []);

  async function fetchPosts() {

    setLoading(true);

    const { data, error } = await supabase

      .from('posts')

      .select('*, profiles(username, avatar_url)')

      .order('created_at', { ascending: false })

      .limit(20);

    if (error) {

      setError('Could not load posts. Please try again.');

    } else {

      setPosts(data ?? []);

    }

    setLoading(false);

  }

  return { posts, loading, error, refresh: fetchPosts };

}

---

Optimistic UI (Likes)

// Optimistic update — update UI immediately, sync with DB after

async function handleLike(postId: string) {

  // 1. Update UI immediately (feels instant)

  setPosts(prev =>

    prev.map(p =>

      p.id === postId

        ? { ...p, likes_count: p.likes_count + 1, is_liked: true }

        : p

    )

  );

  // 2. Sync with database (may fail silently at demo scale)

  const { error } = await supabase

    .from('likes')

    .insert({ post_id: postId, user_id: currentUser.id });

  // 3. Rollback if failed

  if (error) {

    setPosts(prev =>

      prev.map(p =>

        p.id === postId

          ? { ...p, likes_count: p.likes_count - 1, is_liked: false }

          : p

      )

    );

  }

}

---

Auth Guard Pattern

// app/_layout.tsx

import { useEffect } from 'react';

import { router, Stack } from 'expo-router';

import { supabase } from '../lib/supabase';

export default function RootLayout() {

  useEffect(() => {

    supabase.auth.onAuthStateChange((event, session) => {

      if (!session) {

        router.replace('/onboarding');

      }

    });

  }, []);

  return <Stack />;

}

---

Image Upload Pattern (Social Posts)

async function uploadPostImage(uri: string, userId: string): Promise<string> {

  const fileName = `${userId}/${Date.now()}.jpg`;

  // Convert URI to blob

  const response = await fetch(uri);

  const blob = await response.blob();

  const { data, error } = await supabase.storage

    .from('post-images')

    .upload(fileName, blob, { contentType: 'image/jpeg', upsert: false });

  if (error) throw new Error('Image upload failed');

  const { data: urlData } = supabase.storage

    .from('post-images')

    .getPublicUrl(data.path);

  return urlData.publicUrl;

}

---

NHTSA API Helpers

// lib/nhtsa.ts

const NHTSA_BASE = 'https://vpic.nhtsa.dot.gov/api/vehicles';

export async function getMakesForYear(year: number): Promise<string[]> {

  const res = await fetch(`${NHTSA_BASE}/getallmakes?format=json`);

  const data = await res.json();

  return data.Results.map((r: { MakeName: string }) => r.MakeName).sort();

}

export async function getModelsForMakeYear(make: string, year: number): Promise<string[]> {

  const res = await fetch(

    `${NHTSA_BASE}/getmodelsformakeyear/make/${encodeURIComponent(make)}/modelyear/${year}?format=json`

  );

  const data = await res.json();

  return data.Results.map((r: { Model_Name: string }) => r.Model_Name).sort();

}

export async function decodeVIN(vin: string) {

  const res = await fetch(`${NHTSA_BASE}/decodevinvalues/${vin}?format=json`);

  const data = await res.json();

  return data.Results[0]; // { Make, Model, ModelYear, Trim, EngineCylinders, ... }

}

---

Constants

// lib/constants.ts

export const MAX_AI_QUERIES_PER_DAY = 20;

export const MAX_POST_IMAGES = 5;

export const MAX_GARAGE_VEHICLES = 5;

export const AI_MAX_TOKENS = 500; // Keep costs predictable

export const PARTS_CATEGORIES = [

  'Suspension', 'Exhaust', 'Intake', 'Wheels & Tires',

  'Brakes', 'Exterior', 'Interior', 'Engine', 'Lighting'

] as const;

---

Pre-Commit Hooks Setup

Install husky for pre-commit hooks

npm install --save-dev husky lint-staged

Initialize husky

npx husky init

.husky/pre-commit

#!/bin/sh

npx lint-staged

package.json additions

"lint-staged": {

  "*.{ts,tsx}": ["eslint --fix", "prettier --write"]

},

"scripts": {

  "lint": "eslint . --ext .ts,.tsx",

  "type-check": "tsc --noEmit"

}

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

Build & Deploy

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

Users can only read/write their own data (enforced by RLS, not app logic)

OpenAI API key lives ONLY in Supabase Edge Function environment variables

No passwords ever stored — Google OAuth only for MVP

Image uploads: validate file type and size before uploading

---

Update Cadence

Update AGENTS.md "Current State" section after completing each phase milestone.

Update agent_docs/database_schema.md any time the schema changes.

Update this file when new conventions or constraints are established.

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

  - Typing indicator shown while AI responds

Tech: OpenAI GPT-4o mini via Supabase Edge Function proxy

Feature 2: Visual Modification Planner

Drag-and-drop canvas for planning car mods with cost tracking

User Story: "As a car builder, I want to visually organise all my planned mods in one place — with costs — so I can see my full build at a glance and plan my budget."

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

User Story: "As a car enthusiast, I want to share my build progress and see what others are building so I can get inspired and feel part of a community."

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

User Story: "As a new user, I want to sign in quickly and tell the app what car I drive so every AI answer is relevant to my specific vehicle."

Acceptance Criteria:

  - Sign in with Google (Apple OAuth is optional for MVP)

  - Profile setup: username, display name, avatar

  - Garage: add up to 5 vehicles (year/make/model validated via NHTSA)

  - Vehicle context auto-injected into every AI query

  - Profile page shows user's builds and posts

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

agent_docs/database_schema.md

Save as: agent_docs/database_schema.md

Database Schema — AutoLink

Overview

PostgreSQL database hosted on Supabase. Row Level Security (RLS) must be enabled on all tables.

---

Full Schema SQL

-- ============================================================

-- Run this in Supabase SQL Editor to set up the full schema

-- ============================================================

-- PROFILES (extends Supabase Auth users)

create table profiles (

  id uuid references auth.users primary key,

  username text unique not null,

  display_name text,

  avatar_url text,

  created_at timestamptz default now()

);

-- VEHICLES (user's garage)

create table vehicles (

  id uuid primary key default gen_random_uuid(),

  user_id uuid references profiles(id) on delete cascade,

  make text not null,

  model text not null,

  year int not null,

  trim text,

  is_primary boolean default false,

  created_at timestamptz default now()

);

-- BUILDS (modification plans)

create table builds (

  id uuid primary key default gen_random_uuid(),

  user_id uuid references profiles(id) on delete cascade,

  vehicle_id uuid references vehicles(id),

  title text not null,

  description text,

  is_public boolean default true,

  total_cost numeric default 0,

  created_at timestamptz default now(),

  updated_at timestamptz default now()

);

-- BUILD_ITEMS (individual mods in a build)

create table build_items (

  id uuid primary key default gen_random_uuid(),

  build_id uuid references builds(id) on delete cascade,

  category text not null,        -- 'Suspension', 'Exhaust', etc.

  part_name text not null,

  brand text,

  price numeric,

  notes text,

  position_x float default 0,   -- for drag-and-drop canvas position

  position_y float default 0,

  status text default 'planned', -- 'planned' | 'ordered' | 'installed'

  created_at timestamptz default now()

);

-- POSTS (social feed)

create table posts (

  id uuid primary key default gen_random_uuid(),

  user_id uuid references profiles(id) on delete cascade,

  build_id uuid references builds(id),  -- optional link to a build

  caption text,

  image_urls text[] default '{}',

  likes_count int default 0,

  comments_count int default 0,

  created_at timestamptz default now()

);

-- LIKES

create table likes (

  id uuid primary key default gen_random_uuid(),

  post_id uuid references posts(id) on delete cascade,

  user_id uuid references profiles(id) on delete cascade,

  created_at timestamptz default now(),

  unique(post_id, user_id)              -- one like per user per post

);

-- COMMENTS

create table comments (

  id uuid primary key default gen_random_uuid(),

  post_id uuid references posts(id) on delete cascade,

  user_id uuid references profiles(id) on delete cascade,

  content text not null,

  created_at timestamptz default now()

);

-- FOLLOWS

create table follows (

  id uuid primary key default gen_random_uuid(),

  follower_id uuid references profiles(id) on delete cascade,

  following_id uuid references profiles(id) on delete cascade,

  created_at timestamptz default now(),

  unique(follower_id, following_id)

);

-- AI_QUERY_LOG (for rate limiting — 20 queries/day per user)

create table ai_query_log (

  id uuid primary key default gen_random_uuid(),

  user_id uuid references profiles(id) on delete cascade,

  query_date date default current_date,

  query_count int default 0,

  unique(user_id, query_date)

);

---

Row Level Security (RLS) Policies

-- Enable RLS on all tables

alter table profiles enable row level security;

alter table vehicles enable row level security;

alter table builds enable row level security;

alter table build_items enable row level security;

alter table posts enable row level security;

alter table likes enable row level security;

alter table comments enable row level security;

alter table follows enable row level security;

alter table ai_query_log enable row level security;

-- PROFILES: Anyone can read, only owner can write

create policy "Public profiles are viewable by everyone"

  on profiles for select using (true);

create policy "Users can update their own profile"

  on profiles for update using (auth.uid() = id);

create policy "Users can insert their own profile"

  on profiles for insert with check (auth.uid() = id);

-- VEHICLES: Owner only

create policy "Users can manage their own vehicles"

  on vehicles for all using (auth.uid() = user_id);

-- BUILDS: Public builds viewable by all, owner can manage

create policy "Public builds are viewable"

  on builds for select using (is_public = true or auth.uid() = user_id);

create policy "Users can manage their own builds"

  on builds for insert with check (auth.uid() = user_id);

create policy "Users can update their own builds"

  on builds for update using (auth.uid() = user_id);

create policy "Users can delete their own builds"

  on builds for delete using (auth.uid() = user_id);

-- POSTS: Public viewable, owner can insert/delete

create policy "Posts are publicly viewable"

  on posts for select using (true);

create policy "Users can create posts"

  on posts for insert with check (auth.uid() = user_id);

create policy "Users can delete their own posts"

  on posts for delete using (auth.uid() = user_id);

-- LIKES: Anyone can read, authenticated users can like

create policy "Likes are publicly viewable"

  on likes for select using (true);

create policy "Authenticated users can like"

  on likes for insert with check (auth.uid() = user_id);

create policy "Users can unlike"

  on likes for delete using (auth.uid() = user_id);

-- COMMENTS: Public read, authenticated write

create policy "Comments are publicly viewable"

  on comments for select using (true);

create policy "Authenticated users can comment"

  on comments for insert with check (auth.uid() = user_id);

create policy "Users can delete their own comments"

  on comments for delete using (auth.uid() = user_id);

---

Key TypeScript Types

// types/database.ts — generate these from Supabase CLI or write manually

export type Profile = {

  id: string;

  username: string;

  display_name: string | null;

  avatar_url: string | null;

  created_at: string;

};

export type Vehicle = {

  id: string;

  user_id: string;

  make: string;

  model: string;

  year: number;

  trim: string | null;

  is_primary: boolean;

};

export type Build = {

  id: string;

  user_id: string;

  vehicle_id: string | null;

  title: string;

  description: string | null;

  is_public: boolean;

  total_cost: number;

  build_items?: BuildItem[];

  created_at: string;

};

export type BuildItem = {

  id: string;

  build_id: string;

  category: string;

  part_name: string;

  brand: string | null;

  price: number | null;

  notes: string | null;

  position_x: number;

  position_y: number;

  status: 'planned' | 'ordered' | 'installed';

};

export type Post = {

  id: string;

  user_id: string;

  build_id: string | null;

  caption: string | null;

  image_urls: string[];

  likes_count: number;

  comments_count: number;

  created_at: string;

  profiles: Pick<Profile, 'username' | 'avatar_url'>; // joined

};

---

Tip: Auto-generate Types from Supabase

After schema is set up, generate TypeScript types automatically

npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/supabase.ts

agent_docs/ai_assistant.md

Save as: agent_docs/ai_assistant.md

AI Assistant Implementation — AutoLink

Architecture: Always Via Edge Function

Mobile App → Supabase Edge Function → OpenAI GPT-4o mini

                     ↑

              (API key lives here only)

              (rate limiting enforced here)

              (token capping enforced here)

Never call OpenAI directly from React Native — always proxy through Supabase Edge Function.

---

Supabase Edge Function (ai-chat)

// supabase/functions/ai-chat/index.ts

import OpenAI from 'npm:openai@^4.0.0';

import { createClient } from 'npm:@supabase/supabase-js@^2.0.0';

const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY') });

const SYSTEM_PROMPT = `You are AutoLink AI, an expert automotive modification assistant.

You help car enthusiasts plan modifications, check part compatibility,

and get personalized recommendations for their specific vehicle.

Your Knowledge Areas:

Performance modifications: engines, turbos, exhaust, intake, suspension, brakes

Appearance mods: wheels, body kits, lighting, wraps, tints

Part compatibility: year/make/model/trim fitment verification

Budget planning: cost estimates, parts sourcing recommendations

DIY vs. professional install guidance (skill level estimates)

Safety considerations and legal compliance notes

User's Current Vehicle: {vehicleContext}

Behavior Rules:

Always ask for vehicle year/make/model/trim if not provided

When checking compatibility, explicitly confirm fitment or flag uncertainty

Provide 3 price tiers when possible: budget / mid-range / premium

Recommend reputable brands (KW, Bilstein, Borla, K&N, Mishimoto, etc.)

Flag mods that may void warranty or fail emissions tests

Be encouraging and enthusiastic — you love cars

If asked non-automotive questions, politely redirect

Keep responses concise unless user asks for detail

Respond in a conversational, knowledgeable tone. Use bullet points for part lists.`;

const MAX_QUERIES_PER_DAY = 20;

Deno.serve(async (req) => {

  const { messages, vehicleContext, userId } = await req.json();

  // 1. Initialize Supabase client

  const supabase = createClient(

    Deno.env.get('SUPABASE_URL')!,

    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  );

  // 2. Rate limit check (20 queries/day per user)

  const today = new Date().toISOString().split('T')[0];

  const { data: queryLog } = await supabase

    .from('ai_query_log')

    .select('query_count')

    .eq('user_id', userId)

    .eq('query_date', today)

    .single();

  const currentCount = queryLog?.query_count ?? 0;

  if (currentCount >= MAX_QUERIES_PER_DAY) {

    return new Response(

      JSON.stringify({ error: 'Daily query limit reached. Come back tomorrow!' }),

      { status: 429 }

    );

  }

  // 3. Call OpenAI

  const response = await openai.chat.completions.create({

    model: 'gpt-4o-mini',

    messages: [

      {

        role: 'system',

        content: SYSTEM_PROMPT.replace('{vehicleContext}', vehicleContext ?? 'No vehicle selected')

      },

      ...messages

    ],

    max_tokens: 500,       // Cap to control costs

    temperature: 0.7,

  });

  // 4. Increment query count

  await supabase.from('ai_query_log').upsert({

    user_id: userId,

    query_date: today,

    query_count: currentCount + 1,

  });

  return new Response(

    JSON.stringify({ reply: response.choices[0].message.content }),

    { headers: { 'Content-Type': 'application/json' } }

  );

});

---

React Native AI Hook

// hooks/useAutoLinkAI.ts

import { useState } from 'react';

import { supabase } from '../lib/supabase';

import { useAuth } from './useAuth';

type Message = {

  role: 'user' | 'assistant';

  content: string;

};

export function useAutoLinkAI(vehicleContext: string) {

  const [messages, setMessages] = useState<Message[]>([]);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();

  async function sendMessage(userText: string) {

    const newMessages: Message[] = [...messages, { role: 'user', content: userText }];

    setMessages(newMessages);

    setLoading(true);

    setError(null);

    try {

      const { data, error: fnError } = await supabase.functions.invoke('ai-chat', {

        body: {

          messages: newMessages,

          vehicleContext,

          userId: user?.id,

        },

      });

      if (fnError) throw fnError;

      const reply = data.reply as string;

      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);

      return reply;

    } catch (err) {

      const msg = err instanceof Error ? err.message : 'AI is unavailable. Please try again.';

      setError(msg);

    } finally {

      setLoading(false);

    }

  }

  function clearHistory() {

    setMessages([]);

  }

  return { messages, loading, error, sendMessage, clearHistory };

}

---

Cost Estimation (Demo Scale)

Assumptions: 100 users, 10 queries/day each, avg 300 input + 400 output tokens per query.

| Metric | Calculation | Result |

|--------|-------------|--------|

| Daily queries | 100 × 10 | 1,000/day |

| Daily input tokens | 1,000 × 300 | 300K tokens |

| Daily output tokens | 1,000 × 400 | 400K tokens |

| Monthly input tokens | 300K × 30 | 9M tokens |

| Monthly output tokens | 400K × 30 | 12M tokens |

| Input cost (GPT-4o mini) | 9M × $0.15/M | $1.35 |

| Output cost (GPT-4o mini) | 12M × $0.60/M | $7.20 |

| **Total AI cost** | | **~$8.55/month** |

| With system prompt caching | ~50% off input | **~$5–6/month** |

Budget status: Well within $25/month cap.

---

Cost Controls

**max_tokens: 500** on every call — prevents runaway long responses

**20 queries/day** per user limit — enforced in Edge Function

**System prompt caching** — OpenAI caches repeated system prompts automatically after ~1,024 tokens; keep your system prompt stable

**Pre-generate common answers** — for the 20 most-asked questions (e.g. "best coilovers for 2019 Civic"), cache in Supabase and return instantly without API call

agent_docs/testing.md

Save as: agent_docs/testing.md

Testing Strategy — AutoLink

Philosophy

This is a demo-phase app. The goal is "it works reliably for a recruiter demo," not production-grade test coverage. Focus on manual smoke tests + TypeScript type safety to catch most bugs.

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

☐ Tap "Sign in with Google" → Google OAuth opens → redirects back → profile screen appears

☐ Sign out → landing screen appears

☐ Sign back in → session restored automatically

Garage flow:

☐ Add vehicle → year picker → make dropdown (from NHTSA) → model dropdown → save

☐ Vehicle appears on profile page

☐ Vehicle context appears in AI chat header

AI Chat flow:

☐ Type "What coilovers fit my [vehicle]?" → response within 5 seconds

☐ Response includes budget tiers

☐ Typing indicator appears while waiting

☐ Send 21 messages in one day → 21st gets rate limit error message

Mod Planner flow:

☐ Browse parts catalog → filter by category

☐ Drag a part card → drops into zone → cost updates

☐ Build auto-saves to Supabase (verify in Supabase dashboard)

☐ Tap "Share to Feed" → post appears in feed

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

"lint-staged": {

  "*.{ts,tsx}": [

    "eslint --fix",

    "prettier --write"

  ]

}

The pre-commit hook runs automatically before every git commit. Do not bypass it (--no-verify) unless there's a documented emergency.

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

Common Issues & Fixes

| Issue | Likely Cause | Fix |

|-------|-------------|-----|

| Supabase project paused | Free tier inactivity | Add GitHub Action to ping project daily |

| AI returning generic answers | Missing vehicle context | Check vehicleContext is passed to Edge Function |

| Image upload failing | Bucket RLS policy | Check storage bucket policies in Supabase dashboard |

| Drag-and-drop janky | Missing gesture handler setup | Ensure GestureHandlerRootView wraps app root |

| Auth not persisting | AsyncStorage not configured | Check supabase client `storage: AsyncStorage` setting |

| "Network request failed" | Dev server and phone not on same WiFi | Use `--tunnel` flag: `npx expo start --tunnel` |

---

Before Demo Day Checklist

☐ All 4 P0 features work end-to-end on a physical device

☐ App loads in < 2 seconds on a mid-range Android

☐ AI responses consistently arrive in < 5 seconds

☐ Feed is seeded with 10–15 realistic-looking posts

☐ At least 5 beta testers (friends/classmates) have used the app

☐ No console.error messages during normal usage

☐ App icon and splash screen are set

☐ Onboarding flow is complete (3 screens)

☐ Deployed to TestFlight or shareable APK link ready

☐ Screen recording of the full demo flow ready as backup

AutoLink • Codex CLI Config + Docs • February 2026 • Arpit Verma @ UBC
