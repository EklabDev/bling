import {
  Getter,
  Setter,
  Builder,
  WithGetter,
  WithSetter,
  WithBuilder,
} from '../../decorators/field/access';

describe('Field Access Decorators', () => {
  describe('Getter', () => {
    it('should generate a getter for a field', () => {
      class Test {
        @Getter()
        private value: string = 'test';

        @Getter()
        private haha: number = 2;
      }

      const test = new Test() as Test & WithGetter<Test, 'value'> & WithGetter<Test, 'haha'>;
      expect(test.getValue()).toBe('test');
      expect(test.getHaha()).toBe(2);
    });

    it('should handle different field types', () => {
      class Test {
        @Getter()
        private number: number = 42;

        @Getter()
        private boolean: boolean = true;

        @Getter()
        private object: object = { key: 'value' };
      }

      const test = new Test() as Test &
        WithGetter<Test, 'number'> &
        WithGetter<Test, 'boolean'> &
        WithGetter<Test, 'object'>;
      expect(test.getNumber()).toBe(42);
      expect(test.getBoolean()).toBe(true);
      expect(test.getObject()).toEqual({ key: 'value' });
    });
  });

  describe('Setter', () => {
    it('should generate a setter for a field', () => {
      class Test {
        @Setter()
        @Getter()
        private value: string = 'initial';
      }

      const test = new Test() as Test & WithSetter<Test, 'value'> & WithGetter<Test, 'value'>;
      test.setValue('new value');
      expect(test.getValue()).toBe('new value');
    });

    it('should handle different field types', () => {
      class Test {
        @Setter()
        @Getter()
        private number: number = 0;

        @Setter()
        @Getter()
        private boolean: boolean = false;

        @Setter()
        @Getter()
        private object: object = {};
      }

      const test = new Test() as Test &
        WithSetter<Test, 'number'> &
        WithSetter<Test, 'boolean'> &
        WithSetter<Test, 'object'> &
        WithGetter<Test, 'number'> &
        WithGetter<Test, 'boolean'> &
        WithGetter<Test, 'object'>;
      test.setNumber(42);
      test.setBoolean(true);
      test.setObject({ key: 'value' });

      expect(test.getNumber()).toBe(42);
      expect(test.getBoolean()).toBe(true);
      expect(test.getObject()).toEqual({ key: 'value' });
    });
  });

  describe('Builder', () => {
    it('should generate a builder method for a field', () => {
      class Test {
        @Builder()
        @Getter()
        private value: string = 'initial';
      }

      const test = new Test() as Test & WithBuilder<Test, 'value'> & WithGetter<Test, 'value'>;
      test.withValue('new value');
      expect(test.getValue()).toBe('new value');
    });

    it('should support method chaining', () => {
      class Test {
        @Builder()
        @Getter()
        private name: string = '';

        @Builder()
        @Getter()
        private age: number = 0;
      }

      type AugmentedTest = Test &
        WithBuilder<Test, 'name'> &
        WithBuilder<Test, 'age'> &
        WithGetter<Test, 'name'> &
        WithGetter<Test, 'age'>;
      const test = new Test() as AugmentedTest;

      (test.withName('John') as AugmentedTest).withAge(25);

      expect(test.getName()).toBe('John');
      expect(test.getAge()).toBe(25);
    });

    it('should handle different field types', () => {
      class Test {
        @Builder()
        @Getter()
        private string: string = '';

        @Builder()
        @Getter()
        private number: number = 0;

        @Builder()
        @Getter()
        private boolean: boolean = false;

        @Builder()
        @Getter()
        private object: object = {};
      }

      type AugmentedTest = Test &
        WithBuilder<Test, 'string'> &
        WithBuilder<Test, 'number'> &
        WithBuilder<Test, 'boolean'> &
        WithBuilder<Test, 'object'> &
        WithGetter<Test, 'string'> &
        WithGetter<Test, 'number'> &
        WithGetter<Test, 'boolean'> &
        WithGetter<Test, 'object'>;
      const test = new Test() as AugmentedTest;
      (
        ((test.withString('test') as AugmentedTest).withNumber(42) as AugmentedTest).withBoolean(
          true
        ) as AugmentedTest
      ).withObject({ key: 'value' });
      expect(test.getString()).toBe('test');
      expect(test.getNumber()).toBe(42);
      expect(test.getBoolean()).toBe(true);
      expect(test.getObject()).toEqual({ key: 'value' });
    });
  });
});
