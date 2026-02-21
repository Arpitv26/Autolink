🔗 AutoLink

Product Requirements Document

MVP • Version 1.0

Field

Detail

Product Name

AutoLink

Document Type

Product Requirements Document (PRD)

Version

MVP 1.0

Prepared For

Arpit Verma — 2nd Year CS @ UBC

Collaborator

James (Design & Idea)

Date

February 2026

Status

Draft — Ready for Technical Design

1. Product Overview

🎯  The One-Liner

AutoLink is the only mobile app that combines AI-powered modification advice, a visual drag-and-drop build planner, and a social community feed — all personalised to your specific car.

Attribute

Detail

App Name

AutoLink

Tagline

Plan it. Build it. Share it.

Platform

iOS + Android (Expo / React Native)

Demo Goal

Polished recruiter-facing portfolio demo

Timeline

12 weeks (solo dev)

Budget

~$5–8/month (free tiers maximised)

Team

Arpit Verma (development) + James (design/idea)

2. Problem Statement

2.1 The Problem

Car enthusiasts who want to modify their vehicles face a fragmented, frustrating experience. They bounce between YouTube videos for ideas, Reddit threads for compatibility questions, Google Sheets to track their build budget, Instagram to show off progress, and e-commerce sites to compare prices — none of which talk to each other.

There is no single tool that helps a car enthusiast plan a mod, verify it fits their specific vehicle, estimate the cost, and then share the finished build with a community that cares.

2.2 Why Existing Solutions Fall Short

Competitor

What They Do Well

Critical Gap

Fitment Industries

Great fitment checker, strong YouTube community

No AI assistant, no build planner, no social feed

ECS Tuning

Deep European parts catalogue, technical content

Pure e-commerce — no community, no planning tools

MotorTrend App

Strong media/video content

Not a modification tool — superficial AI features

Reddit (r/cars etc.)

Authentic community, real advice

Zero structured tools — no builds, no compatibility checker

CarParts.com

Wide parts catalogue, basic fitment

No community, no AI, no build planning

💡  AutoLink's Opportunity

No competitor combines all three: AI mod advice + visual build planner + social community feed. This is the gap AutoLink fills.

3. Target Users

3.1 Primary User Personas

AutoLink targets a spectrum of car enthusiasts aged 18–35 across three overlapping segments:

Persona

Age

Profile

Primary Need

The Beginner

18–24

Just got their first car. Excited to mod it but overwhelmed by choice. Doesn't know where to start or what's compatible.

Guided AI recommendations + learn-as-you-go

The Planner

22–30

Has modded a car before. Knows what they want but needs a better way to organise and budget their build.

Visual build planner + cost tracking

The Showoff

20–35

Loves sharing their build progress with a community. Currently splits time between Instagram and Reddit.

Social feed + build showcase

3.2 What Drives Our Users

Three emotional drivers unite all three personas:

Saving money — avoiding buying the wrong part, finding the best price across sellers

Social recognition — showing off their build to people who genuinely appreciate it

Learning & growing — becoming more knowledgeable about their car and the modding world

3.3 User Persona Deep-Dive: Alex

Attribute

Detail

Name

Alex

Age

22

Situation

University student, just bought a 2019 Honda Civic Sport. First car, first mods.

Current frustration

Spends 3+ hours on YouTube/Reddit trying to find out if a specific coilover fits his trim. Still not sure.

What he wants

Ask a question, get a confident answer, add it to his build plan, share his progress.

Tech level

Comfortable with apps, moderate car knowledge, wants to learn more.

How he finds AutoLink

Sees a build post shared by a friend on social media.

4. User Journey

4.1 End-to-End Flow

Step

User Action

AutoLink Response

Emotional Result

1. Discovery

Sees a shared build post

Beautiful social card with the car + mods listed

Curiosity — 'I want this for my car'

2. Sign Up

Taps 'Sign in with Google'

One-tap auth, immediately prompted to add their car

Smooth, no friction

3. Garage Setup

Enters year/make/model/trim

App validates against NHTSA data, confirms vehicle

Confidence — 'It knows my car'

4. AI Chat

Asks 'What coilovers fit my Civic?'

AI responds with 3 budget tiers, fitment confirmation, install difficulty

Relief — 'Someone actually answered me'

5. Build Planner

Taps 'Add to my build'

Mod appears on visual planner canvas, cost updates

Excitement — 'I can see my build coming together'

6. Social Post

Shares build progress

Post appears in community feed with likes/comments

Pride — 'People appreciate my build'

