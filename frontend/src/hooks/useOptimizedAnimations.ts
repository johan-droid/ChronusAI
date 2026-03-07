import { useEffect, useRef, useCallback, useState } from 'react';

// Optimized animation hook with performance monitoring
export const useOptimizedAnimation = (
  callback: (progress: number) => void,
  duration: number = 1000,
  easing: (t: number) => number = (t) => t
) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const startTimeRef = useRef<number>(0);
  const animationIdRef = useRef<number>(0);

  const animate = useCallback(
    (currentTime: number) => {
      if (startTimeRef.current === 0) {
        startTimeRef.current = currentTime;
      }

      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easing(progress);

      callback(easedProgress);

      if (progress < 1) {
        animationIdRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
        startTimeRef.current = 0;
      }
    },
    [callback, duration, easing]
  );

  const start = useCallback(() => {
    if (!isAnimating) {
      setIsAnimating(true);
      startTimeRef.current = 0;
      animationIdRef.current = requestAnimationFrame(animate);
    }
  }, [animate, isAnimating]);

  const stop = useCallback(() => {
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = 0;
    }
    setIsAnimating(false);
    startTimeRef.current = 0;
  }, []);

  useEffect(() => {
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, []);

  return { start, stop, isAnimating };
};

// Intersection Observer hook for lazy loading
export const useIntersectionObserver = (
  callback: (isIntersecting: boolean) => void,
  options?: IntersectionObserverInit
) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const targetRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        callback(entry.isIntersecting);
      },
      options
    );

    if (targetRef.current) {
      observer.observe(targetRef.current);
    }

    return () => {
      if (targetRef.current) {
        observer.unobserve(targetRef.current);
      }
    };
  }, [callback, options]);

  return { targetRef, isIntersecting };
};

// Debounce hook for performance optimization
export const useDebounce = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const timeoutRef = useRef<number>();

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => callback(...args), delay);
    },
    [callback, delay]
  ) as T;
};

// Throttle hook for performance optimization
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastRun = useRef<number>(Date.now());
  const timeoutRef = useRef<number>();

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        if (Date.now() - lastRun.current >= delay) {
          callback(...args);
          lastRun.current = Date.now();
        }
      }, delay - (Date.now() - lastRun.current));
    },
    [callback, delay]
  ) as T;
};
