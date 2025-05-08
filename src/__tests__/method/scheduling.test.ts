import {
  Schedule,
  Interval,
  Timeout,
  cleanupScheduling,
  Schedulable,
} from '../../decorators/method/scheduling';
import cron from 'node-cron';

// Mock node-cron
jest.mock('node-cron', () => {
  return {
    schedule: jest.fn().mockImplementation(() => ({
      stop: jest.fn(),
    })),
  };
});

// Properly mock timers
jest.useFakeTimers();

// Explicitly mock setTimeout and setInterval
global.setTimeout = jest.fn().mockReturnValue(123) as unknown as typeof setTimeout;
global.clearTimeout = jest.fn() as unknown as typeof clearTimeout;
global.setInterval = jest.fn().mockReturnValue(456) as unknown as typeof setInterval;
global.clearInterval = jest.fn() as unknown as typeof clearInterval;

describe('Scheduling Decorators', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Schedule', () => {
    it('should schedule a method with cron', () => {
      // Arrange
      class TestClass {
        public called = false;

        @Schedule('*/5 * * * * *')
        testMethod() {
          this.called = true;
        }
      }

      // Act
      const instance = new TestClass() as TestClass & Schedulable;

      // Assert
      expect(cron.schedule).toHaveBeenCalledWith('*/5 * * * * *', expect.any(Function));
      expect(instance.cleanupScheduling).toBeDefined();
    });

    it('should execute the method in the context of the instance', () => {
      // Arrange
      class TestClass {
        public called = false;

        @Schedule('*/5 * * * * *')
        testMethod() {
          this.called = true;
        }
      }

      // Act
      const instance = new TestClass();
      // Get the callback function passed to cron.schedule
      const scheduleCallback = (cron.schedule as jest.Mock).mock.calls[0][1];
      scheduleCallback();

      // Assert
      expect(instance.called).toBe(true);
    });

    it('should cleanup jobs when cleanupScheduling is called', () => {
      // Arrange
      class TestClass {
        @Schedule('*/5 * * * * *')
        testMethod() {}
      }

      // Act
      const instance = new TestClass() as TestClass & Schedulable;
      instance.cleanupScheduling();

      // Assert
      const stopMethod = (cron.schedule as jest.Mock).mock.results[0].value.stop;
      expect(stopMethod).toHaveBeenCalled();
    });
  });

  describe('Interval', () => {
    it('should set an interval for the method', () => {
      // Arrange
      class TestClass {
        public callCount = 0;

        @Interval(1000)
        testMethod() {
          this.callCount++;
        }
      }

      // Act
      const instance = new TestClass() as TestClass & Schedulable;

      // Assert
      expect(setInterval).toHaveBeenCalledWith(expect.any(Function), 1000);
      expect(instance.cleanupScheduling).toBeDefined();
    });

    it('should execute the method in the context of the instance', () => {
      // Arrange
      class TestClass {
        public callCount = 0;

        @Interval(1000)
        testMethod() {
          this.callCount++;
        }
      }

      // Act
      const instance = new TestClass() as TestClass & Schedulable;

      // Execute the interval callback manually
      // Get the first argument (callback function) from the first call to setInterval
      const intervalCallback = (setInterval as jest.Mock).mock.calls[0][0];
      intervalCallback();
      intervalCallback();

      // Assert
      expect(instance.callCount).toBe(2);
    });

    it('should cleanup intervals when cleanupScheduling is called', () => {
      // Arrange
      const intervalId = 123;
      (setInterval as jest.Mock).mockReturnValueOnce(intervalId);

      class TestClass {
        @Interval(1000)
        testMethod() {}
      }

      // Act
      const instance = new TestClass() as TestClass & Schedulable;
      instance.cleanupScheduling();

      // Assert
      expect(clearInterval).toHaveBeenCalledWith(intervalId);
    });
  });

  describe('Timeout', () => {
    it('should set a timeout for the method', () => {
      // Arrange
      class TestClass {
        public called = false;

        @Timeout(1000)
        testMethod() {
          this.called = true;
        }
      }

      // Act
      const instance = new TestClass() as TestClass & Schedulable;

      // Assert
      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 1000);
      expect(instance.cleanupScheduling).toBeDefined();
    });

    it('should execute the method in the context of the instance', () => {
      // Arrange
      class TestClass {
        public called = false;

        @Timeout(1000)
        testMethod() {
          this.called = true;
        }
      }

      // Act
      const instance = new TestClass() as TestClass & Schedulable;

      // Execute the timeout callback manually
      const timeoutCallback = (setTimeout as unknown as jest.Mock).mock.calls[0][0];
      timeoutCallback();

      // Assert
      expect(instance.called).toBe(true);
    });

    it('should cleanup timeouts when cleanupScheduling is called', () => {
      // Arrange
      const timeoutId = 456;
      (setTimeout as unknown as jest.Mock).mockReturnValueOnce(timeoutId);

      class TestClass {
        @Timeout(1000)
        testMethod() {}
      }

      // Act
      const instance = new TestClass() as TestClass & Schedulable;
      instance.cleanupScheduling();

      // Assert
      expect(clearTimeout).toHaveBeenCalledWith(timeoutId);
    });
  });

  describe('cleanupScheduling function', () => {
    it('should properly clean up all scheduled tasks', () => {
      // Arrange
      const intervalId = 123;
      const timeoutId = 456;

      // Mock return values for this test
      (setInterval as unknown as jest.Mock).mockReturnValueOnce(intervalId);
      (setTimeout as unknown as jest.Mock).mockReturnValueOnce(timeoutId);

      class TestClass {
        @Schedule('*/5 * * * * *')
        cronMethod() {}

        @Interval(1000)
        intervalMethod() {}

        @Timeout(2000)
        timeoutMethod() {}
      }

      // Act
      const instance = new TestClass() as TestClass & Schedulable;
      cleanupScheduling(instance); // Test the exported function

      // Assert
      const cronStopMethod = (cron.schedule as jest.Mock).mock.results[0].value.stop;
      expect(cronStopMethod).toHaveBeenCalled();
      expect(clearInterval).toHaveBeenCalledWith(intervalId);
      expect(clearTimeout).toHaveBeenCalledWith(timeoutId);
    });

    it('should handle instances with no scheduled tasks', () => {
      // Arrange
      class TestClass {}

      // Act & Assert
      const instance = new TestClass();
      expect(() => cleanupScheduling(instance)).not.toThrow();
    });
  });

  describe('Multiple instances', () => {
    it('should create separate schedules for each instance', () => {
      // Arrange
      class TestClass {
        public value: string;

        constructor(val: string) {
          this.value = val;
        }

        @Interval(1000)
        testMethod() {
          return this.value;
        }
      }

      // Act
      const instance1 = new TestClass('instance1');
      const instance2 = new TestClass('instance2');

      // Reset mock calls after creating both instances
      const allCalls = (setInterval as jest.Mock).mock.calls;

      // Get the interval callbacks for each instance
      const intervalCallback1 = allCalls[0][0];
      const intervalCallback2 = allCalls[1][0];

      // Execute the callbacks
      const result1 = intervalCallback1();
      const result2 = intervalCallback2();

      // Assert
      expect(setInterval).toHaveBeenCalledTimes(2);
    });
  });
});
