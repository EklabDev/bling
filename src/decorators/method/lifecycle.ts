import { EffectContext } from '../../types';

/**
 * Executes a function before the decorated method
 * @param fn Function to execute before the method
 */
export function EffectBefore(fn: (context: EffectContext) => unknown) {
  return function (target: unknown, context: ClassMethodDecoratorContext) {
    if (context.kind !== 'method') {
      throw new Error('@EffectBefore can only be used on methods');
    }

    return function (this: unknown, ...args: unknown[]) {
      const effectContext: EffectContext = {
        functionName: String(context.name),
        className: this!.constructor?.name || 'Unknown',
        args,
      };

      const beforeResult = fn(effectContext);
      const methodResult = (target as Function).apply(this, args);

      if (beforeResult instanceof Promise) {
        return beforeResult.then(() => methodResult);
      }

      return methodResult;
    };
  };
}

/**
 * Executes a function after the decorated method
 * @param fn Function to execute after the method
 */
export function EffectAfter(fn: (context: EffectContext) => unknown) {
  return function (target: unknown, context: ClassMethodDecoratorContext) {
    if (context.kind !== 'method') {
      throw new Error('@EffectAfter can only be used on methods');
    }

    return function (this: unknown, ...args: unknown[]) {
      const methodResult = (target as Function).apply(this, args);

      if (methodResult instanceof Promise) {
        return methodResult.then(result => {
          const effectContext: EffectContext = {
            functionName: String(context.name),
            className: this!.constructor?.name || 'Unknown',
            args,
            result,
          };
          return Promise.resolve(fn(effectContext)).then(() => result);
        });
      }

      const effectContext: EffectContext = {
        functionName: String(context.name),
        className: this!.constructor?.name || 'Unknown',
        args,
        result: methodResult,
      };

      const afterResult = fn(effectContext);
      if (afterResult instanceof Promise) {
        return afterResult.then(() => methodResult);
      }

      return methodResult;
    };
  };
}

/**
 * Executes a function when the decorated method throws an error
 * @param fn Function to execute on error
 */
export function EffectError(fn: (context: EffectContext) => unknown) {
  return function (target: unknown, context: ClassMethodDecoratorContext) {
    if (context.kind !== 'method') {
      throw new Error('@EffectError can only be used on methods');
    }

    return function (this: unknown, ...args: unknown[]) {
      try {
        const methodResult = (target as Function).apply(this, args);

        if (methodResult instanceof Promise) {
          return methodResult.catch(error => {
            const effectContext: EffectContext = {
              functionName: String(context.name),
              className: this!.constructor?.name || 'Unknown',
              args,
              error,
            };
            return Promise.resolve(fn(effectContext)).then(() => {
              throw error;
            });
          });
        }

        return methodResult;
      } catch (error) {
        const effectContext: EffectContext = {
          functionName: String(context.name),
          className: this!.constructor?.name || 'Unknown',
          args,
          error: error as Error,
        };

        const errorResult = fn(effectContext);
        if (errorResult instanceof Promise) {
          return errorResult.then(() => {
            throw error;
          });
        }

        throw error;
      }
    };
  };
}
