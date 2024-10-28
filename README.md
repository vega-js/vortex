<h1 align="center">Vortex 🌀✨</h1>

<p align="center">A next-gen, lightweight state management library for JavaScript and TypeScript.</p>

---

<p align="center">
	<a href="https://bundlephobia.com/result?p=@vegajs/vortex"><img src="https://img.shields.io/bundlephobia/minzip/@vegajs/vortex?label=bundle%20size&style=flat&colorB=49ff43" height="20"/></a>
    <a href="https://www.npmjs.com/package/@vegajs/vortex"><img src="https://img.shields.io/npm/v/@vegajs/vortex?style=flat&colorB=ffd547" alt="Latest version" height="20"/></a>
    <a href="https://www.npmjs.com/package/@vegajs/vortex"><img src="https://img.shields.io/npm/dt/@vegajs/vortex.svg" alt="Downloads" height="20"/></a>
</p>

<p align="center">
    <img src="https://raw.githubusercontent.com/vega-js/vortex/main/packages/vortex/docs/static/preview.svg" alt="Vortex Preview"/>
</p>


## Why Choose Vortex? 🌪✨

- 🔒 **Type-safe Excellence**: Guarantees full type-safety—no `any` types lurking around.
- ⚡ **Minimized Re-renders**: Only essential updates occur, keeping your app snappy.
- 🌐 **Framework Agnostic**: Integrates effortlessly with React, Vue, and more.
- 🔌 **Plugin Ready**: Extend functionality easily with a rich plugin system.
- 🔧 **DevTools Support**: Inspect and debug your state seamlessly with Vortex DevTools.
- 🧪 **Lightweight & Powerful**: Just ~2.3kB, with zero dependencies.
- 🤩 **Developer Delight**: Intuitive API that grows with your project's needs.

---

- [Explore the full documentation](https://github.com/vega-js/vortex/blob/main/packages/vortex/docs/main.md)
- [Dive into more examples and see Vortex in action](https://github.com/vega-js/vortex/blob/main/packages/vortex/docs/examples/main.md)

---

## Installation

Install Vortex using your favorite package manager:

```bash
npm install @vegajs/vortex
# or
yarn add @vegajs/vortex
# or
pnpm add @vegajs/vortex
```

## Quick Start: Creating a Store

Vortex makes creating a store type-safe, reactive, and straightforward.

```typescript
import { defineStore } from '@vegajs/vortex';

export const counterStore = defineStore(({ reactive, computed, effect }) => {
  const count = reactive(0);
  const doubleCount = computed(() => count.get() * 2);

  effect(() => {
    console.log(`Count is: ${count.get()}`);
  });

  const increment = () => count.set(prev => prev + 1);

  return { count, doubleCount, increment };
});
```

## Core API

### `defineStore(setup, options?)`

Create a powerful store with reactive state, computed properties, and effects to keep your logic organized and streamlined.

- **`setup`**: A function that initializes the state using helper functions.
- **`options`**: Optional configurations like plugins, dependency injection, and store naming.

### `reactive(initialValue)`

Define a reactive state that automatically updates as it changes.

### `computed(fn)`

Define a computed property based on reactive dependencies.

### `effect(fn)`

Create side effects that respond to changes in reactive state.

### `query(fn, options)`

Set up asynchronous queries with built-in state tracking (`isLoading`, `isError`, etc.).

### `DIContainer`

A simple dependency injection container for managing services and external dependencies.


## Real-World Example

A simple counter with reactive state that increments on each click.

```typescript jsx
import { defineStore, useStore } from '@vegajs/vortex';

const counterStore = defineStore(({ reactive, computed }) => {
  const count = reactive(0);
  const doubleCount = computed(() => count.get() * 2);
  const increment = () => count.set(prev => prev + 1);

  return { count, doubleCount, increment };
});

const Counter = () => {
  const { count, doubleCount, increment } = useStore(counterStore);

  return (
    <div>
      <p>count: {count}</p>
      <p>double count: {doubleCount}</p>
      <button onClick={increment}>Increment</button>
    </div>
  );
};
```
---

## License

MIT
