import {
  ValidateArgs,
  Deprecate,
  RateLimited,
  GuardSync,
  GuardAsync,
} from '../../decorators/method/validation';
import { z } from 'zod';

describe('Validation Decorators', () => {
  describe('ValidateArgs', () => {
    it('should validate arguments using Zod schema', () => {
      const schema = z.array(
        z.object({
          name: z.string(),
          age: z.number().min(0),
        })
      );

      class Test {
        @ValidateArgs(schema)
        method(args: unknown) {
          return args;
        }
      }

      const test = new Test();
      const validArgs = { name: 'John', age: 25 };
      const result = test.method(validArgs);
      expect(result).toEqual(validArgs);
    });

    it('should throw error on invalid arguments', () => {
      const schema = z.array(
        z.object({
          name: z.string(),
          age: z.number().min(0),
        })
      );

      class Test {
        @ValidateArgs(schema)
        method(args: unknown) {
          return args;
        }
      }

      const test = new Test();
      const invalidArgs = { name: 'John', age: -1 };
      expect(() => test.method(invalidArgs)).toThrow('Validation failed for method');
    });

    it('should handle array arguments', () => {
      const schema = z.array(z.array(z.string()));

      class Test {
        @ValidateArgs(schema)
        method(args: unknown[]) {
          return args;
        }
      }

      const test = new Test();
      const validArgs = ['a', 'b', 'c'];
      const result = test.method(validArgs);
      expect(result).toEqual(validArgs);
    });
  });

  describe('Deprecate', () => {
    it('should log deprecation warning', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const mockFn = jest.fn().mockReturnValue('result');

      class Test {
        @Deprecate('This method is deprecated')
        method() {
          return mockFn();
        }
      }

      const test = new Test();
      const result = test.method();

      expect(consoleSpy).toHaveBeenCalledWith('Deprecation warning: This method is deprecated');
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(result).toBe('result');
      consoleSpy.mockRestore();
    });

    it('should use default deprecation message', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const mockFn = jest.fn().mockReturnValue('result');

      class Test {
        @Deprecate()
        method() {
          return mockFn();
        }
      }

      const test = new Test();
      const result = test.method();

      expect(consoleSpy).toHaveBeenCalledWith('Deprecation warning: method is deprecated');
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(result).toBe('result');
      consoleSpy.mockRestore();
    });
  });

  describe('GuardSync', () => {
    it('should allow access if guard returns true', () => {
      // This is a placeholder test since the actual implementation
      // would depend on your authentication/authorization system
      class Test {
        @GuardSync((user, fn) => user.isAdmin)
        method(user, fn) {
          return 'result';
        }
      }

      const test = new Test();
      const result = test.method({ isAdmin: true }, 'fn');
      expect(result).toBe('result');
    });

    it('should deny access if guard returns false', () => {
      class Test {
        @GuardSync((user, fn) => user.isAdmin)
        method(user, fn) {
          return 'result';
        }
      }

      const test = new Test();
      expect(() => test.method({ isAdmin: false }, 'fn')).toThrow('Guard failed for method');
    });
  });
  describe('GuardAsync', () => {
    it('should allow access if guard returns true', async () => {
      // This is a placeholder test since the actual implementation
      // would depend on your authentication/authorization system
      class Test {
        @GuardAsync(async (user, fn) => new Promise(resolve => resolve(user.isAdmin)))
        async method(user, fn) {
          return 'result';
        }
      }

      const test = new Test();
      const result = await test.method({ isAdmin: true }, 'fn');
      expect(result).toBe('result');
    });

    it('should deny access if guard returns false', async () => {
      class Test {
        @GuardAsync(async (user, fn) => new Promise(resolve => resolve(user.isAdmin)))
        async method(user, fn) {
          return 'result';
        }
      }

      const test = new Test();
      await expect(test.method({ isAdmin: false }, 'fn')).rejects.toThrow(
        'Guard failed for method'
      );
    });
  });

  describe('RateLimited', () => {
    it('should limit method calls within time window', async () => {
      class Test {
        @RateLimited({ limit: 2, window: 100 })
        method() {
          return 'result';
        }
      }

      const test = new Test();
      const result1 = test.method();
      const result2 = test.method();
      expect(() => test.method()).toThrow('Rate limit exceeded for method');

      expect(result1).toBe('result');
      expect(result2).toBe('result');
    });

    it('should reset limit after window expires', async () => {
      class Test {
        @RateLimited({ limit: 1, window: 100 })
        method() {
          return 'result';
        }
      }

      const test = new Test();
      const result1 = test.method();
      expect(() => test.method()).toThrow('Rate limit exceeded for method');
      await new Promise(resolve => setTimeout(resolve, 150));
      const result2 = test.method();

      expect(result1).toBe('result');
      expect(result2).toBe('result');
    });
  });
});
