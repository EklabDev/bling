import cron from 'node-cron';

// Symbol keys for storing timers
const CRON_JOBS = Symbol('cronJobs');
const INTERVALS = Symbol('intervals');
const TIMEOUTS = Symbol('timeouts');

export interface Schedulable {
  /**
   * Cleans up all scheduled tasks (cron jobs, intervals, timeouts)
   * associated with this instance
   */
  cleanupScheduling(): void;
}
/**
 * Schedule a method to be executed based on a cron expression
 * @param cronExpression - The cron expression to schedule the method
 */
export function Schedule(cronExpression: string) {
  return function <This extends object, Args extends any[], Return>(
    target: (this: This, ...args: Args) => Return,
    context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
  ) {
    if (context.kind !== 'method') {
      throw new Error('Schedule decorator can only be applied to methods');
    }

    const methodName = String(context.name);

    // Use initializer to set up the scheduled job
    context.addInitializer(function (this: any) {
      // Create the job map if it doesn't exist
      if (!this[CRON_JOBS]) {
        this[CRON_JOBS] = new Map<string, cron.ScheduledTask>();
      }

      // Schedule the job with the instance context
      const job = cron.schedule(cronExpression, () => {
        target.call(this, ...([] as unknown as Args));
      });

      // Store the job reference for cleanup
      this[CRON_JOBS].set(methodName, job);

      // Add cleanup method if not already added
      if (!this.cleanupScheduling) {
        this.cleanupScheduling = function () {
          cleanup(this);
        };
      }
    });

    // Return the original method
    return target;
  };
}

/**
 * Execute a method at regular intervals
 * @param interval - The interval in milliseconds
 */
export function Interval(interval: number) {
  return function <This extends object, Args extends any[], Return>(
    target: (this: This, ...args: Args) => Return,
    context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
  ) {
    if (context.kind !== 'method') {
      throw new Error('Interval decorator can only be applied to methods');
    }

    const methodName = String(context.name);

    // Use initializer to set up the interval
    context.addInitializer(function (this: any) {
      // Create the intervals map if it doesn't exist
      if (!this[INTERVALS]) {
        this[INTERVALS] = new Map<string, NodeJS.Timeout>();
      }

      // Set up the interval with the instance context
      const timer = setInterval(() => {
        target.call(this, ...([] as unknown as Args));
      }, interval);

      // Store the timer reference for cleanup
      this[INTERVALS].set(methodName, timer);

      // Add cleanup method if not already added
      if (!this.cleanupScheduling) {
        this.cleanupScheduling = function () {
          cleanup(this);
        };
      }
    });

    // Return the original method
    return target;
  };
}

/**
 * Execute a method after a specified delay
 * @param delay - The delay in milliseconds
 */
export function Timeout(delay: number) {
  return function <This extends object, Args extends any[], Return>(
    target: (this: This, ...args: Args) => Return,
    context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
  ) {
    if (context.kind !== 'method') {
      throw new Error('Timeout decorator can only be applied to methods');
    }

    const methodName = String(context.name);

    // Use initializer to set up the timeout
    context.addInitializer(function (this: any) {
      // Create the timeouts map if it doesn't exist
      if (!this[TIMEOUTS]) {
        this[TIMEOUTS] = new Map<string, NodeJS.Timeout>();
      }

      // Set up the timeout with the instance context
      const timer = setTimeout(() => {
        target.call(this, ...([] as unknown as Args));
      }, delay);

      // Store the timer reference for cleanup
      this[TIMEOUTS].set(methodName, timer);

      // Add cleanup method if not already added
      if (!this.cleanupScheduling) {
        this.cleanupScheduling = function () {
          cleanup(this);
        };
      }
    });

    // Return the original method
    return target;
  };
}

/**
 * Cleanup function to be called when an instance is destroyed
 * This is automatically added to decorated classes as cleanupScheduling()
 */
function cleanup(instance: any): void {
  // Clear all cron jobs
  if (instance[CRON_JOBS]) {
    for (const job of instance[CRON_JOBS].values()) {
      job.stop();
    }
    instance[CRON_JOBS].clear();
  }

  // Clear all intervals
  if (instance[INTERVALS]) {
    for (const timer of instance[INTERVALS].values()) {
      clearInterval(timer);
    }
    instance[INTERVALS].clear();
  }

  // Clear all timeouts
  if (instance[TIMEOUTS]) {
    for (const timer of instance[TIMEOUTS].values()) {
      clearTimeout(timer);
    }
    instance[TIMEOUTS].clear();
  }
}

/**
 * Explicit cleanup function to be called when an instance is destroyed
 * This can be called manually if the automatic cleanupScheduling method is not used
 */
export function cleanupScheduling(instance: any): void {
  cleanup(instance);
}
