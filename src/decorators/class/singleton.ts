/**
 * Ensures a class has only one instance
 */

export function Singleton() {
  return function <T extends { new (...args: any[]): Object }>(
    target: T,
    context: ClassDecoratorContext
  ) {
    if (context.kind !== 'class') {
      throw new Error('@Singleton can only be used on classes');
    }

    // Symbol to store the instance
    const instanceKey = Symbol();

    // Return a class that extends the original
    return class SingletonClass extends target {
      static instance: T;
      constructor(...args: any[]) {
        // Check if we already have an instance
        if ((target as any)[instanceKey]) {
          return (target as any)[instanceKey];
        }

        // Create the instance by calling the parent constructor
        super(...args);

        // Store the instance
        (target as any)[instanceKey] = this;
      }
    };
  };
}
