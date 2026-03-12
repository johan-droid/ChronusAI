import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChatMessage, ChatResponse } from '../types';

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  currentResponse: string;
  addMessage: (message: ChatMessage) => void;
  setLoading: (loading: boolean) => void;
  setCurrentResponse: (response: string) => void;
  appendToCurrentResponse: (text: string) => void;
  finalizeResponse: (response: ChatResponse) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      messages: [],
      isLoading: false,
      currentResponse: '',

      addMessage: (message) => set((state) => ({
        messages: [...state.messages, message]
      })),

      setLoading: (loading) => set({ isLoading: loading }),

      setCurrentResponse: (response) => set({ currentResponse: response }),

      appendToCurrentResponse: (text) => set((state) => ({
        currentResponse: state.currentResponse + text
      })),

      finalizeResponse: (response) => set((state) => {
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: response.response,
          timestamp: new Date().toISOString(),
          meeting: response.meeting,
          meetings: response.meetings,
          availability: response.availability,
          suggestions: response.suggestions,
          intent: response.intent,
          reminder_confirmed: response.reminder_confirmed
        };

        return {
          messages: [...state.messages, assistantMessage],
          isLoading: false,
          currentResponse: ''
        };
      }),

      clearMessages: () => set({
        messages: [],
        currentResponse: '',
        isLoading: false
      })
    }),
    {
      name: 'chat-history',
      partialize: (state) => ({ messages: state.messages.slice(-50) }),
    }
  )
);
