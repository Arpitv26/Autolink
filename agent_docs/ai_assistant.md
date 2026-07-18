agent_docs/ai_assistant.md
Save as: agent_docs/ai_assistant.md
AI Assistant Implementation — AutoLink

Status: Phase 4 code shipped — see `supabase/functions/ai-chat/`, `hooks/useAutoLinkAI.ts`, `app/(tabs)/ai.tsx`.
Identify the user from the JWT Authorization header. Never trust a client-supplied `userId`.
MVP is non-streaming (loading/typing indicator only). Streaming is deferred.
Deploy: `npx supabase db push`, `npx supabase secrets set OPENAI_API_KEY=...`, `npx supabase functions deploy ai-chat`.

Architecture: Always Via Edge Function
Mobile App → Supabase Edge Function → OpenAI GPT-4o mini
                     ↑
              (API key lives here only)
              (rate limiting enforced here)
              (token capping enforced here)
Never call OpenAI directly from React Native — always proxy through Supabase Edge Function.

See the live Edge Function and hook in the repo for the JWT-auth implementation.
Reference behavior:
- Model: gpt-4o-mini, max_tokens: 500
- System prompt injects {vehicleContext}
- 20 queries/day via ai_query_log
- Client: supabase.functions.invoke('ai-chat', { body: { messages, vehicleContext } })
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
**Pre-generate common answers** — for the 20 most-asked questions (e.g. &quot;best coilovers for 2019 Civic&quot;), cache in Supabase and return instantly without API call