7. Return

Comes back tomorrow

Sees feed activity, new AI suggestions, build updates

Habit forming

5. MVP Features

📋  MoSCoW Prioritisation

Must Have = ships in 12 weeks | Should Have = v1.1 if time allows | Won't Have = explicitly deferred to v2

5.1 Must-Have Features (P0 — All required for demo)

Feature 1: AI Modification Assistant

Attribute

Detail

Description

A conversational AI chat interface where users ask natural language questions about car modifications, part compatibility, and build advice.

User Story

As a car enthusiast, I want to ask the AI 'What exhaust fits my 2019 Civic?' and get a confident, personalised answer so I don't waste money on incompatible parts.

Acceptance Criteria

User can send a message and receive an AI response within 5 seconds
AI response is contextualised to the user's saved vehicle
AI provides budget tiers (budget / mid / premium) where relevant
AI flags if fitment is uncertain rather than guessing
User is rate-limited to 20 queries/day (demo phase)
Typing indicator shown while AI is responding

Priority

P0 — Core flagship feature

Technology

OpenAI GPT-4o mini + Supabase Edge Function proxy

Feature 2: Visual Modification Planner

Attribute

Detail

Description

A drag-and-drop canvas where users can build a visual plan of their car modifications, organised by category, with cost tracking.

User Story

As a car builder, I want to visually organise all my planned mods in one place — with costs — so I can see my full build at a glance and plan my budget.

Acceptance Criteria

User can add a mod card from the parts catalogue (mocked JSON)
Mod cards are draggable and droppable into category zones
Filter by category (suspension, exhaust, wheels, etc.), brand, and price range
Total build cost displayed and updates in real time
Build auto-saves to Supabase
User can share their build directly to the Social Feed

Priority

P0 — Core differentiator vs. competitors

Technology

react-native-reanimated + Supabase PostgreSQL

Feature 3: Social Community Feed

Attribute

Detail

Description

An Instagram-style feed where users post their car builds, like and comment on others' builds, and follow other enthusiasts.

User Story

As a car enthusiast, I want to share my build progress and see what others are building so I can get inspired, get feedback, and feel part of a community.

Acceptance Criteria

Infinite scroll feed showing posts from all users (public)
Users can upload 1–5 photos per post (from camera roll)
Like and unlike posts (optimistic UI update)
Comment on posts with threaded replies
Follow/unfollow other users
Post links to a specific saved build in the Mod Planner

Priority

P0 — Core feature, equally weighted with AI Assistant

Technology

Supabase PostgreSQL + Supabase Storage + expo-image-picker

Feature 4: User Auth + Garage Profile

Attribute

Detail

Description

Social login (Google + Apple) and a user profile with a 'garage' — the vehicles they own — that personalises the entire app experience.

User Story

As a new user, I want to sign in quickly and tell the app what car I drive so every AI answer and recommendation is relevant to my specific vehicle.

Acceptance Criteria

Sign in with Google or Apple (no email/password form)
Profile setup flow: username, display name, avatar
Garage: 1 free vehicle included; up to 4 additional vehicles unlocked via Pro (year/make/model validated against NHTSA API)
Pro vehicle paywall can bundle additional premium features later (to be defined)
Vehicle context injected into every AI query automatically
Profile page shows user's builds and posts

Priority

P0 — Required for personalisation

Technology

Supabase Auth (Google + Apple OAuth)

5.2 Should Have (P1 — v1.1 if time allows)

Push notifications — notify on likes, comments, follows

VIN scanner — scan barcode to auto-populate vehicle in garage

Build cost history — track how the build budget changed over time

Dark mode — secondary design theme

5.3 Won't Have in MVP (Explicitly Deferred to v2)

Feature

Why Deferred

Target Version

Real parts catalogue API (ACES/PIES)

Costs $1,000+/year — mocked JSON is sufficient for demo

v2 (post-revenue)

Price comparison across sellers

Requires affiliate API integrations — post-launch priority

v2

Marketplace / parts buying

Payment processing, escrow, disputes — too complex for MVP

v3

In-app messaging

Social feed comments satisfy community need for now

v2

Native iOS/Android (Swift/Kotlin)

Cross-platform Expo covers demo needs

Not planned

6. Non-Functional Requirements

Requirement

Target

Notes

Performance

AI response < 5 seconds, screen load < 2 seconds

GPT-4o mini is fast; Supabase Edge Function adds minimal latency

Availability

Best-effort for demo phase

Supabase free tier; daily ping cron to prevent project pause

