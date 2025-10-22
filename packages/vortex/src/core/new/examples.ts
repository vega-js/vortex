/**
 * Perfect Reactivity - Usage Examples
 * 
 * Practical examples demonstrating common patterns and best practices.
 */

import { batch, computed, effect, signal } from "./index";

// ============================================================================
// Example 1: Counter
// ============================================================================

export function counterExample() {
  const count = signal(0);
  const double = computed(() => count.read() * 2);

  effect(() => {
    console.log(`Count: ${count.read()}, Double: ${double.read()}`);
  });

  count.write(1); // Logs: "Count: 1, Double: 2"
  count.write(2); // Logs: "Count: 2, Double: 4"
}

// ============================================================================
// Example 2: Form Validation
// ============================================================================

export function formValidationExample() {
  const email = signal("");
  const password = signal("");

  const emailValid = computed(() => {
    const value = email.read();
    return value.includes("@") && value.includes(".");
  });

  const passwordValid = computed(() => {
    return password.read().length >= 8;
  });

  const formValid = computed(() => {
    return emailValid.read() && passwordValid.read();
  });

  effect(() => {
    console.log("Form valid:", formValid.read());
  });

  email.write("test@example.com");
  password.write("securepass123");
  // Logs: "Form valid: true"
}

// ============================================================================
// Example 3: Shopping Cart
// ============================================================================

type CartItem = { id: number; name: string; price: number; quantity: number };

export function shoppingCartExample() {
  const items = signal<CartItem[]>([]);

  const total = computed(() => {
    return items
      .read()
      .reduce((sum, item) => sum + item.price * item.quantity, 0);
  });

  const itemCount = computed(() => {
    return items.read().reduce((sum, item) => sum + item.quantity, 0);
  });

  effect(() => {
    console.log(`Total: $${total.read()}, Items: ${itemCount.read()}`);
  });

  // Add items in batch to avoid multiple effect runs
  batch(() => {
    items.write([
      { id: 1, name: "Book", price: 10, quantity: 2 },
      { id: 2, name: "Pen", price: 2, quantity: 5 },
    ]);
  });
  // Logs once: "Total: $30, Items: 7"
}

// ============================================================================
// Example 4: Conditional Dependencies
// ============================================================================

export function conditionalDependenciesExample() {
  const showAdvanced = signal(false);
  const basicValue = signal(100);
  const advancedValue = signal(200);

  const displayValue = computed(() => {
    if (showAdvanced.read()) {
      return advancedValue.read() * 2;
    }
    return basicValue.read();
  });

  effect(() => {
    console.log("Display:", displayValue.read());
  });

  basicValue.write(150); // Logs: "Display: 150"
  advancedValue.write(300); // No log - not used yet

  showAdvanced.write(true); // Logs: "Display: 600"
  advancedValue.write(400); // Logs: "Display: 800"
}

// ============================================================================
// Example 5: Async Data Loading
// ============================================================================

export function asyncDataLoadingExample() {
  const userId = signal<number | null>(null);
  const userData = signal<{ name: string; email: string } | null>(null);
  const loading = signal(false);
  const error = signal<Error | null>(null);

  // Auto-fetch when userId changes
  effect(() => {
    const id = userId.read();
    if (id === null) return;

    loading.write(true);
    error.write(null);

    fetch(`/api/users/${id}`)
      .then((res) => res.json())
      .then((data) => {
        batch(() => {
          userData.write(data);
          loading.write(false);
        });
      })
      .catch((err) => {
        batch(() => {
          error.write(err);
          loading.write(false);
        });
      });
  });

  const displayStatus = computed(() => {
    if (loading.read()) return "Loading...";
    if (error.read()) return `Error: ${error.read()!.message}`;
    const user = userData.read();
    return user ? `User: ${user.name}` : "No user";
  });

  effect(() => {
    console.log(displayStatus.read());
  });

  userId.write(123);
}

// ============================================================================
// Example 6: Derived State Chain
// ============================================================================

export function derivedStateChainExample() {
  const rawData = signal([1, 2, 3, 4, 5]);

  const filtered = computed(() => {
    return rawData.read().filter((x) => x > 2);
  });

  const mapped = computed(() => {
    return filtered.read().map((x) => x * 2);
  });

  const sum = computed(() => {
    return mapped.read().reduce((a, b) => a + b, 0);
  });

  effect(() => {
    console.log("Sum:", sum.read());
  });

  rawData.write([1, 2, 3, 4, 5, 6]); // Logs: "Sum: 24"
}

// ============================================================================
// Example 7: Multiple Effects with Batching
// ============================================================================

export function multipleEffectsExample() {
  const x = signal(0);
  const y = signal(0);

  const sum = computed(() => x.read() + y.read());
  const product = computed(() => x.read() * y.read());

  effect(() => console.log("Sum:", sum.read()));
  effect(() => console.log("Product:", product.read()));

  // Without batch: 4 logs
  // x.write(5);
  // y.write(10);

  // With batch: 2 logs (one per effect)
  batch(() => {
    x.write(5);
    y.write(10);
  });
}

// ============================================================================
// Example 8: Effect Cleanup
// ============================================================================

export function effectCleanupExample() {
  const active = signal(true);
  const interval = signal(1000);

  const dispose = effect(() => {
    if (!active.read()) return;

    const timerId = setInterval(() => {
      console.log("Tick", interval.read());
    }, interval.read());

    // Note: Perfect Reactivity doesn't have built-in cleanup yet
    // You would need to manage timer cleanup manually
    return () => clearInterval(timerId);
  });

  // Later: stop the effect
  dispose();
}

// ============================================================================
// Example 9: Performance Optimization with peek()
// ============================================================================

export function peekOptimizationExample() {
  const counter = signal(0);
  const label = signal("Count");

  // BAD: Creates unnecessary dependency
  const badDisplay = computed(() => {
    // Reading both creates dependencies on both signals
    return `${label.read()}: ${counter.read()}`;
  });

  // GOOD: Only track counter changes
  const goodDisplay = computed(() => {
    // peek() doesn't create dependency on label
    return `${label.peek()}: ${counter.read()}`;
  });

  effect(() => console.log(goodDisplay.read()));

  counter.write(1); // Logs: "Count: 1"
  label.write("Value"); // No log - no dependency on label
  counter.write(2); // Logs: "Value: 2" (uses updated label)
}

// ============================================================================
// Example 10: Complex State Management
// ============================================================================

type Todo = { id: number; text: string; done: boolean };

export function todoAppExample() {
  const todos = signal<Todo[]>([]);
  const filter = signal<"all" | "active" | "completed">("all");

  const filteredTodos = computed(() => {
    const list = todos.read();
    const f = filter.read();

    switch (f) {
      case "active":
        return list.filter((t) => !t.done);
      case "completed":
        return list.filter((t) => t.done);
      default:
        return list;
    }
  });

  const stats = computed(() => {
    const list = todos.read();
    return {
      total: list.length,
      active: list.filter((t) => !t.done).length,
      completed: list.filter((t) => !t.done).length,
    };
  });

  effect(() => {
    console.log("Filtered:", filteredTodos.read().length);
    console.log("Stats:", stats.read());
  });

  // Add todos
  batch(() => {
    todos.write([
      { id: 1, text: "Learn React", done: false },
      { id: 2, text: "Build app", done: false },
    ]);
  });

  // Toggle todo
  const toggleTodo = (id: number) => {
    todos.write(
      todos.peek().map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  toggleTodo(1);
}



