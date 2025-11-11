/**
 * Custom hook for implementing lazy loading with pagination
 * Loads data incrementally to improve initial page load performance
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface LazyLoadOptions {
  // Initial number of items to load
  initialCount?: number;
  
  // Number of items to load per page
  pageSize?: number;
  
  // Whether to auto-load more when scrolling near bottom
  autoLoad?: boolean;
  
  // Distance from bottom (in pixels) to trigger auto-load
  threshold?: number;
  
  // Callback when loading more items
  onLoadMore?: (page: number) => void;
}

export interface LazyLoadReturn<T> {
  // Currently visible items
  visibleItems: T[];
  
  // Whether there are more items to load
  hasMore: boolean;
  
  // Whether currently loading more items
  isLoadingMore: boolean;
  
  // Current page number
  currentPage: number;
  
  // Total number of items
  totalItems: number;
  
  // Function to manually load more items
  loadMore: () => void;
  
  // Function to reset to initial state
  reset: () => void;
  
  // Ref to attach to scrollable container (for auto-load)
  containerRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Hook for lazy loading items with pagination
 * 
 * @param allItems - Complete array of items to lazy load
 * @param options - Configuration options
 * @returns Lazy load state and control functions
 */
export function useLazyLoad<T>(
  allItems: T[],
  options: LazyLoadOptions = {}
): LazyLoadReturn<T> {
  const {
    initialCount = 10,
    pageSize = 10,
    autoLoad = false,
    threshold = 200,
    onLoadMore,
  } = options;

  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Calculate visible items based on current page
  const itemsToShow = currentPage === 1 ? initialCount : initialCount + (currentPage - 1) * pageSize;
  const visibleItems = allItems.slice(0, itemsToShow);
  const hasMore = visibleItems.length < allItems.length;
  const totalItems = allItems.length;

  // Load more items
  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingMore) return;

    setIsLoadingMore(true);
    
    // Simulate async loading delay
    setTimeout(() => {
      setCurrentPage(prev => prev + 1);
      setIsLoadingMore(false);
      onLoadMore?.(currentPage + 1);
    }, 300);
  }, [hasMore, isLoadingMore, currentPage, onLoadMore]);

  // Reset to initial state
  const reset = useCallback(() => {
    setCurrentPage(1);
    setIsLoadingMore(false);
  }, []);

  // Set up auto-load with scroll detection
  useEffect(() => {
    if (!autoLoad || !containerRef.current) return;

    const container = containerRef.current;

    const handleScroll = () => {
      if (!container || isLoadingMore || !hasMore) return;

      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);

      if (distanceFromBottom < threshold) {
        loadMore();
      }
    };

    container.addEventListener('scroll', handleScroll);

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [autoLoad, isLoadingMore, hasMore, threshold, loadMore]);

  // Reset when allItems changes
  useEffect(() => {
    reset();
  }, [allItems.length]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    visibleItems,
    hasMore,
    isLoadingMore,
    currentPage,
    totalItems,
    loadMore,
    reset,
    containerRef,
  };
}

/**
 * Hook for lazy loading with intersection observer
 * Automatically loads more when a sentinel element comes into view
 */
export function useLazyLoadWithObserver<T>(
  allItems: T[],
  options: Omit<LazyLoadOptions, 'autoLoad' | 'threshold'> = {}
): LazyLoadReturn<T> & { sentinelRef: React.RefObject<HTMLDivElement | null> } {
  const {
    initialCount = 10,
    pageSize = 10,
    onLoadMore,
  } = options;

  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Calculate visible items based on current page
  const itemsToShow = currentPage === 1 ? initialCount : initialCount + (currentPage - 1) * pageSize;
  const visibleItems = allItems.slice(0, itemsToShow);
  const hasMore = visibleItems.length < allItems.length;
  const totalItems = allItems.length;

  // Load more items
  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingMore) return;

    setIsLoadingMore(true);
    
    // Simulate async loading delay
    setTimeout(() => {
      setCurrentPage(prev => prev + 1);
      setIsLoadingMore(false);
      onLoadMore?.(currentPage + 1);
    }, 300);
  }, [hasMore, isLoadingMore, currentPage, onLoadMore]);

  // Reset to initial state
  const reset = useCallback(() => {
    setCurrentPage(1);
    setIsLoadingMore(false);
  }, []);

  // Set up intersection observer
  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !isLoadingMore) {
          loadMore();
        }
      },
      {
        root: null,
        rootMargin: '100px',
        threshold: 0.1,
      }
    );

    observer.observe(sentinelRef.current);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, isLoadingMore, loadMore]);

  // Reset when allItems changes
  useEffect(() => {
    reset();
  }, [allItems.length]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    visibleItems,
    hasMore,
    isLoadingMore,
    currentPage,
    totalItems,
    loadMore,
    reset,
    containerRef,
    sentinelRef,
  };
}
