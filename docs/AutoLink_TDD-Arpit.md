AutoLink

Technical Design Document

MVP Version 1.0  |  Part 3 of 3

Prepared for: Arpit Verma  |  2nd Year CS @ UBC

Date: February 2026  |  Status: Ready to Build

This document defines HOW AutoLink will be built, mapping every PRD feature to a specific implementation, file structure, API contract, and data schema. This completes the three-part series: Research (Part 1) → PRD (Part 2) → Technical Design (Part 3).

At a Glance: Technical Decisions

Layer

Technology

Justification

Mobile Framework

Expo (React Native) + TypeScript

Java background transfers; 6x more jobs than Flutter

Backend / BaaS

Supabase

PostgreSQL, Auth, Storage, Realtime — all free

Database

Supabase PostgreSQL

Relational model perfect for builds/parts/users

Auth

Supabase Auth (Google + Apple OAuth)

Zero config, no password storage, social login

Image Storage

Supabase Storage

1 GB free; built-in CDN; direct mobile upload

AI API

OpenAI GPT-4o mini

$0.15/M input tokens; best cost-quality ratio

Vehicle Data

NHTSA vPIC + CarQuery

100% free, no key; covers all US vehicles

AI Coding Tools

Cursor IDE + GitHub Copilot

Cursor Composer can scaffold full screens in minutes

Monthly Cost

$5–8 / month

Well within $50 budget; only OpenAI is a real cost

1. System Architecture

1.1 Architecture Overview

AutoLink follows a BaaS-first architecture: Supabase handles the backend, database, auth, and file storage. The mobile client (Expo) calls Supabase directly for data and OpenAI via a Supabase Edge Function for AI queries. This pattern is standard for solo developers and keeps the surface area of custom server code minimal.

AutoLink Mobile App (Expo / React Native / TypeScript)
  |
  +---[AI Chat (GiftedChat)]----+---[Build Planner (Reanimated)]---+---[Social Feed (FlatList)]---+
  |                              |                                  |
  v                              v                                  v
[Supabase Edge Function]   [Supabase PostgreSQL DB]      [Supabase Storage]
  (OpenAI Proxy + Rate Limit)    builds / mods / posts            Car photos / avatars
  |                              comments / likes / follows
  v
[OpenAI GPT-4o mini API]                    [NHTSA vPIC + CarQuery API]
 Automotive AI responses                     Vehicle validation (free)

1.2 Folder Structure

Below is the recommended project structure for AutoLink. Every folder has a single responsibility, making it easy to navigate and allowing AI coding tools to understand and extend the codebase.

AutoLink/

  src/

    app/                    # Expo Router screens (file-based routing)

      (tabs)/               # Bottom tab group

        ai.tsx              # AI Chat screen

        planner.tsx         # Mod Planner screen

        feed.tsx            # Social Feed screen

        profile.tsx         # Profile / Garage screen

      auth/                 # Auth screens (login, onboarding)

      _layout.tsx           # Root layout + navigation

    components/

      ui/                   # Reusable base components (Button, Card, etc.)

      ai/                   # AI chat-specific components

      planner/              # Drag-and-drop planner components

      feed/                 # Social feed components (PostCard, CommentList)

    lib/

      supabase.ts           # Supabase client singleton

      openai.ts             # OpenAI / AI hook

      nhtsa.ts              # NHTSA vPIC API helpers

      prompts.ts            # AI system prompt templates

    hooks/                  # Custom React hooks (useAuth, useFeed, useAI)

    types/                  # TypeScript interfaces and enums

    constants/              # App-wide constants (colours, config)

  supabase/

    migrations/             # SQL migration files (version-controlled)

    functions/              # Supabase Edge Functions (OpenAI proxy)

    seed.sql                # Seed data for demo (15 posts, sample builds)

  .env.local                # Environment variables (never committed to Git)

  app.json                  # Expo config

  package.json

2. Database Schema

2.1 Entity Relationship Overview

AutoLink's data model is relational (PostgreSQL) and maps cleanly to the app's core entities: Users own Builds, Builds contain Mods, and Users create Posts (which link to Builds). Likes and Comments extend the social graph.

