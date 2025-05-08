/**
 * Adds serialization capabilities to a class
 * @param options Serialization options
 */
export function Serializable(
  options: {
    toJSON?: boolean;
    toObject?: boolean;
    transform?: (value: unknown) => unknown;
  } = {}
) {
  return function <T extends new (...args: any[]) => any>(
    target: T,
    context: ClassDecoratorContext
  ) {
    if (context.kind !== 'class') {
      throw new Error('@Serializable can only be used on classes');
    }

    const { toJSON = true, toObject = true, transform } = options;

    // Return a class that extends the original class
    return class SerializableClass extends target {
      constructor(...args: any[]) {
        super(...args);

        // Add toJSON method if enabled
        if (toJSON) {
          this['toJSON'] = function () {
            const obj = Object.getOwnPropertyNames(this).reduce(
              (acc, key) => {
                const value = this[key];
                if (typeof value === 'function') {
                  return acc;
                }
                acc[key] = transform ? transform(value) : value;
                return acc;
              },
              {} as Record<string, unknown>
            );
            return obj;
          };
        }

        // Add toObject method if enabled
        if (toObject) {
          this['toObject'] = function () {
            return this['toJSON']();
          };
        }
      }
    };
  };
}
