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
      // Add error message
      const errorMessage = {
        role: 'assistant' as const,
        content: `Sorry, something went wrong: ${error.message}`,
        timestamp: new Date().toISOString()
      };
      addMessage(errorMessage);
      setLoading(false);
      setCurrentResponse('');
    }
  });
};