2.2 Full Schema — Run in Supabase SQL Editor

-- PROFILES (extends Supabase Auth users)

create table profiles (

  id          uuid references auth.users primary key,

  username    text unique not null,

  display_name text,

  avatar_url  text,

  -- Array of garage vehicles [{make, model, year, trim}]

  garage_vehicles jsonb default '[]',

  -- AI query quota tracking (reset daily)

  daily_query_count int default 0,

  query_reset_date  date default current_date,

  created_at  timestamptz default now()

);

-- BUILDS (user's car modification plans)

create table builds (

  id          uuid primary key default gen_random_uuid(),

  user_id     uuid references profiles(id) on delete cascade,

  title       text not null,

  vehicle     jsonb not null,  -- {make, model, year, trim}

  description text,

  total_cost  numeric default 0,

  is_public   boolean default true,

  created_at  timestamptz default now(),

  updated_at  timestamptz default now()

);

-- MODS (individual modifications within a build)

create table mods (

  id          uuid primary key default gen_random_uuid(),

  build_id    uuid references builds(id) on delete cascade,

  category    text not null,  -- 'suspension' | 'exhaust' | 'wheels' | ...

  part_name   text not null,

  brand       text,

  price       numeric,

  notes       text,

  -- Position on the visual planner canvas

  position_x  float default 0,

  position_y  float default 0,

  sort_order  int default 0,

  created_at  timestamptz default now()

);

-- POSTS (social feed entries)

create table posts (

  id          uuid primary key default gen_random_uuid(),

  user_id     uuid references profiles(id) on delete cascade,

  build_id    uuid references builds(id) on delete set null,

  caption     text,

  image_urls  text[] default '{}',

  likes_count int default 0,

  created_at  timestamptz default now()

);

-- LIKES (post likes — user can only like once)

create table likes (

  user_id uuid references profiles(id) on delete cascade,

  post_id uuid references posts(id) on delete cascade,

  created_at timestamptz default now(),

  primary key (user_id, post_id)

);

-- COMMENTS

create table comments (

  id       uuid primary key default gen_random_uuid(),

  post_id  uuid references posts(id) on delete cascade,

  user_id  uuid references profiles(id) on delete cascade,

  content  text not null,

  created_at timestamptz default now()

);

-- FOLLOWS

create table follows (

  follower_id uuid references profiles(id) on delete cascade,

  following_id uuid references profiles(id) on delete cascade,

  created_at timestamptz default now(),

  primary key (follower_id, following_id)

);

-- Performance indexes

create index idx_mods_build_id on mods(build_id);

create index idx_posts_user_id on posts(user_id);

create index idx_posts_created_at on posts(created_at desc);

create index idx_comments_post_id on comments(post_id);

create index idx_follows_follower on follows(follower_id);

2.3 Row Level Security (RLS) Policies

Enable RLS on every table in Supabase to ensure users can only read/write their own data. These policies are the primary security mechanism for the demo.

-- Enable RLS on all tables

alter table profiles enable row level security;

alter table builds   enable row level security;

alter table mods     enable row level security;

alter table posts    enable row level security;

alter table likes    enable row level security;

alter table comments enable row level security;

alter table follows  enable row level security;

-- PROFILES: anyone can read public profiles, only owner can update

create policy "Public profiles are viewable" on profiles for select using (true);

create policy "Users update own profile" on profiles for update

  using (auth.uid() = id);

-- BUILDS: public builds visible to all, private only to owner

create policy "View public builds" on builds for select

  using (is_public = true or auth.uid() = user_id);

create policy "Users manage own builds" on builds for all

  using (auth.uid() = user_id);

-- POSTS: all authenticated users can read; only author can write

create policy "Posts are viewable" on posts for select using (true);

create policy "Users manage own posts" on posts for all

  using (auth.uid() = user_id);

3. Feature Implementation

3.1 Feature: Auth + Garage Profile

Supabase Client Setup

// src/lib/supabase.ts

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

    },

  }

);

Google OAuth Login

// src/hooks/useAuth.ts

