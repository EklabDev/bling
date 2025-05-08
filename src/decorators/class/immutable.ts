/**
 * Makes all properties of a class read-only
 */
export function Immutable() {
  return function <T extends new (...args: any[]) => Object>(
    target: T,
    context: ClassDecoratorContext
  ) {
    if (context.kind !== 'class') {
      throw new Error('@Immutable can only be used on classes');
    }

    // Create a subclass that extends the original class
    return class extends target {
      constructor(...args: any[]) {
        super(...args);

        // Make all properties read-only
        Object.keys(this).forEach(key => {
          Object.defineProperty(this, key, {
            writable: false,
            configurable: false,
          });
        });

        // Prevent adding new properties
        Object.preventExtensions(this);
      }
    };
  };
}
