import { Validate, DefaultValue, Trim, Serialize } from '../../decorators/field/validation';
import { z } from 'zod';

describe('Field Validation Decorators', () => {
  describe('Validate', () => {
    it('should validate field value using Zod schema', () => {
      class Test {
        @Validate(z.string().min(3))
        value: string = '';

        setValue(value: string) {
          this.value = value;
        }
      }

      const test = new Test();
      test.setValue('valid');
      expect(test.value).toBe('valid');
      expect(() => test.setValue('ab')).toThrow('Validation failed for value');
    });

    it('should handle different validation rules', () => {
      class Test {
        @Validate(z.number().min(0).max(100))
        age: number = 0;

        @Validate(z.string().email())
        email: string = '';

        setAge(age: number) {
          this.age = age;
        }

        setEmail(email: string) {
          this.email = email;
        }
      }

      const test = new Test();
      test.setAge(25);
      test.setEmail('test@example.com');
      expect(test.age).toBe(25);
      expect(test.email).toBe('test@example.com');

      expect(() => test.setAge(-1)).toThrow('Validation failed for age');
      expect(() => test.setEmail('invalid')).toThrow('Validation failed for email');
    });
  });

  describe('DefaultValue', () => {
    it('should set default value when field is undefined', () => {
      class Test {
        @DefaultValue('default')
        value: string | undefined;

        getValue() {
          return this.value;
        }
      }

      const test = new Test();
      expect(test.getValue()).toBe('default');
      test.value = 'custom';
      expect(test.getValue()).toBe('custom');
    });

    it('should handle different types', () => {
      class Test {
        @DefaultValue(42)
        number: number | undefined;

        @DefaultValue(true)
        boolean: boolean | undefined;

        @DefaultValue({ key: 'value' })
        object: object | undefined;

        getNumber() {
          return this.number;
        }

        getBoolean() {
          return this.boolean;
        }

        getObject() {
          return this.object;
        }
      }

      const test = new Test();
      expect(test.getNumber()).toBe(42);
      expect(test.getBoolean()).toBe(true);
      expect(test.getObject()).toEqual({ key: 'value' });
    });
  });

  describe('Trim', () => {
    it('should trim string values', () => {
      class Test {
        @Trim()
        value: string = '';

        setValue(value: string) {
          this.value = value;
        }
      }

      const test = new Test();
      test.setValue('  test  ');
      expect(test.value).toBe('test');
    });

    it('should not affect non-string values', () => {
      class Test {
        @Trim()
        value: any = '';

        setValue(value: any) {
          this.value = value;
        }
      }

      const test = new Test();
      test.setValue(42);
      expect(test.value).toBe(42);
      test.setValue(true);
      expect(test.value).toBe(true);
      test.setValue({ key: 'value' });
      expect(test.value).toEqual({ key: 'value' });
    });
  });

  describe('Serialize', () => {
    it('should control field serialization', () => {
      class Test {
        @Serialize()
        value: string = '';

        setValue(value: string) {
          this.value = value;
        }

        toJSON() {
          return { value: this.value };
        }
      }

      const test = new Test();
      test.setValue('TEST');
      expect(test.value).toBe('TEST');
    });

    it('should handle different serialization options', () => {
      class Test {
        @Serialize({ toJSON: true, toObject: false })
        jsonOnly: string = 'json';

        @Serialize({ toJSON: false, toObject: true })
        objectOnly: string = 'object';

        @Serialize({ toJSON: false, toObject: false })
        neither: string = 'neither';

        toJSON() {
          return { jsonOnly: this.jsonOnly };
        }

        toObject() {
          return { objectOnly: this.objectOnly };
        }
      }

      const test = new Test();
      expect(test.toJSON()).toEqual({ jsonOnly: 'json' });
      expect(test.toObject()).toEqual({ objectOnly: 'object' });
    });
  });
});