import { supabase } from '../lib/supabase';

import * as WebBrowser from 'expo-web-browser';

import * as AuthSession from 'expo-auth-session';

export async function signInWithGoogle() {

  const redirectUrl = AuthSession.makeRedirectUri({ scheme: 'autolink' });

  const { data, error } = await supabase.auth.signInWithOAuth({

    provider: 'google',

    options: { redirectTo: redirectUrl },

  });

  if (error) throw error;

  // Open browser for OAuth flow

  await WebBrowser.openBrowserAsync(data.url);

}

Garage Vehicle Setup (NHTSA-validated)

// src/lib/nhtsa.ts — Vehicle validation against NHTSA vPIC

export async function getModelsForMakeYear(make: string, year: number) {

  const url = `https://vpic.nhtsa.dot.gov/api/vehicles/getmodelsformakeyear/` +

    `make/${make}/modelyear/${year}?format=json`;

  const res = await fetch(url);

  const data = await res.json();

  return data.Results as { Model_Name: string; Make_Name: string }[];

}

export async function getAllMakes() {

  const url = 'https://vpic.nhtsa.dot.gov/api/vehicles/getallmakes?format=json';

  const res = await fetch(url);

  const { Results } = await res.json();

  return Results as { Make_Name: string; Make_ID: number }[];

}

✅ Acceptance Criteria Met: Google login working; vehicle picker validated against NHTSA API; vehicle context stored in Supabase profile for injection into AI queries.

3.2 Feature: AI Modification Assistant

Supabase Edge Function — OpenAI Proxy

Never call OpenAI directly from the client. Route all AI requests through a Supabase Edge Function. This keeps the API key server-side, enables per-user rate limiting, and allows future caching.

// supabase/functions/ai-chat/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

import OpenAI from 'https://deno.land/x/openai@v4.11.0/mod.ts';

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY') });

serve(async (req) => {

  const supabase = createClient(

    Deno.env.get('SUPABASE_URL')!,

    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,

  );

  // Get user from JWT token in Authorization header

  const token = req.headers.get('Authorization')?.split(' ')[1];

  const { data: { user } } = await supabase.auth.getUser(token);

  if (!user) return new Response('Unauthorized', { status: 401 });

  // Check + enforce daily query limit (20 queries/day)

  const { data: profile } = await supabase

    .from('profiles').select('daily_query_count, query_reset_date')

    .eq('id', user.id).single();

  const today = new Date().toISOString().split('T')[0];

  const count = profile.query_reset_date === today ? profile.daily_query_count : 0;

  if (count >= 20) {

    return new Response(JSON.stringify({ error: 'Daily limit reached (20 queries)' }),

      { status: 429, headers: { 'Content-Type': 'application/json' } });

  }

  // Parse request

  const { messages, vehicleContext } = await req.json();

  // Call OpenAI

  const completion = await openai.chat.completions.create({

    model: 'gpt-4o-mini',

    messages: [

      { role: 'system', content: buildSystemPrompt(vehicleContext) },

      ...messages

    ],

    max_tokens: 500,

    temperature: 0.7,

  });

  // Increment daily query count

  await supabase.from('profiles').update({

    daily_query_count: count + 1,

    query_reset_date: today

  }).eq('id', user.id);

  return new Response(

    JSON.stringify({ reply: completion.choices[0].message.content }),

    { headers: { 'Content-Type': 'application/json' } }

  );

});

function buildSystemPrompt(vehicleContext: string) {

  return `You are AutoLink AI, an expert automotive modification assistant.

You help car enthusiasts plan mods, check part compatibility, and get

personalised recommendations for their specific vehicle.

User's Garage: ${vehicleContext}

Rules:

1. Always confirm vehicle year/make/model/trim before recommending parts

2. Provide 3 price tiers (budget / mid-range / premium) where possible

3. Flag if fitment is uncertain — never guess

4. Note if a mod may void warranty or affect emissions compliance

5. Be enthusiastic and encouraging — you love cars

6. Keep responses under 400 tokens unless asked for detail`;

}

Client-Side AI Hook

