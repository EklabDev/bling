# @eklabdev/bling

A powerful TypeScript decorators library that provides a collection of useful decorators for class and method manipulation, scheduling, caching, error handling, and more.

## Installation

```bash
npm install @eklabdev/bling
```

## Features

### Class Decorators

#### @Singleton

Ensures a class has only one instance throughout the application lifecycle.

```typescript
import { Singleton } from '@eklabdev/bling';

@Singleton()
class DatabaseConnection {
  // Only one instance will ever be created
}
```

#### @Immutable

Makes all properties of a class read-only after initialization.

```typescript
import { Immutable } from '@eklabdev/bling';

@Immutable()
class Configuration {
  constructor(public readonly apiKey: string) {}
}
```

#### @Serializable

Adds serialization capabilities to a class.

```typescript
import { Serializable } from '@eklabdev/bling';

@Serializable({
  toJSON: true,
  toObject: true,
  transform: value => value,
})
class User {
  constructor(
    public name: string,
    public age: number
  ) {}
}
```

### Method Decorators

#### Scheduling Decorators

##### @Schedule

Executes a method based on a cron expression.

```typescript
import { Schedule } from '@eklabdev/bling';

class TaskScheduler {
  @Schedule('*/5 * * * *') // Every 5 minutes
  async cleanup() {
    // Cleanup logic
  }
}
```

##### @Interval

Executes a method at regular intervals.

```typescript
import { Interval } from '@eklabdev/bling';

class DataPoller {
  @Interval(5000) // Every 5 seconds
  async pollData() {
    // Polling logic
  }
}
```

##### @Timeout

Executes a method after a specified delay.

```typescript
import { Timeout } from '@eklabdev/bling';

class DelayedTask {
  @Timeout(1000) // After 1 second
  async execute() {
    // Delayed execution logic
  }
}
```

#### Error Handling Decorators

##### @Retry

Retries a method call on failure with configurable options.

```typescript
import { Retry } from '@eklabdev/bling';

class ApiClient {
  @Retry({
    maxRetries: 3,
    strategy: 'exponential',
    backoff: 1000,
    onRetry: (error, attempt) => console.log(`Retry attempt ${attempt}`),
  })
  async fetchData() {
    // API call logic
  }
}
```

##### @Fallback

Provides a fallback implementation when the method fails.

```typescript
import { Fallback } from '@eklabdev/bling';

class DataService {
  @Fallback(() => ({ data: 'fallback data' }))
  async getData() {
    // Data fetching logic
  }
}
```

#### Performance Decorators

##### @Memoize

Caches method results permanently.

```typescript
import { Memoize } from '@eklabdev/bling';

class Calculator {
  @Memoize()
  expensiveOperation(x: number, y: number) {
    // Expensive calculation
    return x + y;
  }
}
```

##### @DebounceSync/@DebounceAsync

Debounces method calls to prevent rapid-fire execution.

```typescript
import { DebounceSync, DebounceAsync } from '@eklabdev/bling';

class SearchService {
  @DebounceSync(300)
  search(query: string) {
    // Search logic
  }

  @DebounceAsync(300)
  async searchAsync(query: string) {
    // Async search logic
  }
}
```

##### @ThrottleSync/@ThrottleAsync

Throttles method calls to limit execution frequency.

```typescript
import { ThrottleSync, ThrottleAsync } from '@eklabdev/bling';

class EventHandler {
  @ThrottleSync(1000)
  handleEvent() {
    // Event handling logic
  }

  @ThrottleAsync(1000)
  async handleEventAsync() {
    // Async event handling logic
  }
}
```

#### Lifecycle Decorators

##### @EffectBefore/@EffectAfter/@EffectError

Executes functions before, after, or on error of a method.

```typescript
import { EffectBefore, EffectAfter, EffectError } from '@eklabdev/bling';

class UserService {
  @EffectBefore(context => console.log(`Before ${context.functionName}`))
  @EffectAfter(context => console.log(`After ${context.functionName}`))
  @EffectError(context => console.error(`Error in ${context.functionName}`))
  async createUser(user: User) {
    // User creation logic
  }
}
```

#### Validation Decorators

##### @GuardSync/@GuardAsync

Checks for required permissions before executing a method.

```typescript
import { GuardSync, GuardAsync } from '@eklabdev/bling';

class AdminService {
  @GuardSync(user => user.isAdmin)
  deleteUser(userId: string) {
    // Delete user logic
  }

  @GuardAsync(async user => await checkPermissions(user))
  async updateSettings(settings: Settings) {
    // Update settings logic
  }
}
```

##### @Deprecate

Marks a method as deprecated.

```typescript
import { Deprecate } from '@eklabdev/bling';

class LegacyService {
  @Deprecate('Use newMethod instead')
  oldMethod() {
    // Old implementation
  }
}
```

### Field Decorators

#### Access Decorators

##### @Getter/@Setter/@Builder

Auto-generates getters, setters, and builder methods for fields. These decorators come with TypeScript helper types to ensure type safety.

