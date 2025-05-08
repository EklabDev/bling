import { z } from 'zod';

/**
 * Validates a field using a Zod schema
 * @param schema Zod schema for validation
 */
export function Validate(schema: z.ZodType) {
  return function (target: undefined, context: ClassFieldDecoratorContext) {
    if (context.kind !== 'field') {
      throw new Error('@Validate can only be used on fields');
    }

    const fieldName = String(context.name);
    const valueKey = Symbol(`${fieldName}:value`);

    context.addInitializer(function (this: any) {
      // Store initial value
      this[valueKey] = this[fieldName];

      // Define property with validation in setter
      Object.defineProperty(this, fieldName, {
        get() {
          return this[valueKey];
        },
        set(value: unknown) {
          try {
            // Validate with the schema
            const validatedValue = schema.parse(value);
            this[valueKey] = validatedValue;
          } catch (error) {
            if (error instanceof z.ZodError) {
              throw new Error(`Validation failed for ${fieldName}: ${error.message}`);
            }
            throw error;
          }
        },
        enumerable: true,
        configurable: true,
      });
    });
  };
}

/**
 * Sets a default value for a field if undefined
 * @param value Default value
 */
export function DefaultValue(defaultVal: unknown) {
  return function (target: undefined, context: ClassFieldDecoratorContext) {
    if (context.kind !== 'field') {
      throw new Error('@DefaultValue can only be used on fields');
    }

    const fieldName = String(context.name);
    const valueKey = Symbol(`${fieldName}:value`);

    context.addInitializer(function (this: any) {
      // Initialize with default if undefined
      this[valueKey] = this[fieldName] === undefined ? defaultVal : this[fieldName];

      // Define property with default value logic
      Object.defineProperty(this, fieldName, {
        get() {
          return this[valueKey] === undefined ? defaultVal : this[valueKey];
        },
        set(value: unknown) {
          this[valueKey] = value;
        },
        enumerable: true,
        configurable: true,
      });
    });
  };
}

/**
 * Automatically trims string values
 */
export function Trim() {
  return function (target: undefined, context: ClassFieldDecoratorContext) {
    if (context.kind !== 'field') {
      throw new Error('@Trim can only be used on fields');
    }

    const fieldName = String(context.name);
    const valueKey = Symbol(`${fieldName}:value`);

    context.addInitializer(function (this: any) {
      // Initial value with trim if it's a string
      const initialValue = this[fieldName];
      this[valueKey] = typeof initialValue === 'string' ? initialValue.trim() : initialValue;

      // Define property with trim in setter
      Object.defineProperty(this, fieldName, {
        get() {
          return this[valueKey];
        },
        set(value: unknown) {
          if (typeof value === 'string') {
            this[valueKey] = value.trim();
          } else {
            this[valueKey] = value;
          }
        },
        enumerable: true,
        configurable: true,
      });
    });
  };
}

/**
 * Controls field serialization
 * @param options Serialization options
 */
export function Serialize(
  options: {
    toJSON?: boolean;
    toObject?: boolean;
  } = {}
) {
  return function (target: undefined, context: ClassFieldDecoratorContext) {
    if (context.kind !== 'field') {
      throw new Error('@Serialize can only be used on fields');
    }

    const { toJSON = true, toObject = true } = options;
    const fieldName = String(context.name);
    const valueKey = Symbol(`${fieldName}:value`);
    const metadataKey = Symbol(`${fieldName}:serializeMetadata`);

    context.addInitializer(function (this: any) {
      // Store initial value
      this[valueKey] = this[fieldName];

      // Store serialization metadata
      this[metadataKey] = { toJSON, toObject };

      // Define property
      Object.defineProperty(this, fieldName, {
        get() {
          const value = this[valueKey];
          return value;
        },
        set(value: unknown) {
          this[valueKey] = value;
        },
        enumerable: true,
        configurable: true,
      });

      // Add serialization metadata to the instance for use with toJSON/toObject methods
      if (!this._serializableFields) {
        this._serializableFields = [];

        // Add toJSON method if not present
        if (toJSON && !this.toJSON) {
          this.toJSON = function () {
            const result: Record<string, any> = {};
            this._serializableFields.forEach((field: string) => {
              const metadata = this[Symbol.for(`${field}:serializeMetadata`)];
              if (metadata && metadata.toJSON) {
                result[field] = this[field];
              }
            });
            return result;
          };
        }

        // Add toObject method if not present
        if (toObject && !this.toObject) {
          this.toObject = function () {
            const result: Record<string, any> = {};
            this._serializableFields.forEach((field: string) => {
              const metadata = this[Symbol.for(`${field}:serializeMetadata`)];
              if (metadata && metadata.toObject) {
                result[field] = this[field];
              }
            });
            return result;
          };
        }
      }

      // Register this field as serializable
      this._serializableFields.push(fieldName);
    });
  };
}

export type WithSerialize<T, K extends string> = {
  [P in K as `toJSON${Capitalize<P>}`]: () => Record<string, any>;
} & {
  [P in K as `toObject${Capitalize<P>}`]: () => Record<string, any>;
};