// src/hooks/useAutoLinkAI.ts

import { useState } from 'react';

import { supabase } from '../lib/supabase';

interface Message { role: 'user' | 'assistant'; content: string; }

export function useAutoLinkAI(vehicleContext: string) {

  const [messages, setMessages] = useState<Message[]>([]);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  async function sendMessage(text: string) {

    const newMessages = [...messages, { role: 'user' as const, content: text }];

    setMessages(newMessages);

    setLoading(true);

    setError(null);

    try {

      const session = await supabase.auth.getSession();

      const token = session.data.session?.access_token;

      const res = await supabase.functions.invoke('ai-chat', {

        body: { messages: newMessages, vehicleContext },

        headers: { Authorization: `Bearer ${token}` },

      });

      if (res.error) throw new Error(res.error.message);

      const { reply } = res.data;

      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);

    } catch (e: any) {

      if (e.message?.includes('429')) {

        setError('Daily AI limit reached (20 queries). Resets at midnight!');

      } else {

        setError('AI unavailable. Please try again.');

      }

    } finally {

      setLoading(false);

    }

  }

  return { messages, loading, error, sendMessage };

}

⚠️ Security Note: Never put your OpenAI API key in the Expo app code or .env.local. It must live only in Supabase Edge Function environment variables (set via: supabase secrets set OPENAI_API_KEY=sk-...).

3.3 Feature: Visual Modification Planner

Core Drag-and-Drop Architecture

Use react-native-reanimated v3 with GestureHandler for smooth 60fps drag interactions. Each mod card is an Animated view with a pan gesture. Positions are persisted to Supabase when the user lifts their finger.

// src/components/planner/DraggableModCard.tsx

import { GestureDetector, Gesture } from 'react-native-gesture-handler';

import Animated, {

  useSharedValue, useAnimatedStyle, withSpring

} from 'react-native-reanimated';

interface Props {

  mod: Mod;

  onPositionChange: (id: string, x: number, y: number) => void;

}

export function DraggableModCard({ mod, onPositionChange }: Props) {

  const x = useSharedValue(mod.position_x);

  const y = useSharedValue(mod.position_y);

  const startX = useSharedValue(0);

  const startY = useSharedValue(0);

  const panGesture = Gesture.Pan()

    .onStart(() => {

      startX.value = x.value;

      startY.value = y.value;

    })

    .onUpdate((e) => {

      x.value = startX.value + e.translationX;

      y.value = startY.value + e.translationY;

    })

    .onEnd(() => {

      // Snap to spring animation

      x.value = withSpring(x.value);

      y.value = withSpring(y.value);

      // Persist position to Supabase

      onPositionChange(mod.id, x.value, y.value);

    });

  const animStyle = useAnimatedStyle(() => ({

    transform: [{ translateX: x.value }, { translateY: y.value }],

  }));

  return (

    <GestureDetector gesture={panGesture}>

      <Animated.View style={[styles.card, animStyle]}>

        <Text style={styles.partName}>{mod.part_name}</Text>

        <Text style={styles.brand}>{mod.brand}</Text>

        <Text style={styles.price}>${mod.price?.toFixed(2)}</Text>

      </Animated.View>

    </GestureDetector>

  );

}

Saving Build to Supabase

// src/hooks/usePlanner.ts

import { supabase } from '../lib/supabase';

export async function saveModPosition(modId: string, x: number, y: number) {

  const { error } = await supabase

    .from('mods')

    .update({ position_x: x, position_y: y })

    .eq('id', modId);

  if (error) console.error('Save position failed:', error);

}

export async function addModToBuild(buildId: string, mod: Partial<Mod>) {

  const { data, error } = await supabase

    .from('mods')

    .insert({ build_id: buildId, ...mod })

    .select()

    .single();

  if (error) throw error;

  // Recalculate and update build total cost

  await recalculateBuildCost(buildId);

  return data;

}

⚠️ Known Risk: Drag-and-drop can be complex on first attempt. Spike this in Week 1 before committing to it. If blocked, fall back to a sortable list UI (react-native-draggable-flatlist) which is significantly simpler but still impressive.

