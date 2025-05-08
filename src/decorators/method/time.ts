/**
 * Debounce decorator for both sync and async methods
 * @param delay The delay in milliseconds
 */
/**
 * Debounce decorator for synchronous methods
 * @param delay The delay in milliseconds
 */
export function DebounceSync(delay: number) {
  // Global map to store timeouts by class and method name
  const timeoutMap = new Map<string, NodeJS.Timeout>();

  return function <This extends object, Args extends any[], Return>(
    target: (this: This, ...args: Args) => Return,
    context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
  ) {
    if (context.kind !== 'method') {
      throw new Error('@DebounceSync can only be used on methods');
    }

    const methodName = String(context.name);

    function replacementMethod(this: This, ...args: Args): Promise<Return> {
      // Create a key using class name and method name
      const key = `${this.constructor.name}.${methodName}`;

      // Clear the previous timeout
      const existingTimeout = timeoutMap.get(key);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      return new Promise<Return>(resolve => {
        const newTimeout = setTimeout(() => {
          // Execute the original method
          const result = target.apply(this, args);
          resolve(result);
        }, delay);

        // Store the new timeout ID
        timeoutMap.set(key, newTimeout);
      });
    }

    return replacementMethod;
  };
}

/**
 * Debounce decorator for asynchronous methods
 * @param delay The delay in milliseconds
 */
export function DebounceAsync(delay: number) {
  // Global map to store timeouts by class and method name
  const timeoutMap = new Map<string, NodeJS.Timeout>();

  return function <This extends object, Args extends any[], Return extends Promise<any>>(
    target: (this: This, ...args: Args) => Return,
    context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
  ) {
    if (context.kind !== 'method') {
      throw new Error('@DebounceAsync can only be used on methods');
    }

    const methodName = String(context.name);

    function replacementMethod(this: This, ...args: Args): Return {
      // Create a key using class name and method name
      const key = `${this.constructor.name}.${methodName}`;

      // Clear the previous timeout
      const existingTimeout = timeoutMap.get(key);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // Create a new promise that will resolve when the debounce completes
      const debouncePromise = new Promise(resolve => {
        const newTimeout = setTimeout(() => {
          resolve(null);
        }, delay);

        // Store the new timeout ID
        timeoutMap.set(key, newTimeout);
      });

      // Chain the original method after the debounce completes
      return debouncePromise.then(() => {
        return target.apply(this, args);
      }) as Return;
    }

    return replacementMethod;
  };
}

/**
 * Throttle decorator for synchronous methods
 * @param interval The interval in milliseconds
 */
export function ThrottleSync(interval: number) {
  // Global map to store last call times by class and method name
  const lastCallMap = new Map<string, number>();

  return function <This extends object, Args extends any[], Return>(
    target: (this: This, ...args: Args) => Return,
    context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
  ) {
    if (context.kind !== 'method') {
      throw new Error('@ThrottleSync can only be used on methods');
    }

    const methodName = String(context.name);

    function replacementMethod(this: This, ...args: Args): Return | undefined {
      const now = Date.now();
      const key = `${this.constructor.name}.${methodName}`;
      const lastCall = lastCallMap.get(key) || 0;

      if (now - lastCall >= interval) {
        lastCallMap.set(key, now);
        return target.apply(this, args);
      }

      return undefined;
    }

    return replacementMethod;
  };
}

/**
 * Throttle decorator for asynchronous methods
 * @param interval The interval in milliseconds
 */
export function ThrottleAsync(interval: number) {
  // Global maps to store state by class and method name
  const lastCallMap = new Map<string, number>();
  const lastResultMap = new Map<string, any>();

  return function <This extends object, Args extends any[], Return extends Promise<any>>(
    target: (this: This, ...args: Args) => Return,
    context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
  ) {
    if (context.kind !== 'method') {
      throw new Error('@ThrottleAsync can only be used on methods');
    }

    const methodName = String(context.name);

    function replacementMethod(this: This, ...args: Args): Return {
      const now = Date.now();
      const key = `${this.constructor.name}.${methodName}`;
      const lastCall = lastCallMap.get(key) || 0;

      if (now - lastCall >= interval) {
        const result = target.apply(this, args);
        lastCallMap.set(key, now);
        lastResultMap.set(key, result);
        return result;
      }

      const lastResult = lastResultMap.get(key);
      return lastResult || (Promise.resolve(undefined) as Return);
    }

    return replacementMethod;
  };
}

/**
 * Timed decorator for both sync and async methods
 */
export function Timed() {
  return function <This extends object, Args extends any[], Return>(
    target: (this: This, ...args: Args) => Return,
    context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
  ) {
    if (context.kind !== 'method') {
      throw new Error('@Timed can only be used on methods');
    }

    const methodName = String(context.name);

    function replacementMethod(this: This, ...args: Args): Return {
      const start = performance.now();
      try {
        const result = target.apply(this, args);

        if (result instanceof Promise) {
          return result.then(
            value => {
              const duration = performance.now() - start;
              console.log(`${this.constructor.name}.${methodName} took ${duration.toFixed(2)}ms`);
              return value;
            },
            error => {
              const duration = performance.now() - start;
              console.log(
                `${this.constructor.name}.${methodName} failed after ${duration.toFixed(2)}ms`
              );
              throw error;
            }
          ) as Return;
        }

        const duration = performance.now() - start;
        console.log(`${this.constructor.name}.${methodName} took ${duration.toFixed(2)}ms`);
        return result;
      } catch (error) {
        const duration = performance.now() - start;
        console.log(`${this.constructor.name}.${methodName} failed after ${duration.toFixed(2)}ms`);
        throw error;
      }
    }

    return replacementMethod;
  };
}

/**
 * Measure decorator for both sync and async methods
 * @param options Configuration options for measurement
 */
export function Measure(options: { memory?: boolean; logger?: Function } = {}) {
  return function <This extends object, Args extends any[], Return>(
    target: (this: This, ...args: Args) => Return,
    context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
  ) {
    if (context.kind !== 'method') {
      throw new Error('@Measure can only be used on methods');
    }

    const { memory = false, logger = console.log } = options;
    const methodName = String(context.name);

    function replacementMethod(this: This, ...args: Args): Return {
      const start = performance.now();
      const startMemory = memory && typeof process !== 'undefined' ? process.memoryUsage() : null;

      try {
        const result = target.apply(this, args);

        const logMetrics = () => {
          const duration = performance.now() - start;
          const metrics: Record<string, number> = {
            duration: Number(duration.toFixed(2)),
          };

          if (memory && startMemory) {
            const endMemory = process.memoryUsage();
            metrics['memoryUsed'] = endMemory.heapUsed - startMemory.heapUsed;
          }

          logger(`${this.constructor.name}.${methodName} metrics:`, metrics);
        };

        if (result instanceof Promise) {
          return result.then(
            value => {
              logMetrics();
              return value;
            },
            error => {
              logMetrics();
              throw error;
            }
          ) as Return;
        }

        logMetrics();
        return result;
      } catch (error) {
        const duration = performance.now() - start;
        const metrics: Record<string, number> = {
          duration: Number(duration.toFixed(2)),
        };

        if (memory && startMemory) {
          const endMemory = process.memoryUsage();
          metrics['memoryUsed'] = endMemory.heapUsed - startMemory.heapUsed;
        }

        logger(`${this.constructor.name}.${methodName} failed:`, metrics);
        throw error;
      }
    }

    return replacementMethod;
  };
}
