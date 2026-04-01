/**
 * 高性能缓存工具
 * 提供 localStorage 批量写入、内存缓存、LRU 缓存等功能
 */

import { useState, useCallback, useRef, useEffect } from 'react';

// 内存缓存存储
const memoryCache = new Map<string, { value: any; expires: number }>();

// 写入队列（用于批量写入 localStorage）
let writeQueue: Map<string, any> = new Map();
let writeTimer: NodeJS.Timeout | null = null;
const WRITE_DELAY = 100; // 100ms 批量写入延迟

/**
 * 批量写入 localStorage
 */
function flushWriteQueue(): void {
  if (writeQueue.size === 0) return;
  
  writeQueue.forEach((value, key) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn(`[Cache] Failed to write ${key}:`, e);
    }
  });
  
  writeQueue.clear();
}

/**
 * 调度批量写入
 */
function scheduleFlush(): void {
  if (writeTimer) return;
  
  writeTimer = setTimeout(() => {
    flushWriteQueue();
    writeTimer = null;
  }, WRITE_DELAY);
}

/**
 * 设置缓存（支持内存 + localStorage）
 */
export function setCache<T>(key: string, value: T, options?: { 
  ttl?: number; // 过期时间（毫秒）
  persistent?: boolean; // 是否持久化到 localStorage
}): void {
  const { ttl = 0, persistent = true } = options || {};
  
  // 写入内存缓存
  const expires = ttl > 0 ? Date.now() + ttl : 0;
  memoryCache.set(key, { value, expires });
  
  // 加入写入队列
  if (persistent) {
    writeQueue.set(key, { value, expires, _cachedAt: Date.now() });
    scheduleFlush();
  }
}

/**
 * 获取缓存
 */
export function getCache<T>(key: string): T | null {
  // 先检查内存缓存
  const cached = memoryCache.get(key);
  if (cached) {
    // 检查是否过期
    if (cached.expires > 0 && Date.now() > cached.expires) {
      memoryCache.delete(key);
      localStorage.removeItem(key);
      return null;
    }
    return cached.value as T;
  }
  
  // 回退到 localStorage
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    
    const parsed = JSON.parse(stored);
    
    // 检查过期
    if (parsed.expires > 0 && Date.now() > parsed.expires) {
      localStorage.removeItem(key);
      return null;
    }
    
    // 回填内存缓存
    memoryCache.set(key, { value: parsed.value, expires: parsed.expires });
    return parsed.value as T;
  } catch (e) {
    return null;
  }
}

/**
 * 删除缓存
 */
export function removeCache(key: string): void {
  memoryCache.delete(key);
  localStorage.removeItem(key);
  writeQueue.delete(key);
}

/**
 * 清空所有缓存
 */
export function clearAllCache(): void {
  memoryCache.clear();
  writeQueue.clear();
  if (writeTimer) {
    clearTimeout(writeTimer);
    writeTimer = null;
  }
}

/**
 * 立即刷新所有待写入的缓存
 */
export function flushCache(): void {
  if (writeTimer) {
    clearTimeout(writeTimer);
    writeTimer = null;
  }
  flushWriteQueue();
}

// ============================================
// LRU 缓存实现
// ============================================

interface LRUCacheOptions {
  maxSize: number;
  ttl?: number;
}

export class LRUCache<K, V> {
  private cache: Map<K, { value: V; expires: number }>;
  private maxSize: number;
  private ttl: number;
  
  constructor(options: LRUCacheOptions) {
    this.cache = new Map();
    this.maxSize = options.maxSize;
    this.ttl = options.ttl || 0;
  }
  
  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    
    // 检查过期
    if (entry.expires > 0 && Date.now() > entry.expires) {
      this.cache.delete(key);
      return undefined;
    }
    
    // 移动到最新（LRU）
    this.cache.delete(key);
    this.cache.set(key, entry);
    
    return entry.value;
  }
  
  set(key: K, value: V): void {
    // 如果已存在，先删除
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    
    // 如果超出容量，删除最旧的
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    const expires = this.ttl > 0 ? Date.now() + this.ttl : 0;
    this.cache.set(key, { value, expires });
  }
  
  delete(key: K): boolean {
    return this.cache.delete(key);
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  get size(): number {
    return this.cache.size;
  }
}

// ============================================
// API 请求缓存
// ============================================

interface ApiCacheOptions {
  ttl?: number; // 默认 5 分钟
  keyGenerator?: (...args: any[]) => string;
}

export function createApiCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: ApiCacheOptions = {}
): T {
  const { ttl = 5 * 60 * 1000, keyGenerator } = options;
  const cache = new LRUCache<string, Promise<any>>({ maxSize: 50, ttl });
  
  return (async (...args: any[]) => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
    
    const cached = cache.get(key);
    if (cached) {
      return cached;
    }
    
    const promise = fn(...args).catch(error => {
      cache.delete(key);
      throw error;
    });
    
    cache.set(key, promise);
    return promise;
  }) as T;
}

// ============================================
// 防抖写入 Hook
// ============================================

export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);
  
  return useCallback((...args: Parameters<T>) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    timerRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]) as T;
}

// ============================================
// 高性能 localStorage Hook
// ============================================

export function useCachedLocalStorage<T>(
  key: string,
  initialValue: T,
  options?: { ttl?: number }
): [T, (value: T | ((prev: T) => T)) => void] {
  const { ttl } = options || {};
  const [state, setState] = useState<T>(() => {
    const cached = getCache<T>(key);
    return cached !== null ? cached : initialValue;
  });
  
  const debouncedSetCache = useDebouncedCallback((value: T) => {
    setCache(key, value, { ttl, persistent: true });
  }, 100);
  
  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setState(prev => {
      const newValue = typeof value === 'function' 
        ? (value as (prev: T) => T)(prev) 
        : value;
      debouncedSetCache(newValue);
      return newValue;
    });
  }, [debouncedSetCache]);
  
  return [state, setValue];
}
