import { create } from 'zustand';
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

export const useChatStore = create<ChatState>((set) => ({
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
      timestamp: new Date().toISOString()
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
}));
