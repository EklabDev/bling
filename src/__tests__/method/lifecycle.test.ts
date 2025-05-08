import { EffectBefore, EffectAfter, EffectError } from '../../decorators/method/lifecycle';

describe('Lifecycle Decorators', () => {
  describe('EffectBefore', () => {
    it('should execute before method', () => {
      const beforeFn = jest.fn();
      const methodFn = jest.fn().mockReturnValue('result');

      class Test {
        @EffectBefore(beforeFn)
        method() {
          return methodFn();
        }
      }

      const test = new Test();
      const result = test.method();

      expect(beforeFn).toHaveBeenCalledTimes(1);
      expect(beforeFn).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName: 'method',
          className: 'Test',
          args: [],
        })
      );
      expect(methodFn).toHaveBeenCalledTimes(1);
      expect(result).toBe('result');
    });

    it('should handle async before effect', async () => {
      const beforeFn = jest.fn().mockResolvedValue(undefined);
      const methodFn = jest.fn().mockReturnValue('result');

      class Test {
        @EffectBefore(beforeFn)
        method() {
          return methodFn();
        }
      }

      const test = new Test();
      const result = await test.method();

      expect(beforeFn).toHaveBeenCalledTimes(1);
      expect(methodFn).toHaveBeenCalledTimes(1);
      expect(result).toBe('result');
    });
  });

  describe('EffectAfter', () => {
    it('should execute after method', () => {
      const afterFn = jest.fn();
      const methodFn = jest.fn().mockReturnValue('result');

      class Test {
        @EffectAfter(afterFn)
        method() {
          return methodFn();
        }
      }

      const test = new Test();
      const result = test.method();

      expect(afterFn).toHaveBeenCalledTimes(1);
      expect(afterFn).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName: 'method',
          className: 'Test',
          args: [],
          result: 'result',
        })
      );
      expect(methodFn).toHaveBeenCalledTimes(1);
      expect(result).toBe('result');
    });

    it('should handle async method', async () => {
      const afterFn = jest.fn();
      const methodFn = jest.fn().mockResolvedValue('result');

      class Test {
        @EffectAfter(afterFn)
        async method() {
          return methodFn();
        }
      }

      const test = new Test();
      const result = await test.method();

      expect(afterFn).toHaveBeenCalledTimes(1);
      expect(afterFn).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName: 'method',
          className: 'Test',
          args: [],
          result: 'result',
        })
      );
      expect(methodFn).toHaveBeenCalledTimes(1);
      expect(result).toBe('result');
    });

    it('should handle async after effect', async () => {
      const afterFn = jest.fn().mockResolvedValue(undefined);
      const methodFn = jest.fn().mockReturnValue('result');

      class Test {
        @EffectAfter(afterFn)
        method() {
          return methodFn();
        }
      }

      const test = new Test();
      const result = await test.method();

      expect(afterFn).toHaveBeenCalledTimes(1);
      expect(methodFn).toHaveBeenCalledTimes(1);
      expect(result).toBe('result');
    });
  });

  describe('EffectError', () => {
    it('should execute on error', () => {
      const errorFn = jest.fn();
      const error = new Error('test error');

      class Test {
        @EffectError(errorFn)
        method() {
          throw error;
        }
      }

      const test = new Test();
      expect(() => test.method()).toThrow(error);

      expect(errorFn).toHaveBeenCalledTimes(1);
      expect(errorFn).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName: 'method',
          className: 'Test',
          args: [],
          error,
        })
      );
    });

    it('should handle async method errors', async () => {
      const errorFn = jest.fn();
      const error = new Error('test error');

      class Test {
        @EffectError(errorFn)
        async method() {
          throw error;
        }
      }

      const test = new Test();
      await expect(test.method()).rejects.toThrow(error);

      expect(errorFn).toHaveBeenCalledTimes(1);
      expect(errorFn).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName: 'method',
          className: 'Test',
          args: [],
          error,
        })
      );
    });

    it('should handle async error effect', async () => {
      const errorFn = jest.fn().mockResolvedValue(undefined);
      const error = new Error('test error');

      class Test {
        @EffectError(errorFn)
        method() {
          throw error;
        }
      }

      const test = new Test();
      await expect(test.method()).rejects.toThrow(error);

      expect(errorFn).toHaveBeenCalledTimes(1);
      expect(errorFn).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName: 'method',
          className: 'Test',
          args: [],
          error,
        })
      );
    });
  });
});
