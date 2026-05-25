🔗 AutoLink

AGENTS.md — Master Plan

Save as: AGENTS.md in your project root

This is the universal master plan. Every AI tool (Codex CLI, Cursor, Claude Code) reads this file first. Keep it updated as you complete phases.

AGENTS.md — Master Plan for AutoLink

Project Overview

App: AutoLink

Goal: All-in-one AI-powered mobile app for car enthusiasts to plan mods, check compatibility, and connect with a community

Stack: Expo (React Native) + TypeScript | Supabase (PostgreSQL + Auth + Storage) | OpenAI GPT-4o mini | NHTSA vPIC + CarQuery APIs

Current Phase: Phase 1 — Foundation

Target: Polished recruiter-facing demo | 12-week timeline | ≤$25/month budget

---

How I Should Think

**Understand Intent First**: Before answering, identify what the user actually needs

**Ask If Unsure**: If critical information is missing, ask ONE specific clarifying question before proceeding

**Plan Before Coding**: Propose a brief plan and wait for approval, then implement

**Verify After Changes**: Run `npx expo start` or linter checks after each change; fix before moving on

**Explain Trade-offs**: When recommending something, mention why alternatives were not chosen

**Demo First**: Always prioritize making features work for demo, not perfection — mocked data is fine where noted

**Decision Logging Discipline**: For workflow/product decisions that affect future work, propose the doc update first and ask for explicit approval before writing it.

**Session Close-Out Discipline**: At the end of every work session, always update `docs/session_state.md` with what was completed, current blockers, and the next 3 tasks (after approval when required). Do not end the session without this update.

**User Action Guidance**: If Arpit needs to do anything on his side, explain it step-by-step in simple, non-technical language.

**Persistent Instruction Capture**: If Arpit gives an instruction that seems broadly useful for future sessions, ask permission to record it in docs; once approved, update `AGENTS.md`/`CODEX.md`.

---

Plan → Execute → Verify

**Plan:** Outline approach in 3–5 bullet points and ask for approval before writing code

**Execute:** Implement one feature at a time; keep PRs/commits small and focused

**Verify:** Run `npm run lint` and test on Expo Go after each feature; never skip this step

**Document (with approval):** After approval, log temporary decisions in `docs/session_state.md` and long-lived rules in `AGENTS.md`/`CODEX.md`.

---

Context Files (Load Only When Needed)

agent_docs/tech_stack.md — Full stack details, libraries, setup commands

agent_docs/code_patterns.md — Code style, component patterns, naming conventions

agent_docs/project_brief.md — Persistent project rules and conventions

agent_docs/product_requirements.md — Full PRD: features, user stories, success metrics

agent_docs/database_schema.md — PostgreSQL schema for all tables

agent_docs/ai_assistant.md — AI system prompt, integration code, cost controls

agent_docs/testing.md — Verification strategy and commands

---

Current State (Update This!)

Last Updated: May 25, 2026

Working On: Phase 1 visual validation after warm dark theme + Profile tab redesign

Recently Completed: Expo scaffold, Supabase auth (Google OAuth), tab navigation, garage year/make/model flow, profile editing/avatar upload, Pro vehicle gate, cross-tab primary vehicle context, warm dark theme, non-Instagram Profile tab redesign

Blocked By: None

---

Roadmap

Phase 1: Foundation (Weeks 1–2)

☐ Scaffold Expo project with TypeScript template

☐ Connect Supabase (env vars, client setup)

☐ Implement Supabase Auth (Google OAuth)

☐ Build bottom tab navigation (AI, Planner, Feed, Profile)

☐ Vehicle garage setup flow (NHTSA vPIC API for make/model/year)

☐ Deploy placeholder screens to phone via Expo Go

Phase 2: Social Feed (Weeks 3–5)

☐ Infinite scroll feed (FlatList + Supabase query)

☐ Image upload (expo-image-picker → Supabase Storage)

☐ Like/unlike posts (optimistic UI update)

☐ Comment threads

☐ Follow/unfollow users

☐ Seed 10–15 demo posts

Phase 3: Mod Planner (Weeks 6–8)

☐ Drag-and-drop canvas (react-native-reanimated)

☐ Mocked parts catalog (static JSON, ~150 parts)

☐ Filter by category/brand/price

☐ Real-time cost tracker

☐ Save build to Supabase

☐ Share build to Social Feed

Phase 4: AI Chat Assistant (Weeks 9–10)

☐ Supabase Edge Function as OpenAI proxy

☐ Chat UI (react-native-gifted-chat)

☐ Vehicle context injection from garage

☐ 20 query/day rate limit per user

☐ Typing indicator + streaming

Phase 5: Polish + Deploy (Weeks 11–12)

☐ Onboarding flow (3 animated screens)

☐ Empty states + loading skeletons

☐ Error handling + retry logic

☐ App icon + splash screen

☐ Expo EAS Build → TestFlight (iOS) + APK (Android)

☐ Demo video recording

---

What NOT To Do

Do NOT delete files without explicit confirmation

Do NOT modify database schemas without a backup plan

Do NOT add features not in the current phase

Do NOT skip tests or linting for "simple" changes

Do NOT bypass failing pre-commit hooks

Do NOT expose API keys in the frontend (use Supabase Edge Functions)

Do NOT use any type in TypeScript — use unknown with type guards

Do NOT call OpenAI directly from the mobile client

Do NOT build native Swift/Kotlin — Expo cross-platform only

Do NOT use PlanetScale (no free tier) or Edmunds API (no new developer access)

AutoLink • AGENTS.md • February 2026 • Arpit Verma @ UBC
