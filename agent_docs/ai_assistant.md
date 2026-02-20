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
import OpenAI from &apos;npm:openai@^4.0.0&apos;;
import { createClient } from &apos;npm:@supabase/supabase-js@^2.0.0&apos;;
const openai = new OpenAI({ apiKey: Deno.env.get(&apos;OPENAI_API_KEY&apos;) });
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
User&apos;s Current Vehicle: {vehicleContext}
Behavior Rules:
Always ask for vehicle year/make/model/trim if not provided
When checking compatibility, explicitly confirm fitment or flag uncertainty
Provide 3 price tiers when possible: budget / mid-range / premium
Recommend reputable brands (KW, Bilstein, Borla, K&amp;N, Mishimoto, etc.)
Flag mods that may void warranty or fail emissions tests
Be encouraging and enthusiastic — you love cars
If asked non-automotive questions, politely redirect
Keep responses concise unless user asks for detail
Respond in a conversational, knowledgeable tone. Use bullet points for part lists.`;
const MAX_QUERIES_PER_DAY = 20;
Deno.serve(async (req) =&gt; {
  const { messages, vehicleContext, userId } = await req.json();
  // 1. Initialize Supabase client
  const supabase = createClient(
    Deno.env.get(&apos;SUPABASE_URL&apos;)!,
    Deno.env.get(&apos;SUPABASE_SERVICE_ROLE_KEY&apos;)!
  );
  // 2. Rate limit check (20 queries/day per user)
  const today = new Date().toISOString().split(&apos;T&apos;)[0];
  const { data: queryLog } = await supabase
    .from(&apos;ai_query_log&apos;)
    .select(&apos;query_count&apos;)
    .eq(&apos;user_id&apos;, userId)
    .eq(&apos;query_date&apos;, today)
    .single();
  const currentCount = queryLog?.query_count ?? 0;
  if (currentCount &gt;= MAX_QUERIES_PER_DAY) {
    return new Response(
      JSON.stringify({ error: &apos;Daily query limit reached. Come back tomorrow!&apos; }),
      { status: 429 }
    );
  }
  // 3. Call OpenAI
  const response = await openai.chat.completions.create({
    model: &apos;gpt-4o-mini&apos;,
    messages: [
      {
        role: &apos;system&apos;,
        content: SYSTEM_PROMPT.replace(&apos;{vehicleContext}&apos;, vehicleContext ?? &apos;No vehicle selected&apos;)
      },
      ...messages
    ],
    max_tokens: 500,       // Cap to control costs
    temperature: 0.7,
  });
  // 4. Increment query count
  await supabase.from(&apos;ai_query_log&apos;).upsert({
    user_id: userId,
    query_date: today,
    query_count: currentCount + 1,
  });
  return new Response(
    JSON.stringify({ reply: response.choices[0].message.content }),
    { headers: { &apos;Content-Type&apos;: &apos;application/json&apos; } }
  );
});
---
React Native AI Hook
// hooks/useAutoLinkAI.ts
import { useState } from &apos;react&apos;;
import { supabase } from &apos;../lib/supabase&apos;;
import { useAuth } from &apos;./useAuth&apos;;
type Message = {
  role: &apos;user&apos; | &apos;assistant&apos;;
  content: string;
};
export function useAutoLinkAI(vehicleContext: string) {
  const [messages, setMessages] = useState&lt;Message[]&gt;([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState&lt;string | null&gt;(null);
  const { user } = useAuth();
  async function sendMessage(userText: string) {
    const newMessages: Message[] = [...messages, { role: &apos;user&apos;, content: userText }];
    setMessages(newMessages);
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke(&apos;ai-chat&apos;, {
        body: {
          messages: newMessages,
          vehicleContext,
          userId: user?.id,
        },
      });
      if (fnError) throw fnError;
      const reply = data.reply as string;
      setMessages(prev =&gt; [...prev, { role: &apos;assistant&apos;, content: reply }]);
      return reply;
    } catch (err) {
      const msg = err instanceof Error ? err.message : &apos;AI is unavailable. Please try again.&apos;;
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
**Pre-generate common answers** — for the 20 most-asked questions (e.g. &quot;best coilovers for 2019 Civic&quot;), cache in Supabase and return instantly without API call
