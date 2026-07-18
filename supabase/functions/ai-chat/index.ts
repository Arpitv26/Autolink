import OpenAI from 'npm:openai@^4.0.0';
import { createClient } from 'npm:@supabase/supabase-js@^2.0.0';

const MAX_QUERIES_PER_DAY = 20;
const AI_MAX_TOKENS = 500;

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

type ChatRole = 'user' | 'assistant' | 'system';

type ChatMessage = {
  role: ChatRole;
  content: string;
};

type AiChatRequestBody = {
  messages?: unknown;
  vehicleContext?: unknown;
};

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function isChatMessage(value: unknown): value is ChatMessage {
  if (typeof value !== 'object' || value === null) return false;
  const role = (value as { role?: unknown }).role;
  const content = (value as { content?: unknown }).content;
  return (
    (role === 'user' || role === 'assistant' || role === 'system') &&
    typeof content === 'string' &&
    content.trim().length > 0
  );
}

function parseMessages(value: unknown): ChatMessage[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const messages: ChatMessage[] = [];
  for (const item of value) {
    if (!isChatMessage(item)) return null;
    messages.push({
      role: item.role,
      content: item.content.trim(),
    });
  }
  return messages;
}

function isLikelyUserJwt(token: string): boolean {
  // Real Supabase user JWTs are three base64 segments. New API keys are not JWTs.
  if (token.startsWith('sb_')) return false;
  const parts = token.split('.');
  return parts.length === 3 && parts.every((part) => part.length > 0);
}

function describeOpenAiError(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const status = (error as { status?: unknown }).status;
    const code = (error as { code?: unknown }).code;
    const message = (error as { message?: unknown }).message;

    if (status === 401 || code === 'invalid_api_key') {
      return 'OpenAI API key is invalid. Reset OPENAI_API_KEY in Supabase secrets.';
    }
    if (status === 429) {
      return 'OpenAI rate limit or quota hit. Check billing at platform.openai.com.';
    }
    if (typeof message === 'string' && message.trim().length > 0) {
      // Keep message short and non-secret.
      return `OpenAI error: ${message.trim().slice(0, 160)}`;
    }
  }
  return 'OpenAI request failed. Check your API key and billing.';
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return jsonResponse(
        { error: 'Sign in required. Missing session token for AI.' },
        401
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openaiKey = Deno.env.get('OPENAI_API_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse({ error: 'Server misconfigured (Supabase env).' }, 500);
    }
    if (!openaiKey) {
      return jsonResponse(
        { error: 'OPENAI_API_KEY is not set in Supabase secrets.' },
        503
      );
    }

    const jwt = authHeader.slice('Bearer '.length).trim();
    if (!jwt || !isLikelyUserJwt(jwt)) {
      return jsonResponse(
        { error: 'Sign in required. AI needs your user session token.' },
        401
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(jwt);

    if (userError || !user) {
      console.error('auth.getUser failed', userError);
      return jsonResponse({ error: 'Session expired. Sign out and sign in again.' }, 401);
    }

    const body = (await req.json()) as AiChatRequestBody;
    const messages = parseMessages(body.messages);
    if (!messages) {
      return jsonResponse({ error: 'Invalid messages payload' }, 400);
    }

    const vehicleContext =
      typeof body.vehicleContext === 'string' && body.vehicleContext.trim().length > 0
        ? body.vehicleContext.trim()
        : 'No vehicle selected';

    const today = new Date().toISOString().slice(0, 10);
    const { data: queryLog, error: logError } = await supabaseAdmin
      .from('ai_query_log')
      .select('query_count')
      .eq('user_id', user.id)
      .eq('query_date', today)
      .maybeSingle();

    if (logError) {
      console.error('ai_query_log read failed', logError);
      return jsonResponse({ error: 'Could not check rate limit' }, 500);
    }

    const currentCount =
      typeof queryLog?.query_count === 'number' ? queryLog.query_count : 0;

    if (currentCount >= MAX_QUERIES_PER_DAY) {
      return jsonResponse(
        { error: 'Daily query limit reached. Come back tomorrow!' },
        429
      );
    }

    const openai = new OpenAI({ apiKey: openaiKey });
    let reply: string | undefined;
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT.replace('{vehicleContext}', vehicleContext),
          },
          ...messages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        ],
        max_tokens: AI_MAX_TOKENS,
        temperature: 0.7,
      });
      reply = completion.choices[0]?.message?.content?.trim();
    } catch (openaiError) {
      console.error('openai.chat.completions failed', openaiError);
      return jsonResponse({ error: describeOpenAiError(openaiError) }, 502);
    }
    if (!reply) {
      return jsonResponse({ error: 'AI returned an empty response' }, 502);
    }

    const { error: upsertError } = await supabaseAdmin.from('ai_query_log').upsert(
      {
        user_id: user.id,
        query_date: today,
        query_count: currentCount + 1,
      },
      { onConflict: 'user_id,query_date' }
    );

    if (upsertError) {
      console.error('ai_query_log upsert failed', upsertError);
    }

    return jsonResponse({
      reply,
      queriesRemaining: Math.max(0, MAX_QUERIES_PER_DAY - (currentCount + 1)),
    });
  } catch (error) {
    console.error('ai-chat failed', error);
    const message =
      error instanceof Error && error.message.trim().length > 0
        ? `AI failed: ${error.message.trim().slice(0, 160)}`
        : 'AI is unavailable. Please try again.';
    return jsonResponse({ error: message }, 500);
  }
});
