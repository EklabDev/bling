import { Immutable } from '../../decorators/class/immutable';
import { Singleton } from '../../decorators/class/singleton';
import { Serializable } from '../../decorators/class/serializable';

describe('Class Decorators', () => {
  describe('Singleton', () => {
    it('should ensure only one instance exists', () => {
      @Singleton()
      class Test {
        value: string = '';

        setValue(value: string) {
          this.value = value;
        }
      }

      const instance1 = new Test();
      const instance2 = new Test();

      expect(instance1).toBe(instance2);
      instance1.setValue('test');
      expect(instance2.value).toBe('test');
    });

    it('should handle constructor arguments', () => {
      @Singleton()
      class Test {
        constructor(public value: string) {}
      }

      const instance1 = new Test('test1');
      const instance2 = new Test('test2');

      expect(instance1).toBe(instance2);
      expect(instance1.value).toBe('test1');
      expect(instance2.value).toBe('test1');
    });
  });

  describe('Immutable', () => {
    it('should make all properties read-only', () => {
      @Immutable()
      class Test {
        value: string = '';
        number: number = 0;
        object: { key: string } = { key: 'value' };
      }

      const test = new Test();
      expect(() => {
        test.value = 'new value';
      }).toThrow();
      expect(() => {
        test.number = 42;
      }).toThrow();
      expect(() => {
        test.object = { key: 'new value' };
      }).toThrow();
    });

    it('should prevent adding new properties', () => {
      @Immutable()
      class Test {
        value: string = '';
      }

      const test = new Test();
      expect(() => {
        (test as any).newProperty = 'value';
      }).toThrow();
    });
  });

  describe('Serializable', () => {
    it('should add serialization methods', () => {
      @Serializable()
      class Test {
        value: string = 'test';
        number: number = 42;
        object: { key: string } = { key: 'value' };

        toJSON() {
          return {
            value: this.value,
            number: this.number,
            object: this.object,
          };
        }
      }

      const test = new Test();
      const json = test.toJSON();
      expect(json).toEqual({
        value: 'test',
        number: 42,
        object: { key: 'value' },
      });
    });

    it('should handle custom serialization options', () => {
      @Serializable({
        toJSON: true,
        toObject: true,
        transform: (value: any) => {
          if (typeof value === 'string') {
            return value.toUpperCase();
          }
          return value;
        },
      })
      class Test {
        value: string = 'test';
        number: number = 42;

        toJSON() {
          return {
            value: this.value,
            number: this.number,
          };
        }
      }

      const test = new Test();
      const json = test.toJSON();
      expect(json).toEqual({
        value: 'TEST',
        number: 42,
      });
    });

    it('should handle circular references', () => {
      @Serializable()
      class Test {
        value: string = 'test';
        self: Test | null = null;
      }

      const test = new Test();
      test.self = test;

      const json = test['toJSON']();
      expect(json).toEqual({
        self: test,
        value: 'test',
      });
    });
  });
});