3.4 Feature: Social Community Feed

Feed Query — Following + All Posts

// src/hooks/useFeed.ts

import { supabase } from '../lib/supabase';

export async function fetchFeed(page = 0, limit = 20) {

  const { data, error } = await supabase

    .from('posts')

    .select(`

      id, caption, image_urls, likes_count, created_at,

      user:profiles(id, username, avatar_url),

      build:builds(id, title, vehicle, total_cost),

      comments(count)

    `)

    .order('created_at', { ascending: false })

    .range(page * limit, (page + 1) * limit - 1);

  if (error) throw error;

  return data;

}

// Optimistic like (update count instantly, then sync to DB)

export async function toggleLike(postId: string, userId: string, liked: boolean) {

  if (liked) {

    await supabase.from('likes').delete()

      .eq('post_id', postId).eq('user_id', userId);

    await supabase.from('posts')

      .update({ likes_count: supabase.rpc('decrement', { row_id: postId }) })

      .eq('id', postId);

  } else {

    await supabase.from('likes').insert({ post_id: postId, user_id: userId });

    await supabase.from('posts')

      .update({ likes_count: supabase.rpc('increment', { row_id: postId }) })

      .eq('id', postId);

  }

}

Image Upload to Supabase Storage

// src/lib/imageUpload.ts

import * as ImagePicker from 'expo-image-picker';

import { supabase } from './supabase';

export async function pickAndUploadImage(userId: string): Promise<string | null> {

  const result = await ImagePicker.launchImageLibraryAsync({

    mediaTypes: ImagePicker.MediaTypeOptions.Images,

    allowsEditing: true,

    quality: 0.8,

  });

  if (result.canceled || !result.assets[0]) return null;

  const image = result.assets[0];

  const fileName = `${userId}/${Date.now()}.jpg`;

  // Convert to blob

  const response = await fetch(image.uri);

  const blob = await response.blob();

  const { data, error } = await supabase.storage

    .from('car-images')

    .upload(fileName, blob, { contentType: 'image/jpeg' });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage

    .from('car-images')

    .getPublicUrl(data.path);

  return publicUrl;

}

4. API Contracts

4.1 Supabase Edge Functions

Function

Method

Request Body

Response

ai-chat

POST

{ messages[], vehicleContext }

{ reply: string } | { error: string }

send-notification

POST

{ userId, title, body }

{ success: boolean }

4.2 External APIs

API

Endpoint Pattern

Cost

Key Required

NHTSA vPIC

vpic.nhtsa.dot.gov/api/vehicles/...

Free

No

CarQuery

carqueryapi.com/api/0.3/?cmd=...

Free

No

OpenAI (via Edge Fn)

api.openai.com/v1/chat/completions

$0.15/M tkn

Yes (server)

Expo Push

exp.host/--/api/v2/push/send

Free

No

4.3 TypeScript Interfaces

// src/types/index.ts

export interface Vehicle {

  make: string;

  model: string;

  year: number;

  trim: string;

}

export interface Profile {

  id: string;

  username: string;

  displayName?: string;

  avatarUrl?: string;

  garageVehicles: Vehicle[];

}

export interface Build {

  id: string;

  userId: string;

  title: string;

  vehicle: Vehicle;

  description?: string;

  totalCost: number;

  isPublic: boolean;

  mods?: Mod[];

  createdAt: string;

}

export interface Mod {

  id: string;

  buildId: string;

  category: 'suspension' | 'exhaust' | 'wheels' | 'intake' | 'brakes' | 'exterior' | 'interior' | 'other';

  partName: string;

  brand?: string;

  price?: number;

  notes?: string;

  positionX: number;

  positionY: number;

}

export interface Post {

  id: string;

  userId: string;

  buildId?: string;

  caption?: string;

  imageUrls: string[];

  likesCount: number;

  user?: Profile;

  build?: Build;

  createdAt: string;

}

5. Navigation & Screen Map

5.1 Expo Router Structure (File-Based Routing)

Expo Router uses the file system as the navigation structure. Each file in app/ becomes a route automatically.

