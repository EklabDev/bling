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
@Singleton()
class DatabaseConnection {
  private connection: any;

  async connect() {
    this.connection = await createConnection();
  }

  async query(sql: string) {
    return this.connection.query(sql);
  }
}

// Usage
const db1 = new DatabaseConnection();
const db2 = new DatabaseConnection();
console.log(db1 === db2); // true - same instance
```

#### @Immutable

Makes all properties of a class read-only after initialization.

```typescript
@Immutable()
class Configuration {
  constructor(
    public readonly apiKey: string,
    public readonly endpoint: string
  ) {}
}

// Usage
const config = new Configuration('key123', 'https://api.example.com');
// config.apiKey = 'newKey'; // Error: Cannot assign to read-only property
```

#### @Serializable

Adds serialization capabilities to a class.

```typescript
@Serializable({
  toJSON: true,
  toObject: true,
  transform: value => ({
    ...value,
    createdAt: new Date(value.createdAt),
  }),
})
class User {
  constructor(
    public name: string,
    public email: string,
    public createdAt: Date
  ) {}
}

// Usage
const user = new User('John', 'john@example.com', new Date());
const json = user.toJSON();
console.log(json); // { name: 'John', email: 'john@example.com', createdAt: Date }
```

### Method Decorators

#### Scheduling Decorators

##### @Schedule

Executes a method based on a cron expression.

```typescript
class TaskScheduler implements Schedulable {
  @Schedule('*/5 * * * *') // Every 5 minutes
  async cleanup() {
    await this.removeOldFiles();
  }

  private async removeOldFiles() {
    // Implementation
  }

  // Required by Schedulable interface
  cleanupScheduling() {
    // Automatically added by decorator
  }
}

// Usage
const scheduler = new TaskScheduler();
// Task runs every 5 minutes
// Clean up when done
scheduler.cleanupScheduling();
```

##### @Interval

Executes a method at regular intervals.

```typescript
class DataPoller implements Schedulable {
  private data: any[] = [];

  @Interval(5000) // Every 5 seconds
  async pollData() {
    const newData = await this.fetchData();
    this.data.push(...newData);
  }

  private async fetchData() {
    // Implementation
    return [];
  }
}

// Usage
const poller = new DataPoller();
// Data is polled every 5 seconds
// Clean up when done
poller.cleanupScheduling();
```

##### @Delay

Executes a method after a specified delay.

```typescript
class DelayedTask implements Schedulable {
  @Delay(1000) // After 1 second
  async execute() {
    console.log('Task executed after delay');
  }
}

// Usage
const task = new DelayedTask();
// Task executes after 1 second
// Clean up when done
task.cleanupScheduling();
```

#### Error Handling Decorators

##### @Retry

Retries a method call on failure with configurable options.

```typescript
class ApiClient {
  @Retry({
    maxRetries: 3,
    strategy: 'exponential',
    backoff: 1000,
    onRetry: (error, attempt) => {
      console.log(`Retry attempt ${attempt} due to ${error.message}`);
    },
  })
  async fetchData(id: string) {
    const response = await fetch(`/api/data/${id}`);
    if (!response.ok) throw new Error('API call failed');
    return response.json();
  }
}

// Usage
const client = new ApiClient();
try {
  const data = await client.fetchData('123');
  console.log(data);
} catch (error) {
  console.error('All retries failed:', error);
}
```

##### @Timeout

Limits the execution time of a method. If the method takes longer than the specified time, it will throw an error.

```typescript
class ExternalService {
  @Timeout(5000) // 5 seconds timeout
  async callExternalApi() {
    const response = await fetch('https://slow-api.example.com');
    return response.json();
  }
}

// Usage
const service = new ExternalService();
try {
  const result = await service.callExternalApi();
  console.log(result);
} catch (error) {
  if (error.message.includes('timed out')) {
    console.error('API call took too long');
  }
}
```

##### @CircuitBreaker

Implements the circuit breaker pattern to prevent cascading failures. The circuit will open after a certain number of failures and close after a reset timeout.

```typescript
class PaymentService {
  @CircuitBreaker({
    failureThreshold: 5,
    resetTimeout: 30000,
    onStateChange: state => {
      console.log(`Circuit state changed to: ${state}`);
    },
  })
  async processPayment(amount: number) {
    const response = await fetch('/api/payments', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
    if (!response.ok) throw new Error('Payment failed');
    return response.json();
  }
}

// Usage
const paymentService = new PaymentService();
try {
  const result = await paymentService.processPayment(100);
  console.log('Payment processed:', result);
} catch (error) {
  console.error('Payment failed:', error);
}
```

##### @Fallback

Provides a fallback implementation when the method fails.

```typescript
class DataService {
  @Fallback(() => ({ data: 'fallback data' }))
  async getData() {
    const response = await fetch('/api/data');
    if (!response.ok) throw new Error('Failed to fetch data');
    return response.json();
  }
}

// Usage
const service = new DataService();
const result = await service.getData();
console.log(result); // Either actual data or fallback data
```

#### Performance Decorators

##### @Memoize

Caches method results permanently.

```typescript
class Calculator {
  @Memoize()
  expensiveOperation(x: number, y: number) {
    console.log('Computing...');
    return x * y;
  }
}

// Usage
const calc = new Calculator();
console.log(calc.expensiveOperation(5, 3)); // Computing... 15
console.log(calc.expensiveOperation(5, 3)); // 15 (cached)
```

##### @DebounceSync/@DebounceAsync

Debounces method calls to prevent rapid-fire execution.

```typescript
class SearchService {
  @DebounceSync(300)
  search(query: string) {
    console.log('Searching for:', query);
    // Implementation
  }

