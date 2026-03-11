import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';

/* ── Greeting Helper ── */
interface Greeting {
  text: string;
  emoji: string;
}

function getGreeting(): Greeting {
  const hour = new Date().getHours();
  if (hour < 12) return { text: 'Good morning', emoji: '☀️' };
  if (hour < 17) return { text: 'Good afternoon', emoji: '🌤️' };
  if (hour < 21) return { text: 'Good evening', emoji: '🌅' };
  return { text: 'Good night', emoji: '🌙' };
}

/* ── LLM Health Check via React Query ── */
async function fetchLlmStatus(): Promise<boolean> {
  try {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const response = await fetch(`${baseUrl}/api/v1/health/llm`);
    const data = await response.json();
    return data.status === 'online';
  } catch {
    return false;
  }
}

/* ── Exported Hook ── */
export function useUserSession() {
  const { user } = useAuthStore();

  const greeting = useMemo(() => getGreeting(), []);

  const firstName = useMemo(() => {
    const name = user?.full_name || user?.email || 'there';
    return name.split(' ')[0].split('@')[0];
  }, [user?.full_name, user?.email]);

  return { greeting, firstName, user };
}

/* ── LLM Status Hook (replaces setInterval polling) ── */
export function useLlmStatus() {
  const { data: isOnline, isLoading } = useQuery({
    queryKey: ['llm-status'],
    queryFn: fetchLlmStatus,
    staleTime: 30_000,       // Consider fresh for 30s (same as old interval)
    refetchInterval: 30_000, // Re-poll every 30s
    refetchOnWindowFocus: false,
  });

  return {
    isLlmOnline: isLoading ? null : (isOnline ?? null),
  };
}
