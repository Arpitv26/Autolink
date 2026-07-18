import { useCallback, useState } from 'react';
import { GiftedChat, type IMessage } from 'react-native-gifted-chat';
import { supabase } from '../lib/supabase';

type ChatRoleMessage = {
  role: 'user' | 'assistant';
  content: string;
};

const AI_USER = {
  _id: 'autolink-ai',
  name: 'AutoLink AI',
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readErrorMessage(data: unknown, fallback: string): string {
  if (!isRecord(data)) return fallback;
  const error = data.error;
  return typeof error === 'string' && error.trim().length > 0 ? error : fallback;
}

function toApiMessages(messages: IMessage[]): ChatRoleMessage[] {
  return [...messages]
    .reverse()
    .filter((message) => typeof message.text === 'string' && message.text.trim().length > 0)
    .map((message) => ({
      role: message.user._id === AI_USER._id ? ('assistant' as const) : ('user' as const),
      content: message.text.trim(),
    }));
}

function mapFriendlyError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('daily query limit')) {
    return 'Daily query limit reached. Come back tomorrow!';
  }
  if (lower.includes('openai api key') || lower.includes('invalid_api_key')) {
    return 'OpenAI API key is invalid. Reset it with: npx supabase secrets set OPENAI_API_KEY=sk-...';
  }
  if (lower.includes('quota') || lower.includes('billing')) {
    return 'OpenAI billing/quota issue. Check platform.openai.com billing.';
  }
  if (lower.includes('sign in') || lower.includes('session') || lower.includes('unauthorized')) {
    return 'Please sign out and sign in again, then retry AI.';
  }
  if (lower.includes('failed to send a request') || lower.includes('network')) {
    return 'Network error reaching AI. Check Wi‑Fi / try tunnel mode.';
  }
  return message;
}

export type UseAutoLinkAIResult = {
  messages: IMessage[];
  loading: boolean;
  error: string | null;
  sendMessage: (userText: string) => Promise<void>;
  clearHistory: () => void;
  clearError: () => void;
};

export function useAutoLinkAI(vehicleContext: string): UseAutoLinkAIResult {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearHistory = useCallback((): void => {
    setMessages([]);
    setError(null);
  }, []);

  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  const sendMessage = useCallback(
    async (userText: string): Promise<void> => {
      const trimmed = userText.trim();
      if (!trimmed || loading) return;

      const userMessage: IMessage = {
        _id: `${Date.now()}-user`,
        text: trimmed,
        createdAt: new Date(),
        user: { _id: 'me', name: 'You' },
      };

      const nextMessages = GiftedChat.append(messages, [userMessage]);
      setMessages(nextMessages);
      setLoading(true);
      setError(null);

      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session?.access_token) {
          setError('Please sign out and sign in again, then retry AI.');
          return;
        }

        const { data, error: fnError } = await supabase.functions.invoke('ai-chat', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: {
            messages: toApiMessages(nextMessages),
            vehicleContext,
          },
        });

        if (fnError) {
          let detailed = fnError.message || 'AI is unavailable. Please try again.';
          const context = (fnError as { context?: unknown }).context;

          if (context instanceof Response) {
            try {
              const body: unknown = await context.clone().json();
              detailed = readErrorMessage(body, detailed);
            } catch {
              // keep default message
            }
          }

          setError(mapFriendlyError(detailed));
          return;
        }

        const payloadError = isRecord(data) ? data.error : undefined;
        if (typeof payloadError === 'string' && payloadError.trim()) {
          setError(mapFriendlyError(payloadError.trim()));
          return;
        }

        const reply = isRecord(data) && typeof data.reply === 'string' ? data.reply.trim() : '';
        if (!reply) {
          setError('AI returned no reply. Try again in a moment.');
          return;
        }

        const assistantMessage: IMessage = {
          _id: `${Date.now()}-assistant`,
          text: reply,
          createdAt: new Date(),
          user: { ...AI_USER },
        };

        setMessages((prev) => GiftedChat.append(prev, [assistantMessage]));
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : 'AI is unavailable. Please try again.';
        setError(mapFriendlyError(msg));
      } finally {
        setLoading(false);
      }
    },
    [loading, messages, vehicleContext]
  );

  return {
    messages,
    loading,
    error,
    sendMessage,
    clearHistory,
    clearError,
  };
}
