import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface DataCacheContextType {
  getCache: <T>(key: string) => T | null;
  setCache: <T>(key: string, data: T, ttl?: number) => void;
  clearCache: (key?: string) => void;
  isCacheValid: (key: string, ttl?: number) => boolean;
}

const DataCacheContext = createContext<DataCacheContextType | undefined>(undefined);

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

export const DataCacheProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cache, setCacheState] = useState<Map<string, CacheEntry<any>>>(new Map());

  const getCache = useCallback(<T,>(key: string): T | null => {
    const entry = cache.get(key);
    if (!entry) return null;
    return entry.data as T;
  }, [cache]);

  const setCache = useCallback(<T,>(key: string, data: T, ttl: number = DEFAULT_TTL) => {
    setCacheState((prev) => {
      const newCache = new Map(prev);
      newCache.set(key, {
        data,
        timestamp: Date.now(),
      });
      return newCache;
    });
  }, []);

  const isCacheValid = useCallback((key: string, ttl: number = DEFAULT_TTL): boolean => {
    const entry = cache.get(key);
    if (!entry) return false;
    return (Date.now() - entry.timestamp) < ttl;
  }, [cache]);

  const clearCache = useCallback((key?: string) => {
    if (key) {
      setCacheState((prev) => {
        const newCache = new Map(prev);
        newCache.delete(key);
        return newCache;
      });
    } else {
      setCacheState(new Map());
    }
  }, []);

  return (
    <DataCacheContext.Provider value={{ getCache, setCache, clearCache, isCacheValid }}>
      {children}
    </DataCacheContext.Provider>
  );
};

export const useDataCache = () => {
  const context = useContext(DataCacheContext);
  if (!context) {
    throw new Error('useDataCache must be used within DataCacheProvider');
  }
  return context;
};
