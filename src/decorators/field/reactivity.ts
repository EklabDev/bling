// Types for the Observable machinery
type Observer<T = any> = (newValue: T, oldValue: T | undefined) => void;
type Unsubscribe = () => void;

/**
 * Decorator to make a field observable
 */
export function Observable() {
  return function (target: undefined, context: ClassFieldDecoratorContext) {
    if (context.kind !== 'field') {
      throw new Error('@Observable can only be used on fields');
    }

    const fieldName = String(context.name);
    const observersKey = Symbol(`${fieldName}:observers`);
    const valueKey = Symbol(`${fieldName}:value`);

    // Use initializer to add observer functionality
    context.addInitializer(function (this: any) {
      // Initialize observers array
      this[observersKey] = new Set<Observer>();

      // Store the initial value
      this[valueKey] = this[fieldName];

      // Define property with getter/setter
      Object.defineProperty(this, fieldName, {
        get() {
          return this[valueKey];
        },
        set(newValue: any) {
          const oldValue = this[valueKey];

          // Only trigger if value actually changed
          if (newValue !== oldValue) {
            // Update the value
            this[valueKey] = newValue;

            // Notify observers
            this[observersKey].forEach((observer: Observer) => {
              observer(newValue, oldValue);
            });
          }
        },
        enumerable: true,
        configurable: true,
      });

      // Add standard subscribe method
      const capitalizedName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);

      // Standard observe method (similar to RxJS behavior)
      this[`observe${capitalizedName}`] = function (observer: Observer): Unsubscribe {
        this[observersKey].add(observer);
        return () => this[observersKey].delete(observer);
      };

      // Add subscribe method that matches common observable patterns
      this[`subscribe${capitalizedName}`] = function (
        nextOrObserver: Observer | ((value: any) => void),
        error?: (error: any) => void,
        complete?: () => void
      ): Unsubscribe {
        // Handle observer object pattern (like RxJS)
        if (typeof nextOrObserver === 'object' && nextOrObserver !== null) {
          const observer = nextOrObserver as {
            next?: (value: any) => void;
            error?: (error: any) => void;
            complete?: () => void;
          };

          const wrappedObserver = (newValue: any) => {
            if (observer.next) observer.next(newValue);
          };

          this[observersKey].add(wrappedObserver);
          return () => this[observersKey].delete(wrappedObserver);
        }

        // Handle function pattern
        const wrappedObserver = (newValue: any) => {
          if (nextOrObserver) nextOrObserver(newValue, undefined);
        };

        this[observersKey].add(wrappedObserver);

        // Immediately emit current value (like BehaviorSubject)
        wrappedObserver(this[valueKey]);

        return () => this[observersKey].delete(wrappedObserver);
      };

      // Add a getValue method for convenience
      this[`get${capitalizedName}`] = function () {
        return this[valueKey];
      };
    });
  };
}

export type WithObservable<T, K extends string> = {
  [P in K as `observe${Capitalize<P>}`]: (
    observer: (newValue: any, oldValue: any | undefined) => void
  ) => Unsubscribe;
} & {
  [P in K as `subscribe${Capitalize<P>}`]: {
    (next: (value: any) => void, error?: (error: any) => void, complete?: () => void): Unsubscribe;
    (observer: {
      next?: (value: any) => void;
      error?: (error: any) => void;
      complete?: () => void;
    }): Unsubscribe;
  };
} & {
  [P in K as `get${Capitalize<P>}`]: () => any;
};

/**
 * Decorator to create a computed property
 * @param computeFn Function that computes the value based on other properties
 */
export function Computed(computeFn: (instance: any) => any) {
  return function (target: undefined, context: ClassFieldDecoratorContext) {
    if (context.kind !== 'field') {
      throw new Error('@Computed can only be used on fields');
    }

    const fieldName = String(context.name);

    // Use initializer to set up computed property
    context.addInitializer(function (this: any) {
      // Cache for the computed value
      let cachedValue: any;

      // Define the property with a getter
      Object.defineProperty(this, fieldName, {
        get() {
          // Pass 'this' to the compute function
          cachedValue = computeFn(this);
          return cachedValue;
        },
        // No setter for computed properties
        enumerable: true,
        configurable: true,
      });
    });
  };
}
// Type for capitalizing the first letter of a string
type Capitalize<S extends string> = S extends `${infer F}${infer R}` ? `${Uppercase<F>}${R}` : S;
