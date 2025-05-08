/**
 * Common types used across the decorators library
 */

export type EffectContext = {
  functionName: string;
  className: string;
  args: unknown[];
  result?: unknown;
  error?: Error;
};

export type CacheOptions = {
  expiryTime?: number;
  key?: string | ((...args: any[]) => string);
};

export type RetryOptions = {
  maxRetries: number;
  strategy: 'normal' | 'exponential';
  backoff?: number;
  onRetry?: (error: Error, attempt: number) => void;
};

export type CircuitBreakerOptions = {
  failureThreshold: number;
  resetTimeout: number;
  onStateChange?: (state: 'closed' | 'open' | 'half-open') => void;
};

export type RateLimitOptions = {
  limit: number;
  window: number;
  key?: string | ((...args: unknown[]) => string);
};

export type ValidationOptions = {
  schema: unknown;
  errorMessage?: string;
};

export type BatchOptions = {
  maxSize: number;
  maxWait: number;
  onBatch?: (items: unknown[]) => void;
};