Security

Google/Apple OAuth only — no passwords stored

Supabase RLS (Row Level Security) on all tables

Privacy

No sensitive personal data collected beyond username + vehicle

Basic privacy policy required before TestFlight

Scalability

Support 100 concurrent users comfortably

Supabase free tier handles this; OpenAI scales linearly

Accessibility

WCAG 2.1 AA basics — contrast, labels, touch targets

Required for recruiter-quality polish

Platform Support

iOS 14+ and Android 10+

Expo Go for development; EAS Build for distribution

Offline Handling

Graceful error messages when offline

No offline mode required for MVP

7. UX & Design Direction

7.1 Design Principles

Clean and minimal — white/light backgrounds, generous whitespace, nothing cluttered

Friendly and approachable — warm tone, encouraging copy, not intimidating for beginners

Car-native — design language inspired by automotive aesthetics (speed lines, bold cards, rich photography)

Confidence by default — always show the user what to do next; no dead ends

7.2 Key Screens

Screen

Purpose

Key UI Elements

Onboarding (3 screens)

Explain value, get user signed in and garage set up

Animated illustrations, Google/Apple sign-in, vehicle picker

AI Chat

Core AI assistant experience

Chat bubbles (react-native-gifted-chat), typing indicator, vehicle context badge at top

Mod Planner Canvas

Visual build planning

Draggable mod cards, category zones, cost tracker, share button

Social Feed

Community browsing and posting

Infinite scroll cards, like/comment actions, follow button, photo grid

Build Detail

View a specific saved build

Parts list, cost breakdown, linked social posts, share CTA

Profile / Garage

User's identity and vehicles

Avatar, username, vehicle cards, build grid, follower counts

7.3 Navigation Structure

Bottom tab navigation with 4 tabs:

🤖  AI — The AI chat assistant (default landing screen)

🔧  Planner — The drag-and-drop modification planner

📸  Feed — The social community feed

👤  Profile — User profile, garage, and saved builds

8. Success Metrics

8.1 Primary Metrics (Demo Phase)

Metric

Target (12 weeks)

Why This Matters

How to Measure

Number of Signups

50+ accounts created

Proves the app is shareable and intriguing enough to try

Supabase Auth dashboard

Social Posts & Likes

100+ posts, 500+ likes

Proves the social loop is engaging and users want to share

Supabase database counts

8.2 Secondary Metrics

Metric

Target

How to Measure

AI queries sent

500+ total queries

Query count in Supabase profiles table

Builds created

30+ saved builds

Count of rows in builds table

Session length

> 3 minutes average

Expo Analytics / Supabase logs

D7 retention

> 20% of signups return after 7 days

Supabase auth last_sign_in_at

9. Technical Stack Summary

ℹ️  Full Technical Detail

This section summarises the stack. Full architecture, code examples, and setup steps are in the AutoLink Research Report (already completed).

Layer

Technology

Justification

Mobile Framework

Expo (React Native) + TypeScript

Fastest path to iOS+Android; Java background transfers to TypeScript; 6x more job postings than Flutter

Backend / BaaS

Supabase

Free tier covers demo; PostgreSQL is relational (perfect for cars/parts/users); auth + storage included

Database

Supabase PostgreSQL

SQL knowledge from CS coursework transfers directly; predictable relational model

Authentication

Supabase Auth (Google + Apple OAuth)

Zero config, social login only (no passwords), built into Supabase

Image Storage

Supabase Storage

1GB free tier; direct upload from mobile; built-in CDN

AI API

OpenAI GPT-4o mini

Best cost/quality ratio ($0.15/M input tokens); excellent automotive knowledge; simplest SDK

Vehicle Data

NHTSA vPIC + CarQuery API

Both 100% free, no API key needed; covers make/model/year/specs for all US vehicles

Push Notifications

Expo Push Notifications + EAS

Free; works natively with Expo; zero extra service needed

AI Coding Tools

Cursor IDE + GitHub Copilot

Cursor's Composer mode can scaffold entire screens in minutes — essential for solo dev

10. Mock vs. Real Data Strategy

Feature

Approach

Rationale

Vehicle lookup (make/model/year)

REAL — NHTSA vPIC API

Free, instant, adds credibility to demo

AI chat responses

REAL — OpenAI GPT-4o mini

Core feature — must be live AI

User auth + profiles

REAL — Supabase Auth

Easy to implement; shows security awareness

Parts catalogue

MOCKED — static JSON (~150 parts)

Real APIs cost $1,000+/year; mock is sufficient for demo

