import { z } from 'zod';

/**
 * Validates method arguments using a Zod schema
 * @param schema Zod schema for validation
 */
export function ValidateArgs(schema: z.ZodType) {
  return function (target: unknown, context: ClassMethodDecoratorContext) {
    if (context.kind !== 'method') {
      throw new Error('@ValidateArgs can only be used on methods');
    }

    return function (this: unknown, ...args: unknown[]) {
      try {
        const validatedArgs = schema.parse(args);
        return (target as Function).apply(this, validatedArgs);
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new Error(`Validation failed for ${String(context.name)}: ${error.message}`);
        }
        throw error;
      }
    };
  };
}

/**
 * Marks a method as deprecated
 * @param message Optional deprecation message
 */
export function Deprecate(message?: string) {
  return function (target: unknown, context: ClassMethodDecoratorContext) {
    if (context.kind !== 'method') {
      throw new Error('@Deprecate can only be used on methods');
    }

    const deprecationMessage = message || `${String(context.name)} is deprecated`;

    return function (this: unknown, ...args: unknown[]) {
      console.warn(`Deprecation warning: ${deprecationMessage}`);
      return (target as Function).apply(this, args);
    };
  };
}

/**
 * Checks for required permissions before executing a method
 * @param permissions Required permissions
 */
export function GuardSync(GuardFn: (...args: any[]) => boolean) {
  return function (target: unknown, context: ClassMethodDecoratorContext) {
    if (context.kind !== 'method') {
      throw new Error('@GuardSync can only be used on methods');
    }

    return function (this: unknown, ...args: unknown[]) {
      // This is a placeholder implementation. In a real application,
      // you would integrate with your authentication/authorization system

      if (!GuardFn(...args)) {
        throw new Error(`Guard failed for ${String(context.name)}`);
      }

      return (target as Function).apply(this, args);
    };
  };
}
export function GuardAsync(GuardFn: (...args: any[]) => Promise<boolean>) {
  return function (target: unknown, context: ClassMethodDecoratorContext) {
    if (context.kind !== 'method') {
      throw new Error('@GuardAsync can only be used on methods');
    }

    return async function (this: unknown, ...args: unknown[]) {
      // This is a placeholder implementation. In a real application,
      // you would integrate with your authentication/authorization system

      if (!(await GuardFn(...args))) {
        throw new Error(`Guard failed for ${String(context.name)}`);
      }

      return await (target as Function).apply(this, args);
    };
  };
}

/**
 * Implements rate limiting for a method
 * @param options Rate limit configuration
 */
export function RateLimited(options: { limit: number; window: number }) {
  // Create a shared rate limit tracker for the decorator
  // This ensures rate limits are tracked across all instances
  const rateLimitState = new Map<string, number[]>();

  return function <This, Args extends any[], Return>(
    target: (this: This, ...args: Args) => Return,
    context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
  ) {
    if (context.kind !== 'method') {
      throw new Error('@RateLimited can only be used on methods');
    }

    const { limit, window } = options;
    const methodName = String(context.name);

    function replacementMethod(this: This, ...args: Args): Return {
      const now = Date.now();
      const windowStart = now - window;

      // Create a key that combines instance class name and method name
      // This helps isolate rate limits appropriately
      const instanceId = this!.constructor.name;
      const key = `${instanceId}:${methodName}`;

      // Get or initialize the request timestamps for this key
      let requestTimestamps = rateLimitState.get(key) || [];

      // Clean up old requests that are outside the current window
      requestTimestamps = requestTimestamps.filter(timestamp => timestamp > windowStart);

      // Check if rate limit is exceeded
      if (requestTimestamps.length >= limit) {
        const oldestRequest = Math.min(...requestTimestamps);
        const resetTime = oldestRequest + window - now;
        throw new Error(
          `Rate limit exceeded for ${methodName}. ` +
            `Try again in ${Math.ceil(resetTime / 1000)} seconds.`
        );
      }

      // Record this request
      requestTimestamps.push(now);
      rateLimitState.set(key, requestTimestamps);

      // Execute the original method
      return target.apply(this, args);
    }

    return replacementMethod;
  };
}
