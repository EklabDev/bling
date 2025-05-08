import { RetryOptions, CircuitBreakerOptions } from '../../types';

/**
 * Retries a method call on failure
 * @param options Retry configuration options
 */
export function Retry(options: RetryOptions) {
  return function <This, Args extends any[], Return>(
    target: (this: This, ...args: Args) => Return,
    context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
  ) {
    if (context.kind !== 'method') {
      throw new Error('@Retry can only be used on methods');
    }

    const { maxRetries, strategy, backoff = 1000, onRetry } = options;

    function replacementMethod(this: This, ...args: Args): Promise<Return> {
      let attempts = 0;

      const execute = async (): Promise<Return> => {
        try {
          attempts++; // Increment attempts at the beginning

          const result = target.apply(this, args);

          // Handle both synchronous results and promises
          if (result instanceof Promise) {
            return await result; // This will throw if the promise is rejected
          }

          return result;
        } catch (error) {
          // If we've exceeded max retries, rethrow the error
          if (attempts >= maxRetries + 1) {
            // +1 because we're counting the initial attempt
            throw error;
          }

          if (onRetry) {
            onRetry(error as Error, attempts);
          }

          const delay = strategy === 'exponential' ? backoff * Math.pow(2, attempts - 1) : backoff;

          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, delay));

          // Retry the operation
          return execute();
        }
      };

      return execute();
    }

    return replacementMethod;
  };
}

/**
 * Limits the execution time of a method
 * @param ms Timeout in milliseconds
 */
export function Timeout(ms: number) {
  return function <This, Args extends any[], Return>(
    target: (this: This, ...args: Args) => Return,
    context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
  ) {
    if (context.kind !== 'method') {
      throw new Error('@Timeout can only be used on methods');
    }

    const methodName = String(context.name);

    function replacementMethod(this: This, ...args: Args): Promise<Return> {
      const methodPromise = Promise.resolve(target.apply(this, args));
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`${methodName} timed out after ${ms}ms`));
        }, ms);
      });

      return Promise.race([methodPromise, timeoutPromise]);
    }

    return replacementMethod;
  };
}

/**
 * Implements the circuit breaker pattern
 * @param options Circuit breaker configuration options
 */
export function CircuitBreaker(options: CircuitBreakerOptions) {
  // Create a shared state object for this specific circuit breaker
  const circuitState = {
    failures: 0,
    state: 'closed' as 'closed' | 'open' | 'half-open',
    lastFailureTime: 0,
  };

  return function <This, Args extends any[], Return>(
    target: (this: This, ...args: Args) => Return,
    context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
  ) {
    if (context.kind !== 'method') {
      throw new Error('@CircuitBreaker can only be used on methods');
    }

    // Functions to manage circuit state
    function updateState(newState: 'closed' | 'open' | 'half-open'): void {
      if (circuitState.state !== newState) {
        circuitState.state = newState;
        options.onStateChange?.(newState);
      }
    }

    function handleFailure(error: Error): void {
      circuitState.failures++;
      circuitState.lastFailureTime = Date.now();

      if (circuitState.failures >= options.failureThreshold) {
        updateState('open');
      }
    }

    function replacementMethod(this: This, ...args: Args): Promise<Return> {
      // Always return a Promise for consistent handling
      return new Promise<Return>((resolve, reject) => {
        // Check if circuit is open
        if (circuitState.state === 'open') {
          // Check if we should transition to half-open
          if (Date.now() - circuitState.lastFailureTime >= options.resetTimeout) {
            updateState('half-open');
          } else {
            // Still open - reject with circuit breaker error
            reject(new Error('Circuit breaker is open'));
            return;
          }
        }

        try {
          const result = target.apply(this, args);

          if (result instanceof Promise) {
            result
              .then(value => {
                // Success in half-open state - transition to closed
                if (circuitState.state === 'half-open') {
                  updateState('closed');
                  circuitState.failures = 0;
                }
                resolve(value);
              })
              .catch(error => {
                handleFailure(error);
                reject(error);
              });
          } else {
            // Synchronous success
            if (circuitState.state === 'half-open') {
              updateState('closed');
              circuitState.failures = 0;
            }
            resolve(result as unknown as Return);
          }
        } catch (error) {
          handleFailure(error as Error);
          reject(error);
        }
      });
    }

    return replacementMethod;
  };
}

/**
 * Provides a fallback implementation when the method fails
 * @param fallbackFn Fallback function to execute
 */
export function Fallback<T extends (...args: any[]) => any>(fallbackFn: T) {
  return function <This, Args extends any[], Return>(
    target: (this: This, ...args: Args) => Return,
    context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
  ) {
    if (context.kind !== 'method') {
      throw new Error('@Fallback can only be used on methods');
    }

    function replacementMethod(this: This, ...args: Args): Return | ReturnType<T> {
      try {
        const result = target.apply(this, args);

        if (result instanceof Promise) {
          return result.catch(error => {
            return fallbackFn.apply(this, args);
          }) as Return;
        }

        return result;
      } catch (error) {
        return fallbackFn.apply(this, args);
      }
    }

    return replacementMethod;
  };
}
