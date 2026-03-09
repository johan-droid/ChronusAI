import { useEffect, useCallback, useState } from 'react';
import { apiClient } from '../lib/api';
import { useAuthStore } from '../store/authStore';

interface IndianContext {
  is_indian: boolean;
  cultural_context: string;
  festivals: Record<string, string[]>;
  preferences: Record<string, unknown>;
  timezone: string;
}

/**
 * Hook to detect and sync user's timezone and cultural context from backend.
 * This uses IP geolocation at the backend to detect user's timezone and Indian context.
 */
export function useTimezone() {
  const { user, timezone, setTimezone, updateUser, isAuthenticated } = useAuthStore();
  const [indianContext, setIndianContext] = useState<IndianContext | null>(null);

  /**
   * Detect timezone and cultural context from backend IP geolocation
   */
  const detectTimezone = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      // Call backend to detect timezone and cultural context from IP
      const result = await apiClient.detectTimezone();

      if (result.detected && result.timezone !== timezone) {
        // Update store with new timezone and context
        setTimezone(result.timezone);
        updateUser({ timezone: result.timezone });
        console.log('Timezone and context updated from IP geolocation:', result);
      }

      return result.timezone;
    } catch (err) {
      console.error('Failed to detect timezone:', err);
      return timezone;
    }
  }, [isAuthenticated, timezone, setTimezone, updateUser]);

  /**
   * Get Indian cultural context
   */
  const getIndianContext = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const context = await apiClient.getIndianContext();
      setIndianContext(context);
      return context;
    } catch (err) {
      console.error('Failed to get Indian context:', err);
      return null;
    }
  }, [isAuthenticated]);

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

  /**
   * Check if current date is an Indian festival
   */
  const isIndianFestival = useCallback((date: Date | string) => {
    if (!indianContext || !indianContext.is_indian) return false;

    const d = typeof date === 'string' ? new Date(date) : date;
    const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD format

    return Object.values(indianContext.festivals).some(festivalDates =>
      festivalDates.includes(dateStr)
    );
  }, [indianContext]);

  // Auto-detect timezone and context on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isAuthenticated && user) {
        // Only detect if user doesn't have a timezone set yet
        if (!user.timezone || user.timezone === 'UTC') {
          void detectTimezone();
        }
        // Get Indian context only if not already loaded
        if (!indianContext) {
          void getIndianContext();
        }
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [isAuthenticated, user, detectTimezone, getIndianContext, indianContext]);

  return {
    timezone: user?.timezone || timezone || 'UTC',
    isIndian: indianContext?.is_indian || false,
    culturalContext: indianContext?.cultural_context || 'global',
    indianContext,
    detectTimezone,
    getIndianContext,
    getLocalTime,
    getLocalHour,
    formatDate,
    formatTime,
    isIndianFestival
  };
}
