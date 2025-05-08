import { CacheOptions } from '../../types';

interface CacheEntry {
  value: unknown;
  expiry: number | undefined;
}

const cache = new Map<string, CacheEntry>();
export type WithCache<T, K extends string> = {
  [P in K as `invalidate${Capitalize<P>}`]: () => void;
};

/**
 * Caches method results with optional expiration
 * @param options Cache configuration options
 */
export function Cached(options: CacheOptions = {}) {
  return function <This, Args extends any[], Return>(
    target: (this: This, ...args: Args) => Return,
    context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
  ) {
    if (context.kind !== 'method') {
      throw new Error('@Cached can only be used on methods');
    }

    const { expiryTime, key } = options;
    const methodName = String(context.name);
    const capitalizedName = methodName.charAt(0).toUpperCase() + methodName.slice(1);
    const invalidateMethodName = `invalidate${capitalizedName}`;

    // List of keys related to this method for invalidation
    const methodCacheKeys = new Set<string>();

    // Add initializer to add an invalidation method
    context.addInitializer(function (this: any) {
      // Add method to invalidate cache for this method
      this[invalidateMethodName] = function () {
        methodCacheKeys.forEach(cacheKey => {
          cache.delete(cacheKey);
        });
        // Clear the set after invalidation
        methodCacheKeys.clear();
      };
    });

    function replacementMethod(this: This, ...args: Args): Return {
      const cacheKey =
        typeof key === 'function'
          ? key(...args)
          : `${this!.constructor.name}:${methodName}:${JSON.stringify(args)}`;

      methodCacheKeys.add(cacheKey);
      const cached = cache.get(cacheKey);
      if (cached) {
        if (!cached.expiry || cached.expiry > Date.now()) {
          return cached.value as Return;
        }
        cache.delete(cacheKey);
      }

      const result = target.apply(this, args);

      if (result instanceof Promise) {
        return result.then(value => {
          cache.set(cacheKey, {
            value,
            expiry: expiryTime ? Date.now() + expiryTime : undefined,
          });
          return value;
        }) as Return;
      }

      cache.set(cacheKey, {
        value: result,
        expiry: expiryTime ? Date.now() + expiryTime : undefined,
      });

      return result;
    }

    return replacementMethod;
  };
}

/**
 * Permanently caches method results
 */
export function Memoize() {
  return function <This, Args extends any[], Return>(
    target: (this: This, ...args: Args) => Return,
    context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
  ) {
    if (context.kind !== 'method') {
      throw new Error('@Memoize can only be used on methods');
    }

    const memoized = new Map<string, unknown>();
    const methodName = String(context.name);

    function replacementMethod(this: This, ...args: Args): Return {
      const key = `${methodName}:${JSON.stringify(args)}`;

      if (memoized.has(key)) {
        return memoized.get(key) as Return;
      }

      const result = target.apply(this, args);

      if (result instanceof Promise) {
        return result.then(value => {
          memoized.set(key, value);
          return value;
        }) as Return;
      }

      memoized.set(key, result);
      return result;
    }

    return replacementMethod;
  };
}