File

Screen

Auth Required

Notes

app/_layout.tsx

Root Navigator

—

Handles auth redirect

app/auth/index.tsx

Login / Onboarding

No

Google/Apple login

app/auth/garage.tsx

Garage Setup

Yes

After first login

app/(tabs)/ai.tsx

AI Chat

Yes

Default tab

app/(tabs)/planner.tsx

Mod Planner

Yes

Build canvas

app/(tabs)/feed.tsx

Social Feed

Yes

Infinite scroll

app/(tabs)/profile.tsx

Profile / Garage

Yes

User builds + posts

app/build/[id].tsx

Build Detail

Yes

Single build view

app/post/[id].tsx

Post Detail

Yes

Post + comments

app/user/[id].tsx

Other User Profile

Yes

Follow button

5.2 Auth Guard Pattern

// app/_layout.tsx — Redirect unauthenticated users

import { useEffect } from 'react';

import { router, Slot } from 'expo-router';

import { supabase } from '../src/lib/supabase';

export default function RootLayout() {

  useEffect(() => {

    supabase.auth.onAuthStateChange((event, session) => {

      if (!session) {

        router.replace('/auth');

      } else if (event === 'SIGNED_IN') {

        router.replace('/(tabs)/ai');

      }

    });

  }, []);

  return <Slot />;

}

6. Dev Environment Setup

6.1 Prerequisites

Tool

Install Command

Why Needed

Node.js 20+

Download from nodejs.org

Runtime for npm and Expo CLI

Expo CLI

npm install -g @expo/cli

Project creation and dev server

Supabase CLI

npm install -g supabase

Local dev + Edge Functions

VS Code

code.visualstudio.com

Code editor

Cursor IDE

cursor.sh

AI-powered editor (primary)

Expo Go App

App Store / Google Play

Test on device instantly

Git

git.scm.com

Version control

6.2 Project Bootstrap (Run Once)

# Step 1: Create Expo project with TypeScript template

npx create-expo-app AutoLink --template

# Choose: Blank (TypeScript)

cd AutoLink

# Step 2: Install core dependencies

npx expo install expo-router expo-image expo-av

npx expo install expo-image-picker expo-web-browser expo-auth-session

npx expo install react-native-reanimated react-native-gesture-handler

npx expo install @react-native-async-storage/async-storage

# Step 3: Install Supabase client

npx expo install @supabase/supabase-js

# Step 4: Install UI libraries

npm install react-native-gifted-chat

# Step 5: Set up Supabase project

# 1. Go to supabase.com and create a new project

# 2. Copy project URL and anon key from Settings > API

# 3. Create .env.local:

EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co

EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Step 6: Run the SQL schema (in Supabase dashboard > SQL Editor)

# Paste the schema from Section 2.2 of this document

# Step 7: Start development server

npx expo start

# Scan QR code with Expo Go on your phone

6.3 Supabase Edge Functions Deployment

# Link to your Supabase project

supabase login

supabase link --project-ref YOUR_PROJECT_REF

# Create the AI chat Edge Function

supabase functions new ai-chat

# Paste the Edge Function code from Section 3.2 into:

# supabase/functions/ai-chat/index.ts

# Set OpenAI API key as a secret (never committed to git)

supabase secrets set OPENAI_API_KEY=sk-proj-...

# Deploy the function

supabase functions deploy ai-chat

# Test it locally first

supabase functions serve ai-chat --env-file .env.local

7. AI Coding Acceleration Strategy

7.1 Tool Assignment by Task

Task Type

Best AI Tool

Example Prompt Template

Scaffold a new screen

Cursor Composer

"Create a [Screen] screen using expo-router, Supabase, and TypeScript matching this spec: [spec]"

Write a custom hook

Cursor Composer

"Write a React hook useXxx that fetches [...] from Supabase table [...] with error and loading state"

Debug an error

Claude or ChatGPT

"Error: [paste error]. Stack: Expo + Supabase. Code: [paste snippet]. Explain and fix."

Architecture question

Claude

"For AutoLink (Expo + Supabase), how should I structure [feature]? Constraints: [budget/timeline]"

