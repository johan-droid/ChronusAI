import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import type { Meeting } from '../types';

export const useMeetings = () => {
  return useQuery<Meeting[], Error>({
    queryKey: ['meetings'],
    queryFn: () => apiClient.getMeetings(),
    refetchInterval: 60000, // Refresh every minute
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 30000, // Consider data stale after 30 seconds
    gcTime: 300000, // Keep in cache for 5 minutes (gcTime replaced cacheTime)
  });
};

export const useDeleteMeeting = () => {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, Error, string>({
    mutationFn: (meetingId: string) => apiClient.deleteMeeting(meetingId),
    onSuccess: () => {
      // Invalidate and refetch meetings
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
    },
  });
};

export const useUpdateMeeting = () => {
  const queryClient = useQueryClient();

  return useMutation<Meeting, Error, { id: string; updates: Partial<Meeting> }>({
    mutationFn: ({ id, updates }) => apiClient.updateMeeting(id, updates),
    onSuccess: () => {
      // Invalidate and refetch meetings
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
    },
  });
};
