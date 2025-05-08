import { Observable, Computed, WithObservable } from '../../decorators/field/reactivity';
import { Setter, WithSetter } from '../../decorators/field/access';
describe('Field Reactivity Decorators', () => {
  describe('Observable', () => {
    it('should track changes to field value', () => {
      class Test {
        @Observable()
        @Setter()
        value: string = '';
      }

      const test = new Test() as Test & WithObservable<Test, 'value'> & WithSetter<Test, 'value'>;
      const changes: string[] = [];
      const unsubscribe = test.subscribeValue(name => {
        changes.push(name);
      });

      test.setValue('test1');
      test.setValue('test2');
      unsubscribe();
      test.setValue('test3');

      expect(changes).toEqual(['', 'test1', 'test2']);
    });

    it('should handle multiple subscribers', () => {
      class Test {
        @Observable()
        @Setter()
        value: string = '';
      }

      const test = new Test() as Test & WithObservable<Test, 'value'> & WithSetter<Test, 'value'>;
      const changes1: string[] = [];
      const changes2: string[] = [];

      const unsubscribe1 = test.subscribeValue(newValue => {
        changes1.push(newValue);
      });
      const unsubscribe2 = test.subscribeValue(newValue => {
        changes2.push(newValue);
      });

      test.setValue('test1');
      unsubscribe1();
      test.setValue('test2');
      unsubscribe2();
      test.setValue('test3');

      expect(changes1).toEqual(['', 'test1']);
      expect(changes2).toEqual(['', 'test1', 'test2']);
    });

    it('should handle different types', () => {
      class Test {
        @Observable()
        stringValue: string = '';

        @Observable()
        numberValue: number = 0;

        @Observable()
        booleanValue: boolean = false;

        @Observable()
        objectValue: object = {};

        setStringValue(value: string) {
          this.stringValue = value;
        }

        setNumberValue(value: number) {
          this.numberValue = value;
        }

        setBooleanValue(value: boolean) {
          this.booleanValue = value;
        }

        setObjectValue(value: object) {
          this.objectValue = value;
        }
      }

      const test = new Test() as Test &
        WithObservable<Test, 'stringValue'> &
        WithSetter<Test, 'numberValue'>;
      const changes: any[] = [];

      test.subscribeStringValue(newValue => {
        changes.push(newValue);
      });

      test.setStringValue('test');
      test.setNumberValue(42);
      test.setBooleanValue(true);
      test.setObjectValue({ key: 'value' });

      expect(changes).toEqual(['', 'test']);
    });
  });

  describe('Computed', () => {
    it('should compute value based on dependencies', () => {
      class Test {
        @Setter()
        firstName: string = '';

        @Setter()
        lastName: string = '';

        @Computed(self => `${self.firstName} ${self.lastName}`)
        fullName: string = '';
      }

      const test = new Test() as Test &
        WithSetter<Test, 'firstName'> &
        WithSetter<Test, 'lastName'>;
      test.setFirstName('John');
      test.setLastName('Doe');
      // test.updateFullName();
      expect(test.fullName).toBe('John Doe');

      test.setFirstName('Jane');
      // test.updateFullName();
      expect(test.fullName).toBe('Jane Doe');
    });

    it('should cache computed value until dependencies change', () => {
      class Test {
        value: number = 0;

        computationCount = 0;

        @Computed(self => {
          self.computationCount++;
          return self.value * 2;
        })
        doubled: number = 0;

        setValue(value: number) {
          this.value = value;
        }
      }

      const test = new Test();
      test.setValue(5);
      expect(test.doubled).toBe(10);
      expect(test.computationCount).toBe(1);

      // Access multiple times without changing dependencies
      expect(test.doubled).toBe(10);
      expect(test.doubled).toBe(10);
      expect(test.computationCount).toBe(3);

      // Change dependency
      test.setValue(6);
      expect(test.doubled).toBe(12);
      expect(test.computationCount).toBe(4);
    });

    it('should handle multiple computed properties', () => {
      class Test {
        @Observable()
        value: number = 0;

        @Computed(self => self.value * 2)
        doubled: number = 0;

        @Computed(self => self.value * 3)
        tripled: number = 0;

        @Computed(self => self.doubled + self.tripled)
        sum: number = 0;

        setValue(value: number) {
          this.value = value;
        }
      }

      const test = new Test();
      test.setValue(5);
      expect(test.doubled).toBe(10);
      expect(test.tripled).toBe(15);
      expect(test.sum).toBe(25);

      test.setValue(6);
      expect(test.doubled).toBe(12);
      expect(test.tripled).toBe(18);
      expect(test.sum).toBe(30);
    });

    it('should handle async computations', async () => {
      class Test {
        @Observable()
        value: number = 0;

        @Computed(async self => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return self.value * 2;
        })
        doubled: number = 0;

        setValue(value: number) {
          this.value = value;
        }
      }

      const test = new Test();
      test.setValue(5);
      expect(await test.doubled).toBe(10);

      test.setValue(6);
      expect(await test.doubled).toBe(12);
    });
  });
});
