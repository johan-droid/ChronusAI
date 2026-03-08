// Performance optimization utilities for Vercel free tier

// Debounce function for search inputs and API calls
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: number;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle function for scroll events and animations
export const throttle = <T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Intersection Observer for lazy loading
export const createIntersectionObserver = (
  callback: IntersectionObserverCallback,
  options?: IntersectionObserverInit
) => {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return null;
  }

  return new IntersectionObserver(callback, {
    rootMargin: '50px',
    threshold: 0.1,
    ...options,
  });
};

// Memory-efficient array chunking
export const chunkArray = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

// Optimized date formatting
export const formatDate = (date: string | Date, options?: Intl.DateTimeFormatOptions) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  }).format(dateObj);
};

// Optimized time formatting
export const formatTime = (date: string | Date) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(dateObj);
};

// Memory cleanup for event listeners
export const addEventListenerWithCleanup = (
  element: Element | Window,
  event: string,
  handler: EventListener,
  options?: AddEventListenerOptions
) => {
  element.addEventListener(event, handler, options);
  return () => element.removeEventListener(event, handler, options);
};

// Optimized image loading
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};

// Request Animation Frame with fallback
export const requestAnimationFramePolyfill = (callback: FrameRequestCallback) => {
  if (typeof window !== 'undefined' && window.requestAnimationFrame) {
    return window.requestAnimationFrame(callback);
  }
  return setTimeout(callback, 16); // ~60fps fallback
};

// Cancel Animation Frame with fallback
export const cancelAnimationFramePolyfill = (id: number) => {
  if (typeof window !== 'undefined' && window.cancelAnimationFrame) {
    return window.cancelAnimationFrame(id);
  }
  return clearTimeout(id);
};

// Optimized scroll position tracking
export const getScrollPosition = () => {
  if (typeof window === 'undefined') return { x: 0, y: 0 };
  
  return {
    x: window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft || 0,
    y: window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0,
  };
};

// Viewport size detection
export const getViewportSize = () => {
  if (typeof window === 'undefined') return { width: 0, height: 0 };
  
  return {
    width: window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth,
    height: window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight,
  };
};

// Device detection for performance optimization
export const getDeviceInfo = () => {
  if (typeof window === 'undefined') {
    return { isMobile: false, isTablet: false, isDesktop: true };
  }

  const userAgent = navigator.userAgent.toLowerCase();
  const isMobile = /mobile|android|iphone|ipad|phone/i.test(userAgent);
  const isTablet = /tablet|ipad/i.test(userAgent) && !isMobile;
  
  return {
    isMobile,
    isTablet,
    isDesktop: !isMobile && !isTablet,
  };
};

// Performance monitoring
export const measurePerformance = (name: string, fn: () => void) => {
  if (typeof window === 'undefined' || !window.performance) {
    fn();
    return;
  }

  const start = performance.now();
  fn();
  const end = performance.now();
  
  console.log(`${name} took ${end - start} milliseconds`);
};

// Memory usage monitoring (if available)
export const getMemoryUsage = () => {
  if (typeof window === 'undefined' || !('memory' in performance)) {
    return null;
  }

  const memory = (performance as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
  if (!memory) return null;
  
  return {
    used: Math.round(memory.usedJSHeapSize / 1048576), // MB
    total: Math.round(memory.totalJSHeapSize / 1048576), // MB
    limit: Math.round(memory.jsHeapSizeLimit / 1048576), // MB
  };
};

// Optimized local storage with error handling
export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): boolean => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  },
  removeItem: (key: string): boolean => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },
};

// CSS-in-JS optimization
export const createStyleSheet = (styles: string) => {
  if (typeof document === 'undefined') return;

  const style = document.createElement('style');
  style.textContent = styles;
  document.head.appendChild(style);
  
  return () => {
    if (style.parentNode) {
      style.parentNode.removeChild(style);
    }
  };
};

// Optimized class name concatenation
export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};