```typescript
import { Getter, Setter, Builder, WithGetter, WithSetter, WithBuilder } from '@eklabdev/bling';

class Person {
  @Getter()
  name: string = '';

  @Setter()
  age: number = 0;

  @Builder()
  address: string = '';

  constructor(name: string, age: number, address: string) {
    this.name = name;
    this.age = age;
    this.address = address;
  }
}

// Type augmentation for the decorated fields
type PersonWithHelpers = Person &
  WithGetter<Person, 'name'> &
  WithSetter<Person, 'age'> &
  WithBuilder<Person, 'address'>;

// Usage with type casting
const person = new Person('John', 30, '123 Main St') as PersonWithHelpers;

// Now TypeScript knows about the generated methods
person.getName(); // Returns string
person.setAge(31); // Returns Person
person.withAddress('456 Oak St'); // Returns Person
```

The helper types provide type safety for the generated methods:

- `WithGetter<T, K>`: Adds type information for getter methods
- `WithSetter<T, K>`: Adds type information for setter methods
- `WithBuilder<T, K>`: Adds type information for builder methods

Where:

- `T` is the class type
- `K` is the field name as a string literal type

#### Validation Decorators

##### @DefaultValue

Sets a default value for a field if undefined.

```typescript
import { DefaultValue } from '@eklabdev/bling';

class Configuration {
  @DefaultValue('development')
  environment: string;
}
```

#### Reactivity Decorators

##### @Computed

Creates a computed property based on other properties.

```typescript
import { Computed } from '@eklabdev/bling';

class User {
  firstName: string;
  lastName: string;

  @Computed(instance => `${instance.firstName} ${instance.lastName}`)
  fullName: string;
}
```

## TypeScript Helper Types

The library provides several TypeScript helper types to ensure type safety when using decorators:

### Schedulable Interface

Used with scheduling decorators (`@Schedule`, `@Interval`, `@Timeout`):

```typescript
import { Schedule, Interval, Timeout, Schedulable } from '@eklabdev/bling';

class TaskScheduler implements Schedulable {
  @Schedule('*/5 * * * *')
  async cleanup() {
    // Cleanup logic
  }

  // Required by Schedulable interface
  cleanupScheduling() {
    // This method is automatically added by the decorators
  }
}
```

### WithCache Type

Used with caching decorators (`@Cached`, `@Memoize`):

```typescript
import { Cached, Memoize, WithCache } from '@eklabdev/bling';

class DataService {
  @Cached({ expiryTime: 5000 })
  async fetchData(id: string) {
    // Data fetching logic
  }
}

// Type augmentation for cache invalidation
type DataServiceWithCache = DataService & WithCache<DataService, 'fetchData'>;

const service = new DataService() as DataServiceWithCache;
service.invalidateFetchData(); // Clears the cache
```

### WithObservable Type

Used with the `@Observable` decorator:

```typescript
import { Observable, WithObservable } from '@eklabdev/bling';

class User {
  @Observable()
  name: string = '';
}

// Type augmentation for observable fields
type UserWithObservable = User & WithObservable<User, 'name'>;

const user = new User() as UserWithObservable;

// Now TypeScript knows about the observer methods
const unsubscribe = user.observeName((newValue, oldValue) => {
  console.log(`Name changed from ${oldValue} to ${newValue}`);
});

// Or use the subscribe pattern
user.subscribeName({
  next: value => console.log(`New name: ${value}`),
  error: error => console.error(error),
  complete: () => console.log('Completed'),
});

// Get current value
const currentName = user.getName();
```

### WithSerialize Type

Used with the `@Serialize` decorator:

```typescript
import { Serialize, WithSerialize } from '@eklabdev/bling';

class User {
  @Serialize()
  name: string = '';
}

// Type augmentation for serialization
type UserWithSerialize = User & WithSerialize<User, 'name'>;

const user = new User() as UserWithSerialize;
const serialized = user.serialize();
```

### Access Helper Types

Used with field access decorators (`@Getter`, `@Setter`, `@Builder`):

```typescript
import { Getter, Setter, Builder, WithGetter, WithSetter, WithBuilder } from '@eklabdev/bling';

class Person {
  @Getter()
  name: string = '';

  @Setter()
  age: number = 0;

  @Builder()
  address: string = '';
}

// Type augmentation for the decorated fields
type PersonWithHelpers = Person &
  WithGetter<Person, 'name'> &
  WithSetter<Person, 'age'> &
  WithBuilder<Person, 'address'>;

const person = new Person() as PersonWithHelpers;

// Now TypeScript knows about the generated methods
person.getName(); // Returns string
person.setAge(31); // Returns Person
person.withAddress('123 Main St'); // Returns Person
```

## Cleanup

For scheduling decorators (@Schedule, @Interval, @Timeout), make sure to call the cleanup method when you're done:

```typescript
class TaskScheduler {
  @Schedule('*/5 * * * *')
  async cleanup() {
    // Cleanup logic
  }

  destroy() {
    this.cleanupScheduling();
  }
}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
