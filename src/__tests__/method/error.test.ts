import { Retry, Timeout, CircuitBreaker, Fallback } from '../../decorators/method/error';

describe('Error Handling Decorators', () => {
  describe('Retry', () => {
    it('should retry on failure', async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('test error'))
        .mockResolvedValueOnce('success');

      class Test {
        @Retry({ maxRetries: 1, strategy: 'normal' })
        async method() {
          return mockFn();
        }
      }

      const test = new Test();
      const result = await test.method();

      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(result).toBe('success');
    });

    it('should respect max retries', async () => {
      const error = new Error('test error');
      const mockFn = jest
        .fn()
        .mockRejectedValue(error)
        .mockRejectedValue(error)
        .mockRejectedValue(error);

      class Test {
        @Retry({ maxRetries: 2, strategy: 'normal', backoff: 100 })
        async method() {
          return mockFn();
        }
      }

      const test = new Test();
      await expect(test.method()).rejects.toThrow(error);
      await new Promise(resolve => setTimeout(resolve, 400));
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should use exponential backoff', async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('test error'))
        .mockRejectedValueOnce(new Error('test error'))
        .mockResolvedValueOnce('success');

      const startTime = Date.now();
      class Test {
        @Retry({ maxRetries: 2, strategy: 'exponential', backoff: 100 })
        async method() {
          return mockFn();
        }
      }

      const test = new Test();
      const result = await test.method();
      const duration = Date.now() - startTime;

      expect(mockFn).toHaveBeenCalledTimes(3);
      expect(result).toBe('success');
      expect(duration).toBeGreaterThanOrEqual(300); // 100 + 200
    });

    it('should call onRetry callback', async () => {
      const error = new Error('test error');
      const mockFn = jest.fn().mockRejectedValue(error);
      const onRetry = jest.fn();

      class Test {
        @Retry({ maxRetries: 1, strategy: 'normal', onRetry })
        async method() {
          return mockFn();
        }
      }

      const test = new Test();
      await expect(test.method()).rejects.toThrow(error);

      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(error, 1);
    });
  });

  describe('Timeout', () => {
    it('should timeout long-running operations', async () => {
      class Test {
        @Timeout(100)
        async method() {
          await new Promise(resolve => setTimeout(resolve, 200));
          return 'success';
        }
      }

      const test = new Test();
      await expect(test.method()).rejects.toThrow('method timed out after 100ms');
    });

    it('should not timeout quick operations', async () => {
      class Test {
        @Timeout(200)
        async method() {
          await new Promise(resolve => setTimeout(resolve, 100));
          return 'success';
        }
      }

      const test = new Test();
      const result = await test.method();
      expect(result).toBe('success');
    });
  });

  describe('CircuitBreaker', () => {
    it('should open circuit after threshold failures', async () => {
      const error = new Error('test error');
      const mockFn = jest.fn().mockRejectedValue(error);

      class Test {
        @CircuitBreaker({ failureThreshold: 2, resetTimeout: 100 })
        async method() {
          return mockFn();
        }
      }

      const test = new Test();

      // First call - should fail normally
      await expect(test.method()).rejects.toThrow(error);
      expect(mockFn).toHaveBeenCalledTimes(1);

      // Second call - should fail normally and open the circuit
      await expect(test.method()).rejects.toThrow(error);
      expect(mockFn).toHaveBeenCalledTimes(2);

      // Third call - circuit should be open, mockFn should not be called
      await expect(test.method()).rejects.toThrow('Circuit breaker is open');
      expect(mockFn).toHaveBeenCalledTimes(2); // Still 2, not 3
    });

    it('should reset circuit after timeout', async () => {
      const error = new Error('test error');
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce('success');

      class Test {
        @CircuitBreaker({ failureThreshold: 2, resetTimeout: 100 })
        async method() {
          return mockFn();
        }
      }

      const test = new Test();
      await expect(test.method()).rejects.toThrow(error);
      await expect(test.method()).rejects.toThrow(error);
      await new Promise(resolve => setTimeout(resolve, 150));
      const result = await test.method();
      expect(result).toBe('success');
    });

    it('should call onStateChange callback', async () => {
      const error = new Error('test error');
      const mockFn = jest.fn().mockRejectedValue(error);
      const onStateChange = jest.fn();

      class Test {
        @CircuitBreaker({ failureThreshold: 1, resetTimeout: 100, onStateChange })
        async method() {
          return mockFn();
        }
      }

      const test = new Test();
      await expect(test.method()).rejects.toThrow(error);
      expect(test.method()).rejects.toThrow('Circuit breaker is open');

      expect(onStateChange).toHaveBeenCalledTimes(1);
      expect(onStateChange).toHaveBeenCalledWith('open');
    });
  });

  describe('Fallback', () => {
    it('should use fallback on error', async () => {
      const error = new Error('test error');
      const mockFn = jest.fn().mockRejectedValue(error);
      const fallbackFn = jest.fn().mockResolvedValue('fallback');

      class Test {
        @Fallback(fallbackFn)
        async method() {
          return mockFn();
        }
      }

      const test = new Test();
      const result = await test.method();

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(fallbackFn).toHaveBeenCalledTimes(1);
      expect(result).toBe('fallback');
    });

    it('should not use fallback on success', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');
      const fallbackFn = jest.fn();

      class Test {
        @Fallback(fallbackFn)
        async method() {
          return mockFn();
        }
      }

      const test = new Test();
      const result = await test.method();

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(fallbackFn).not.toHaveBeenCalled();
      expect(result).toBe('success');
    });
  });
});