Part compatibility

HYBRID — AI reasons about it

AI can state fitment with appropriate caveats; sufficient for demo

Social feed posts

REAL — Supabase DB

Core social feature; pre-populate with 10–15 seed posts

Image uploads

REAL — Supabase Storage

Required for authentic social feel; easy to implement

Price comparisons

MOCKED — hardcoded ranges

Real affiliate data post-launch; mock shows the concept

11. Budget Breakdown

Service

What It Covers

Free Tier

Demo Cost

OpenAI API (GPT-4o mini)

AI assistant queries

$5 free credits initially

~$5–8/month

Supabase (Free Plan)

Database + Auth + Storage + Realtime

500MB DB, 1GB storage, 2GB bandwidth

$0/month

Expo EAS Build

iOS + Android builds

30 builds/month free

$0/month

NHTSA vPIC API

Vehicle make/model/year data

Completely free, no key

$0/month

CarQuery API

Vehicle specs + engine data

Completely free, no key

$0/month

Domain (optional)

autolink.app or similar

N/A

~$10–15/year (skip for demo)

💰  Total Estimated Demo Cost: $5–8/month

Well within the $50/month budget. Remaining ~$42 is buffer for unexpected usage spikes or optional tools. OpenAI is the only real cost — everything else runs on free tiers.

12. Risk Assessment

Risk

Probability

Impact

Mitigation

Supabase project pauses (free tier inactivity)

High

High

Add daily health-check cron job to keep project active

OpenAI costs spike unexpectedly

Medium

Medium

Per-user 20 query/day limit in Supabase; set max_tokens: 500

Drag-and-drop planner is harder than expected

Medium

High

Spike it in Week 1 before committing; fall back to list UI if needed

Solo dev time underestimated

Medium

High

Use Cursor IDE + Copilot aggressively; cut P1 features first

Apple OAuth harder to set up

Medium

Low

Google login alone is sufficient for demo; Apple can be deferred

Expo compatibility issues with libraries

Low

Medium

Stick to Expo-compatible packages; check expo.dev/packages

13. 12-Week Demo Roadmap

Phase

Weeks

Milestone

Key Deliverables

Foundation

1–2

Environment + Auth + Navigation

Expo project scaffolded, Supabase connected, Google login working, bottom tab navigation, vehicle garage setup

AI Core

3–6

Working AI Chat

GPT-4o mini integrated, vehicle context injected, chat UI with gifted-chat, typing indicator, 20 query/day rate limit

Planner

7–8

Drag-and-Drop Mod Planner

Draggable mod cards, category zones, mocked parts catalogue, cost tracker, save to Supabase, share to feed

Social

9–10

Full Social Feed

Infinite scroll feed, image upload, like/comment, follow/unfollow, 10–15 seed posts

Polish

11–12

Demo-Ready Build

Onboarding flow, empty states, loading skeletons, error handling, app icon, EAS Build, TestFlight deploy

14. MVP Definition of Done

The MVP is demo-ready when:

All 4 P0 features (AI Chat, Mod Planner, Social Feed, Auth/Garage) are fully functional

The complete user journey works end-to-end: sign up → add car → ask AI → plan a build → share to feed

App works on both iOS and Android (tested via Expo Go + EAS Build)

No placeholder content — real AI responses, real user posts, real vehicle data

Basic error handling: network failures, empty states, and rate limits are handled gracefully

Analytics tracking signups and social post counts (Supabase dashboard)

App has an icon, splash screen, and polished onboarding flow

At least 5 friends/beta testers have used the app and given feedback

Deployed to TestFlight (iOS) or shareable APK (Android) for recruiter demos

15. Next Steps

Step

Action

Owner

When

1

Review and approve this PRD

Arpit + James

This week

2

Create Technical Design Document (Part 3)

Arpit

After PRD approval

3

Set up dev environment (Node, Expo CLI, VS Code, Supabase project)

Arpit

Week 1

4

Build MVP following 12-week roadmap

Arpit

Weeks 1–12

5

Beta test with 5–10 users (friends, UBC classmates)

Arpit

Week 11

6

Deploy to TestFlight + record demo video for portfolio

Arpit

Week 12

🚀  You're ready to build!

This PRD defines exactly what AutoLink is, who it's for, and what the MVP needs to do. Next step: Technical Design Document to map out HOW you'll build it. Good luck, Arpit — AutoLink has real potential!

AutoLink PRD • MVP v1.0 • February 2026 • Prepared for Arpit Verma @ UBC