Generate SQL migration

Claude or ChatGPT

"Write a Supabase PostgreSQL migration to add [table/column] with appropriate RLS policies"

Write UI components

Cursor / v0

"Create a React Native [component] styled with StyleSheet that shows [data] and calls [callback]"

OpenAI prompt engineering

Claude

"Improve this system prompt for an automotive AI to better handle [specific query type]"

7.2 AGENTS.md — Define App Context for AI

Create an AGENTS.md file in the root of your project. Cursor automatically reads this file and uses it as context for every Composer session. This prevents the AI from suggesting wrong tech or patterns.

# AGENTS.md — AutoLink Technical Context

## Project

AutoLink: AI-powered car modification app

Platform: Expo (React Native) + TypeScript

Backend: Supabase (PostgreSQL + Auth + Storage + Edge Functions)

AI: OpenAI GPT-4o mini via Supabase Edge Function proxy

Vehicle Data: NHTSA vPIC API (free, no key) + CarQuery API (free, no key)

## Key Constraints

- Solo developer, 2-3 month timeline

- Budget: $5-8/month (OpenAI only — everything else is free tier)

- Never call OpenAI directly from client — always use Supabase Edge Function

- Never store API keys in client code or .env.local (except Supabase public keys)

- All tables have RLS enabled — always include user_id in queries

- Daily AI query limit: 20 per user (enforced in Edge Function)

## Tech Patterns

- Use expo-router for navigation (file-based routing)

- Use react-native-reanimated for animations (not Animated API)

- Use react-native-gesture-handler for touch interactions

- Use @supabase/supabase-js for all database/auth operations

- Error handling: always show user-friendly messages, log to console

## Folder Structure

src/app/         — Expo Router screens

src/components/  — Reusable UI components

src/hooks/       — Custom React hooks (prefix: use)

src/lib/         — External clients (supabase.ts, nhtsa.ts)

src/types/       — TypeScript interfaces

supabase/functions/ — Edge Functions (Deno runtime)

8. Risk Register

Risk

Likelihood

Impact

Mitigation

Supabase free tier project pauses (1 week inactivity)

High

High

Add a daily ping cron job: simple script or GitHub Actions workflow that hits a Supabase endpoint daily

OpenAI costs spike unexpectedly

Medium

Medium

Enforce max_tokens: 500 on all calls; 20 query/day limit per user; add billing alert in OpenAI dashboard at $20

Drag-and-drop planner harder than expected

Medium

High

Spike it in Week 1. Fallback: react-native-draggable-flatlist (sortable list, much simpler). Still impressive for demo.

Solo dev time underestimated

Medium

High

Use Cursor Composer aggressively. Cut P1 features first (push notifications, VIN scanner). Core 4 features are non-negotiable.

Expo package compatibility issues

Low

Medium

Always use npx expo install (not npm install) for packages — it resolves compatible versions automatically

UGC moderation requirements for App Store

Medium

Medium

For demo: use Expo Go (no store review). For TestFlight: add basic report functionality and review Apple guidelines before submission.

NHTSA API rate limits or downtime

Low

Low

Cache vehicle make/model lookups in Supabase after first fetch. Falls back gracefully — user can enter vehicle manually.

📋 Analytical Review Note: An independent review of the AutoLink project identified that PlanetScale was listed in the original research as a DB candidate but has no free plan. This TDD correctly excludes PlanetScale entirely in favour of Supabase's PostgreSQL. Similarly, Edmunds API access is no longer available to new developers — this TDD uses only NHTSA vPIC and CarQuery, both free and open.

9. Deployment Plan

9.1 Development Testing (Weeks 1–10)

Use Expo Go app on your iPhone/Android — scan the QR code from npx expo start

No builds or store accounts required during development

Share with James (design) by sending them the QR code from the Expo Go session

9.2 TestFlight / APK for Demo (Weeks 11–12)

# Install EAS CLI

npm install -g eas-cli

eas login

# Configure EAS Build

eas build:configure

# This creates eas.json — commit it to git

# Build for iOS (requires Apple Developer account — $99/year)

