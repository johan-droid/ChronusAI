import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import type { ChatRequest, ChatResponse } from '../types';
import { useChatStore } from '../store/chatStore';

export const useSendMessage = () => {
  const { addMessage, setLoading, setCurrentResponse, finalizeResponse } = useChatStore();

  return useMutation<ChatResponse, Error, ChatRequest>({
    mutationFn: (request: ChatRequest) => apiClient.sendMessage(request),
    onMutate: async (request) => {
      // Add user message to chat
      const userMessage = {
        role: 'user' as const,
        content: request.message,
        timestamp: new Date().toISOString()
      };
      addMessage(userMessage);
      
      // Set loading state
      setLoading(true);
      setCurrentResponse('');
    },
    onSuccess: (response) => {
      // Finalize the response
      finalizeResponse(response);
    },
    onError: (error) => {
      // Enhanced error handling for calendar connection issues
      let errorMessage = 'Sorry, something went wrong';
      
      if (error.message) {
        const errorString = error.message.toLowerCase();
        
        // Check for insufficient balance errors
        if (errorString.includes('insufficient_balance') || errorString.includes('402')) {
          errorMessage = '💳 API credits exhausted. Please contact the administrator to top up the LLM provider balance.';
        } else if (errorString.includes('calendar connection') || errorString.includes('🔗')) {
          errorMessage = '🔗 Calendar connection issue. Please check your Google Calendar integration and try again.';
        } else if (errorString.includes('authentication') || errorString.includes('unauthorized')) {
          errorMessage = '🔐 Authentication issue. Please sign in again.';
        } else if (errorString.includes('network') || errorString.includes('timeout')) {
          errorMessage = '🌐 Network issue. Please check your connection and try again.';
        } else if (errorString.includes('rate limit') || errorString.includes('too many requests')) {
          errorMessage = '⏱️ Too many requests. Please wait a moment and try again.';
        } else {
          errorMessage = `Sorry, something went wrong: ${error.message}`;
        }
      }
      
      // Add error message
      const errorChatMessage = {
        role: 'assistant' as const,
        content: errorMessage,
        timestamp: new Date().toISOString()
      };
      addMessage(errorChatMessage);
      setLoading(false);
      setCurrentResponse('');
    }
  });
};
