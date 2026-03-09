import { useEffect, useCallback } from 'react';
import { apiClient } from '../lib/api';
import { useAuthStore } from '../store/authStore';

/**
 * Hook to detect and sync user's timezone from backend.
 * This uses IP geolocation at the backend to detect the user's timezone.
 */
export function useTimezone() {
  const { user, timezone, setTimezone, updateUser, isAuthenticated } = useAuthStore();

  /**
   * Detect timezone from backend IP geolocation
   */
  const detectTimezone = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      // Call backend to detect timezone from IP
      const result = await apiClient.detectTimezone();
      
      if (result.detected && result.timezone !== timezone) {
        // Update store with new timezone
        setTimezone(result.timezone);
        updateUser({ timezone: result.timezone });
        console.log('Timezone updated from IP geolocation:', result.timezone);
      }
      
      return result.timezone;
    } catch (err) {
      console.error('Failed to detect timezone:', err);
      return timezone;
    }
  }, [isAuthenticated, timezone, setTimezone, updateUser]);

  /**
   * Get current time in user's timezone
   */
  const getLocalTime = useCallback(() => {
    const tz = user?.timezone || timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    return new Date().toLocaleTimeString('en-US', {
      timeZone: tz,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }, [user, timezone]);

  /**
   * Get hour in user's timezone (for greeting calculation)
   */
  const getLocalHour = useCallback(() => {
    const tz = user?.timezone || timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: 'numeric',
      hour12: false,
    });
    return parseInt(formatter.format(new Date()), 10);
  }, [user, timezone]);

  /**
   * Format date to user's timezone
   */
  const formatDate = useCallback((date: Date | string, options?: Intl.DateTimeFormatOptions) => {
    const tz = user?.timezone || timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      timeZone: tz,
      ...options
    });
  }, [user, timezone]);

  /**
   * Format time to user's timezone
   */
  const formatTime = useCallback((date: Date | string, options?: Intl.DateTimeFormatOptions) => {
    const tz = user?.timezone || timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString('en-US', {
      timeZone: tz,
      hour: 'numeric',
      minute: '2-digit',
      ...options
    });
  }, [user, timezone]);

  // Auto-detect timezone on mount
  useEffect(() => {
    if (isAuthenticated && user) {
      // Only detect if user doesn't have a timezone set yet
      if (!user.timezone || user.timezone === 'UTC') {
        detectTimezone();
      }
    }
  }, [isAuthenticated, user, detectTimezone]);

  return {
    timezone: user?.timezone || timezone || 'UTC',
    detectTimezone,
    getLocalTime,
    getLocalHour,
    formatDate,
    formatTime
  };
}
