import {
  ThrottleSync,
  ThrottleAsync,
  Timed,
  Measure,
  DebounceAsync,
  DebounceSync,
} from '../../decorators/method/time';

describe('Time Decorators', () => {
  describe('Debounce', () => {
    it('should debounce method calls', async () => {
      const mockFn = jest.fn();
      class Test {
        @DebounceSync(100)
        method() {
          mockFn();
        }
      }

      const test = new Test();
      test.method();
      test.method();
      test.method();

      expect(mockFn).not.toHaveBeenCalled();
      await new Promise(resolve => setTimeout(resolve, 150));
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should handle async methods', async () => {
      const mockFn = jest.fn();
      class Test {
        @DebounceAsync(100)
        async method() {
          mockFn();
          return 'result';
        }
      }

      const test = new Test();
      const promise1 = test.method();
      const promise2 = test.method();

      expect(mockFn).not.toHaveBeenCalled();
      await new Promise(resolve => setTimeout(resolve, 150));
      expect(mockFn).toHaveBeenCalledTimes(1);
      console.log(promise1, promise2);
    });
  });

  describe('Throttle', () => {
    it('should throttle method calls', async () => {
      const mockFn = jest.fn();
      class Test {
        @ThrottleSync(100)
        method() {
          mockFn();
        }
      }

      const test = new Test();
      test.method();
      test.method();
      test.method();

      expect(mockFn).toHaveBeenCalledTimes(1);
      await new Promise(resolve => setTimeout(resolve, 150));
      test.method();
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should handle async methods', async () => {
      const mockFn = jest.fn();
      class Test {
        @ThrottleAsync(100)
        async method() {
          mockFn();
          return 'result';
        }
      }

      const test = new Test();
      const promise1 = test.method();
      const promise2 = test.method();

      expect(mockFn).toHaveBeenCalledTimes(1);
      await expect(promise1).resolves.toBe('result');
      await expect(promise2).resolves.toBe('result');
    });
  });

  describe('Timed', () => {
    it('should log execution time for sync methods', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      class Test {
        @Timed()
        method() {
          return 'result';
        }
      }

      const test = new Test();
      const result = test.method();

      expect(result).toBe('result');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringMatching(/method took \d+\.\d+ms/));
      consoleSpy.mockRestore();
    });

    it('should log execution time for async methods', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      class Test {
        @Timed()
        async method() {
          await new Promise(resolve => setTimeout(resolve, 100));
          return 'result';
        }
      }

      const test = new Test();
      const result = await test.method();

      expect(result).toBe('result');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringMatching(/method took \d+\.\d+ms/));
      consoleSpy.mockRestore();
    });
  });

  describe('Measure', () => {
    it('should measure performance metrics', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      class Test {
        @Measure({ memory: true })
        method() {
          return 'result';
        }
      }

      const test = new Test();
      const result = test.method();

      expect(result).toBe('result');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/method metrics:/),
        expect.objectContaining({
          duration: expect.any(Number),
          memoryUsed: expect.any(Number),
        })
      );
      consoleSpy.mockRestore();
    });

    it('should use custom logger', () => {
      const customLogger = jest.fn();
      class Test {
        @Measure({ logger: customLogger })
        method() {
          return 'result';
        }
      }

      const test = new Test();
      const result = test.method();

      expect(result).toBe('result');
      expect(customLogger).toHaveBeenCalledWith(
        expect.stringMatching(/method metrics:/),
        expect.objectContaining({
          duration: expect.any(Number),
        })
      );
    });
  });
});