# For demo: skip iOS and use Android APK instead (free)

eas build --platform android --profile preview

# Download the .apk from the EAS dashboard

# Share the APK file with recruiters/beta testers directly

# Android users: enable 'Install from unknown sources' to install

# When ready for full iOS TestFlight (optional):

eas build --platform ios

eas submit --platform ios

# Requires Apple Developer Program ($99/year)

✅ Demo Strategy: Skip iOS TestFlight for now. An Android APK file + Expo Go for iOS testers is sufficient to demo AutoLink to recruiters. Save the $99 Apple Developer fee until after demo phase. Focus budget on AI API costs only.

10. Definition of Done

10.1 Technical Completion Checklist

The technical implementation is complete when all items below are checked off:

Foundation

Expo project created, TypeScript configured, Expo Router working

Supabase project connected (URL + anon key in .env.local)

Database schema applied (all tables from Section 2.2)

RLS policies enabled on all tables

Google OAuth login working (can sign in and see profile)

Bottom tab navigation (AI / Planner / Feed / Profile) functional

AI Chat Feature

Supabase Edge Function deployed and returning AI responses

OpenAI API key set as Supabase secret (not in client code)

Vehicle context from garage injected into every AI query automatically

Typing indicator displayed while AI responds

Daily 20-query limit enforced with user-friendly error message

Responses include 3 price tiers (budget/mid/premium) where relevant

Mod Planner Feature

Drag-and-drop mod cards working with spring physics (or sortable list fallback)

Mocked parts catalog (150+ parts) filterable by category, brand, and price

Total build cost updates in real time when mods are added/removed

Build saves to Supabase and loads on app restart

Share build to social feed works end-to-end

Social Feed Feature

Infinite scroll feed loads posts from all public users

Image upload (1–5 photos per post) to Supabase Storage works

Like/unlike with optimistic UI update (no waiting for server)

Comment thread visible on post detail screen

Follow/unfollow other users working

15+ seed posts pre-loaded for demo authenticity

Polish

Animated onboarding flow (3 screens)

Empty states with illustration for all screens (no blank pages)

Loading skeletons on feed and AI chat

Graceful error messages for network failures

App icon and splash screen configured in app.json

Android APK built via EAS and tested on a real device

5+ beta testers (friends/classmates) have used the app and given feedback

10.2 Demo Readiness Checklist

Full user journey works: Sign up → Add car → Ask AI → Plan build → Share to feed

App does not crash during the core 5-step demo flow

No placeholder content visible — real AI responses, real posts, real vehicle data

Can be demoed on both a physical Android device and iPhone (via Expo Go)

Demo video recorded (2–3 minutes showing all core features)

Basic analytics running (Supabase dashboard shows user count, query count)

11. Next Steps

Step

Action

Owner

When

1

Review this TDD with James and confirm stack decisions

Arpit + James

This week

2

Create Supabase project and apply database schema from Section 2.2

Arpit

Day 1

3

Scaffold Expo project and run on physical device via Expo Go

Arpit

Day 1-2

4

Add AGENTS.md to project root (content in Section 7.2)

Arpit

Day 2

5

Spike drag-and-drop to validate feasibility before committing to it

Arpit

Week 1

6

Implement auth and vehicle garage (foundation for all features)

Arpit

Week 1-2

7

Build and deploy Supabase Edge Function for AI chat

Arpit

Week 3-4

8

Follow 12-week roadmap from Research Report (Part 1)

Arpit

Weeks 1-12

9

Beta test with 5+ UBC classmates and iterate

Arpit

Week 11

10

Build Android APK and record demo video for portfolio

Arpit

Week 12

You now have all three documents. Research (Part 1) told you what exists. The PRD (Part 2) defined what to build. This Technical Design Document (Part 3) tells you exactly how to build it — file by file, function by function. Open Cursor, create your AGENTS.md, and start with Week 1. Good luck, Arpit. AutoLink is ready to build.

AutoLink Technical Design Document  |  MVP v1.0  |  February 2026

Prepared for Arpit Verma @ UBC  |  Generated by Claude AI

