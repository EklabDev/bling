import { Cached, Memoize, WithCache } from '../../decorators/method/cache';

describe('Cache Decorators', () => {
  describe('Cached', () => {
    it('should cache method results', () => {
      const mockFn = jest.fn().mockReturnValue('result');
      class Test {
        @Cached()
        method() {
          return mockFn();
        }
      }

      const test = new Test();
      const result1 = test.method();
      const result2 = test.method();

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(result1).toBe('result');
      expect(result2).toBe('result');
    });

    it('should handle cache expiration', async () => {
      const mockFn = jest.fn().mockReturnValue('result');
      class Test1 {
        @Cached({ expiryTime: 100 })
        method() {
          return mockFn();
        }
      }

      const test = new Test1();
      const result1 = test.method();
      await new Promise(resolve => setTimeout(resolve, 150));
      const result2 = test.method();

      expect(result1).toBe('result');
      expect(result2).toBe('result');

      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should handle async methods', async () => {
      const mockFn = jest.fn().mockResolvedValue('result');
      class Test2 {
        @Cached()
        async method() {
          return mockFn();
        }
      }

      const test = new Test2();
      const result1 = await test.method();
      const result2 = await test.method();

      expect(result1).toBe('result');
      expect(result2).toBe('result');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should use custom cache key', () => {
      const mockFn = jest.fn().mockReturnValue('result');
      class Test3 {
        @Cached({ key: (arg: string) => `custom:${arg}` })
        method(arg: string) {
          return mockFn(arg);
        }
      }

      const test = new Test3();
      test.method('test1');
      test.method('test1');
      test.method('test2');

      expect(mockFn).toHaveBeenCalledWith('test1');
      expect(mockFn).toHaveBeenCalledWith('test2');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should invalidate cache when called invalidateMethod', () => {
      const mockFn = jest.fn().mockReturnValue('result');
      class Test4 {
        @Cached()
        method(arg: string) {
          return mockFn(arg);
        }
      }

      const test = new Test4() as Test4 & WithCache<Test4, 'method'>;
      test.method('test1');
      test.method('test1');
      test.method('test2');

      expect(mockFn).toHaveBeenCalledWith('test1');
      expect(mockFn).toHaveBeenCalledWith('test2');

      expect(mockFn).toHaveBeenCalledTimes(2);
      test.invalidateMethod();
      test.method('test1');
      expect(mockFn).toHaveBeenCalledTimes(3);
      test.method('test2');
      expect(mockFn).toHaveBeenCalledTimes(4);
    });

    it('should invalidate cache when invalidate is called even if expiryTime is not reached', async () => {
      const mockFn = jest.fn().mockReturnValue('result');
      class Test5 {
        @Cached({ expiryTime: 300 })
        method(arg: string) {
          return mockFn(arg);
        }
      }

      const test = new Test5() as Test5 & WithCache<Test5, 'method'>;
      test.method('test1');
      await new Promise(resolve => setTimeout(resolve, 50));
      test.invalidateMethod();
      test.method('test1');
      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(mockFn).toHaveBeenCalledWith('test1');
    });
  });

  describe('Memoize', () => {
    it('should permanently cache method results', () => {
      const mockFn = jest.fn().mockReturnValue('result');
      class Test {
        @Memoize()
        method() {
          return mockFn();
        }
      }

      const test = new Test();
      const result1 = test.method();
      const result2 = test.method();

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(result1).toBe('result');
      expect(result2).toBe('result');
    });

    it('should handle async methods', async () => {
      const mockFn = jest.fn().mockResolvedValue('result');
      class Test {
        @Memoize()
        async method() {
          return mockFn();
        }
      }

      const test = new Test();
      const result1 = await test.method();
      const result2 = await test.method();

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(result1).toBe('result');
      expect(result2).toBe('result');
    });
  });
});