  @DebounceAsync(300)
  async searchAsync(query: string) {
    console.log('Async searching for:', query);
    // Implementation
  }
}

// Usage
const search = new SearchService();
search.search('test'); // Only the last call within 300ms will execute
await search.searchAsync('test'); // Only the last call within 300ms will execute
```

##### @ThrottleSync/@ThrottleAsync

Throttles method calls to limit execution frequency.

```typescript
class EventHandler {
  @ThrottleSync(1000)
  handleEvent() {
    console.log('Event handled');
  }

  @ThrottleAsync(1000)
  async handleEventAsync() {
    console.log('Async event handled');
  }
}

// Usage
const handler = new EventHandler();
handler.handleEvent(); // Executes
handler.handleEvent(); // Throttled
await handler.handleEventAsync(); // Executes
await handler.handleEventAsync(); // Throttled
```

#### Lifecycle Decorators

##### @EffectBefore/@EffectAfter/@EffectError

Executes functions before, after, or on error of a method.

```typescript
class UserService {
  @EffectBefore(context => {
    console.log(`Before ${context.functionName} with args:`, context.args);
  })
  @EffectAfter(context => {
    console.log(`After ${context.functionName} with result:`, context.result);
  })
  @EffectError(context => {
    console.error(`Error in ${context.functionName}:`, context.error);
  })
  async createUser(user: { name: string; email: string }) {
    // Implementation
    return { id: 1, ...user };
  }
}

// Usage
const userService = new UserService();
try {
  const user = await userService.createUser({ name: 'John', email: 'john@example.com' });
  console.log('User created:', user);
} catch (error) {
  console.error('Failed to create user:', error);
}
```

#### Validation Decorators

##### @GuardSync/@GuardAsync

Checks for required permissions before executing a method.

```typescript
class AdminService {
  @GuardSync(user => user.isAdmin)
  deleteUser(userId: string) {
    console.log(`Deleting user ${userId}`);
  }

  @GuardAsync(async user => await checkPermissions(user))
  async updateSettings(settings: Settings) {
    console.log('Updating settings:', settings);
  }
}

// Usage
const admin = new AdminService();
try {
  admin.deleteUser('123'); // Only executes if user.isAdmin is true
  await admin.updateSettings({ theme: 'dark' }); // Only executes if checkPermissions returns true
} catch (error) {
  console.error('Permission denied:', error);
}
```

##### @Deprecate

Marks a method as deprecated.

```typescript
class LegacyService {
  @Deprecate('Use newMethod instead')
  oldMethod() {
    console.log('This is the old implementation');
  }

  newMethod() {
    console.log('This is the new implementation');
  }
}

// Usage
const service = new LegacyService();
service.oldMethod(); // Warning: oldMethod is deprecated. Use newMethod instead
```

### Field Decorators

#### Access Decorators

##### @Getter/@Setter/@Builder

Auto-generates getters, setters, and builder methods for fields. These decorators come with TypeScript helper types to ensure type safety.

```typescript
class Person {
  @Getter()
  private name: string = '';

  @Setter()
  private age: number = 0;

  @Builder()
  private address: string = '';

  constructor(name: string, age: number, address: string) {
    this.name = name;
    this.age = age;
    this.address = address;
  }
}

// Type augmentation
type PersonWithHelpers = Person &
  WithGetter<Person, 'name'> &
  WithSetter<Person, 'age'> &
  WithBuilder<Person, 'address'>;

// Usage
const person = new Person('John', 30, '123 Main St') as PersonWithHelpers;
console.log(person.getName()); // 'John'
person.setAge(31);
console.log(person.getAge()); // 31
person.withAddress('456 Oak St');
console.log(person.getAddress()); // '456 Oak St'
```

#### Validation Decorators

##### @DefaultValue

Sets a default value for a field if undefined.

```typescript
class Configuration {
  @DefaultValue('development')
  environment: string;

  @DefaultValue(3000)
  port: number;
}

// Usage
const config = new Configuration();
console.log(config.environment); // 'development'
console.log(config.port); // 3000
```

#### Reactivity Decorators

##### @Computed

Creates a computed property based on other properties.

```typescript
class User {
  @Setter()
  firstName: string = '';

  @Setter()
  lastName: string = '';

  @Computed(self => `${self.firstName} ${self.lastName}`)
  fullName: string = '';
}

// Usage
const user = new User() as User & WithSetter<User, 'firstName'> & WithSetter<User, 'lastName'>;
user.setFirstName('John');
user.setLastName('Doe');
console.log(user.fullName); // 'John Doe'
```

##### @Observable

Makes a field observable with change tracking.

```typescript
class User {
  @Observable()
  @Setter()
  name: string = '';

  @Observable()
  @Setter()
  email: string = '';
}

// Type augmentation
type UserWithObservable = User &
  WithObservable<User, 'name'> &
  WithObservable<User, 'email'> &
  WithSetter<User, 'name'> &
  WithSetter<User, 'email'>;

// Usage
const user = new User() as UserWithObservable;

// Subscribe to changes
const unsubscribe = user.subscribeName((newValue, oldValue) => {
  console.log(`Name changed from ${oldValue} to ${newValue}`);
});

user.setName('John');
user.setName('Jane');
unsubscribe();
user.setName('Bob'); // No console log
```

## TypeScript Helper Types

The library provides several TypeScript helper types to ensure type safety when using decorators:

### Schedulable Interface

Used with scheduling decorators (`@Schedule`, `@Interval`, `@Delay`):

```typescript
import { Schedule, Interval, Delay, Schedulable } from '@eklabdev/bling';

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

For scheduling decorators (@Schedule, @Interval, @Delay), make sure to call the cleanup method when you're done:

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
