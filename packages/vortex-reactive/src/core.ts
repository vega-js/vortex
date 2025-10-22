/**
 * Perfect Reactivity - Core Implementation
 *
 * High-performance fine-grained reactive system featuring:
 * - Hybrid pull-push propagation model
 * - Glitch-free updates via topological ordering
 * - Optimized dependency tracking with linked lists
 * - Automatic batching and effect scheduling
 */

// ============================================================================
// Global State
// ============================================================================

/** Global version counter incremented on each signal write */
export let globalVersion = 1;

/** Check cycle counter for memoizing dependency checks */
let checkCycle = 1;

/** Current tracking context during reactive execution */
export let trackingContext: ComputedNode | EffectNode | null = null;

/** Batch nesting depth for nested batch operations */
export let batchDepth = 0;

/** Effects queued during batch or propagation phase */
export let batchedEffects: EffectNode[] | null = null;

/** Flag indicating active propagation for automatic effect batching */
let isPropagating = false;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Fast equality check with shallow array comparison
 * Enables avoidable optimization for common patterns
 */
function fastEquals(a: any, b: any): boolean {
  if (a === b) return true;
  if (a !== a) return b !== b; // NaN check

  const typeA = typeof a;
  if (typeA !== 'object' || a === null) return false;
  if (typeof b !== 'object' || b === null) return false;

  // Deep equality for small arrays (≤10 elements)
  if (Array.isArray(a) && Array.isArray(b)) {
    const len = a.length;
    if (len !== b.length || len > 10) return false;

    for (let i = 0; i < len; i++) {
      const ai = a[i];
      const bi = b[i];

      if (ai === bi || (ai !== ai && bi !== bi)) continue;

      if (
        typeof ai === 'object' &&
        ai !== null &&
        typeof bi === 'object' &&
        bi !== null
      ) {
        const keysA = Object.keys(ai);
        if (keysA.length !== Object.keys(bi).length) return false;

        for (let j = 0; j < keysA.length; j++) {
          if (ai[keysA[j]] !== bi[keysA[j]]) return false;
        }
      } else {
        return false;
      }
    }
    return true;
  }

  return false;
}

// ============================================================================
// Core Types
// ============================================================================

/**
 * Dependency link between reactive nodes
 *
 * Forms a bidirectional doubly-linked list structure for efficient
 * dependency tracking and traversal.
 */
export type Link = {
  /** Dependency node (source) */
  dep: SignalNode | ComputedNode | null;
  /** Subscriber node (target) */
  sub: ComputedNode | EffectNode | null;
  /** Cached version for staleness checks */
  version: number;
  /** Next dependency in subscriber's dep list */
  nextDep: Link | null;
  /** Previous dependency in subscriber's dep list */
  prevDep: Link | null;
  /** Next subscriber in dependency's sub list */
  nextSub: Link | null;
  /** Previous subscriber in dependency's sub list */
  prevSub: Link | null;
};

/**
 * Signal node - reactive data source
 *
 * Stores mutable state and tracks subscribers.
 */
export type SignalNode = {
  /** Current value */
  value: any;
  /** Head of subscriber list */
  subs: Link | null;
  /** Tail of subscriber list (for O(1) appends) */
  subsTail: Link | null;
  /** Version for change detection */
  version: number;
};

/**
 * Creates a new signal node
 *
 * @param value - Initial value
 * @returns Signal node
 */
export function createSignalNode(value: any): SignalNode {
  return {
    value,
    subs: null,
    subsTail: null,
    version: 0,
  };
}

/**
 * Reads signal value and tracks dependency
 *
 * @param node - Signal node to read
 * @returns Current signal value
 */
export function signalRead(node: SignalNode): any {
  if (trackingContext) {
    link(node, trackingContext);
  }
  return node.value;
}

/**
 * Writes new value to signal and propagates changes
 *
 * @param node - Signal node to write
 * @param value - New value
 */
export function signalWrite(node: SignalNode, value: any): void {
  if (fastEquals(node.value, value)) {
    return;
  }

  node.value = value;
  node.version = ++globalVersion;

  // Enter propagation (save state for nested calls)
  const wasActive = isPropagating;
  isPropagating = true;
  try {
    // Iterative deep propagation (no recursion!)
    propagateDeep(node.subs);
  } finally {
    // Exit propagation (restore state)
    isPropagating = wasActive;

    // Flush queued effects when back to top level
    if (!isPropagating && batchDepth === 0 && batchedEffects) {
      const effects = batchedEffects;
      batchedEffects = null;
      for (let i = 0; i < effects.length; i++) {
        const effect = effects[i];
        if (effect.flags & 0x1) {
          effectExecute(effect);
        }
      }
    }
  }
}

/**
 * Computed node - derived reactive value
 *
 * Caches computed results and tracks both dependencies and subscribers.
 * Uses lazy evaluation with memoization for optimal performance.
 *
 * @remarks
 * Flags: 0x1 = Dirty, 0x4 = Computing
 */
export type ComputedNode = {
  /** Computation function (also serves as type marker) */
  fn: () => any;
  /** Cached computed value */
  value: any;
  /** Head of dependency list */
  deps: Link | null;
  /** Tail of dependency list */
  depsTail: Link | null;
  /** Head of subscriber list */
  subs: Link | null;
  /** Tail of subscriber list */
  subsTail: Link | null;
  /** Version for change detection */
  version: number;
  /** State flags (dirty, computing) */
  flags: number;
  /** Last check cycle for memoization */
  lastCheckCycle: number;
};

export function createComputedNode(fn: () => any): ComputedNode {
  return {
    fn,
    value: undefined,
    deps: null,
    depsTail: null,
    subs: null,
    subsTail: null,
    version: 0,
    flags: 0x1, // Dirty flag
    lastCheckCycle: 0,
  };
}

export function computedRead(node: ComputedNode): any {
  // Fast path: clean node, no tracking
  if (!trackingContext && !(node.flags & 0x1)) {
    return node.value;
  }

  if (trackingContext) {
    link(node, trackingContext);
  }

  // If dirty, update iteratively to avoid stack overflow
  if (node.flags & 0x1) {
    computedUpdateIfNecessary(node);
  }

  return node.value;
}

/**
 * Check if computed needs updating (pre-allocated stack for hot path)
 */
type StackEntry = {
  node: ComputedNode;
  link: Link | null;
  checkedDep: boolean;
};
const checkStack: StackEntry[] = Array.from({ length: 32 }, () => ({
  node: null as any,
  link: null,
  checkedDep: false,
}));
let checkStackTop = 0;

export function computedUpdateIfNecessary(node: ComputedNode): void {
  // Fast path: no deps yet
  if (!node.deps) {
    if (node.flags & 0x1) {
      computedUpdate(node);
    }
    return;
  }

  // Fast path: single clean signal dep
  if (
    !node.deps.nextDep &&
    !('fn' in node.deps.dep!) &&
    node.deps.dep!.version === node.deps.version
  ) {
    node.flags &= ~0x1;
    return;
  }

  checkStackTop = 0;
  let current = node;
  let link: Link | null = node.deps;
  let checkedDep = false;

  outer: while (true) {
    // Already clean or computing
    if (!(current.flags & 0x1) || current.flags & 0x4) {
      if (checkStackTop === 0) return;
      const entry = checkStack[--checkStackTop];
      current = entry.node;
      link = entry.link;
      checkedDep = entry.checkedDep;
      continue;
    }

    // Skip if already checked this cycle
    if (current.lastCheckCycle === checkCycle) {
      if (checkStackTop === 0) return;
      const entry = checkStack[--checkStackTop];
      current = entry.node;
      link = entry.link;
      checkedDep = entry.checkedDep;
      continue;
    }
    current.lastCheckCycle = checkCycle;

    // Process dependencies
    while (link) {
      const dep = link.dep!;

      // Recursively check dirty computed deps
      if (!checkedDep && 'fn' in dep) {
        const compDep = dep as ComputedNode;
        if (
          compDep.flags & 0x1 &&
          compDep.lastCheckCycle !== checkCycle &&
          !(compDep.flags & 0x4)
        ) {
          // Push current state
          checkStack[checkStackTop].node = current;
          checkStack[checkStackTop].link = link;
          checkStack[checkStackTop].checkedDep = true;
          checkStackTop++;
          // Dive into dep
          current = compDep;
          link = compDep.deps;
          checkedDep = false;
          continue outer;
        }
      }

      // Check version
      if (dep.version !== link.version) {
        computedUpdate(current);
        if (checkStackTop === 0) return;
        const entry = checkStack[--checkStackTop];
        current = entry.node;
        link = entry.link;
        checkedDep = entry.checkedDep;
        continue outer;
      }

      link = link.nextDep!;
      checkedDep = false;
    }

    // All deps clean
    current.flags &= ~0x1;
    if (checkStackTop === 0) return;
    const entry = checkStack[--checkStackTop];
    current = entry.node;
    link = entry.link;
    checkedDep = entry.checkedDep;
  }
}

function computedNotify(node: ComputedNode): void {
  // Fast path: already dirty or currently computing
  if (node.flags & (0x1 | 0x4)) return;

  node.flags |= 0x1;

  // Iterative deep propagation (no recursion!)
  propagateDeep(node.subs);
}

export function computedUpdate(node: ComputedNode): void {
  checkCycle++;

  node.flags &= ~0x1; // Clear dirty
  node.flags |= 0x4; // Set computing flag

  const prevContext = trackingContext;

  // Reset depsTail to reuse links
  node.depsTail = null;
  trackingContext = node;

  try {
    const newValue = node.fn();

    if (!fastEquals(node.value, newValue)) {
      node.value = newValue;
      node.version = ++globalVersion;

      // Notify subscribers
      let subLink = node.subs;
      while (subLink) {
        notify(subLink.sub!);
        subLink = subLink.nextSub!;
      }
    }
    // Don't update version if value unchanged
  } finally {
    // Clean up unused deps after depsTail
    if (node.depsTail !== null) {
      // @ts-ignore
      let link = node.depsTail.nextDep;
      // @ts-ignore
      node.depsTail.nextDep = null;
      while (link) {
        const next = link.nextDep;
        removeLink(link);
        link = next;
      }
    } else if (node.deps !== null) {
      // All deps are unused, remove them all
      let link = node.deps;
      while (link) {
        const next = link.nextDep;
        removeLink(link);
        // @ts-ignore
        link = next;
      }
      node.deps = null;
    }

    node.flags &= ~0x4; // Clear computing flag
    trackingContext = prevContext;
  }
}

export function computedDispose(node: ComputedNode): void {
  let link = node.deps;
  while (link) {
    const next = link.nextDep!;
    removeLink(link);
    link = next;
  }
  node.deps = null;
}

// ============================================================================
// EFFECT NODE
// ============================================================================

/**
 * Effect node - side effect that runs when dependencies change
 *
 * Tracks dependencies and automatically re-executes when they update.
 * Effects are batched and scheduled for optimal performance.
 *
 * @remarks
 * Flags: 0x1 = Dirty, 0x2 = InBatch, 0x4 = Computing, 0x8 = Disposed
 */
export type EffectNode = {
  /** Effect function (also serves as type marker) */
  fn: () => void;
  /** State flags (dirty, batched, computing, disposed) */
  flags: number;
  /** Head of dependency list */
  deps: Link | null;
  /** Tail of dependency list */
  depsTail: Link | null;
};

export function createEffectNode(fn: () => void): EffectNode {
  return {
    fn,
    flags: 0,
    deps: null,
    depsTail: null,
  };
}

export function effectExecute(node: EffectNode): void {
  if (node.flags & 0x8) return;

  // Skip execution if no dependencies actually changed
  if (node.deps) {
    let link = node.deps;
    let hasChanges = false;

    while (link) {
      if (link.dep!.version !== link.version) {
        hasChanges = true;
        break;
      }
      link = link.nextDep!;
    }

    if (!hasChanges) {
      node.flags &= ~0x3;
      return;
    }
  }

  node.flags &= ~0x3;
  node.flags |= 0x4;

  const prevContext = trackingContext;

  node.depsTail = null;
  trackingContext = node;

  try {
    node.fn();
  } finally {
    // Clean up unused deps
    if (node.depsTail !== null) {
      // @ts-ignore
      let link = node.depsTail.nextDep;
      // @ts-ignore
      node.depsTail.nextDep = null;
      while (link) {
        const next = link.nextDep;
        removeLink(link);
        link = next;
      }
    } else if (node.deps !== null) {
      let link: Link | null = node.deps;
      while (link) {
        // @ts-ignore
        const next = link.nextDep;
        removeLink(link);
        link = next;
      }
      node.deps = null;
    }

    node.flags &= ~0x4;
    trackingContext = prevContext;
  }
}

export function effectNotify(node: EffectNode): void {
  if (node.flags & (0x8 | 0x4 | 0x1)) return; // Disposed | Currently tracking/executing | Already dirty

  node.flags |= 0x1; // Dirty

  if (batchDepth > 0 || isPropagating) {
    // Inside batch or propagation: queue for later
    node.flags |= 0x2; // InBatch
    if (!batchedEffects) {
      batchedEffects = [];
    }
    batchedEffects.push(node);
  } else {
    // Outside everything: execute immediately
    effectExecute(node);
  }
}

export function effectDispose(node: EffectNode): void {
  node.flags |= 0x8;
  let link = node.deps;
  while (link) {
    const next = link.nextDep!;
    removeLink(link);
    link = next;
  }
  node.deps = null;
}

// ============================================================================
// LINK MANAGEMENT & NOTIFICATIONS
// ============================================================================

/**
 * Deep propagation - mark all reachable computeds as dirty
 * Simple recursive approach - V8 inlines this well
 */
function propagateDeep(startLink: Link | null): void {
  let link = startLink;

  while (link) {
    const sub = link.sub!;
    const nextSibling = link.nextSub;

    const hasValue = 'value' in sub;

    if (hasValue) {
      const computed = sub as ComputedNode;
      const flags = computed.flags;

      if (!(flags & (0x1 | 0x4))) {
        computed.flags = flags | 0x1;

        // Recurse into subscribers
        if (computed.subs) {
          propagateDeep(computed.subs);
        }
      }
    } else {
      effectNotify(sub as EffectNode);
    }

    link = nextSibling;
  }
}

/**
 * Universal notify function for both computed and effect nodes
 * Detect type by checking for 'value' field (computed has it, effect doesn't)
 */
function notify(node: ComputedNode | EffectNode): void {
  if ('value' in node) {
    computedNotify(node as ComputedNode);
  } else {
    effectNotify(node as EffectNode);
  }
}

export function link(
  dep: SignalNode | ComputedNode,
  sub: ComputedNode | EffectNode,
): void {
  const version = dep.version;
  const prevDep = sub.depsTail;

  // Fast path: reuse link at tail
  if (prevDep !== null && prevDep.dep === dep) {
    if (prevDep.version === dep.version) {
      return;
    }
    prevDep.version = version;
    return;
  }

  // Check next dep from tail
  const nextDep = prevDep !== null ? prevDep.nextDep : sub.deps;
  if (nextDep !== null && nextDep.dep === dep) {
    nextDep.version = version;
    sub.depsTail = nextDep;
    return;
  }

  // Check if already linked at subsTail (less common)
  const prevSub = dep.subsTail;
  if (prevSub !== null && prevSub.sub === sub && prevSub.version === version) {
    return;
  }

  // Create new link
  const newLink =
    (sub.depsTail =
    dep.subsTail =
      {
        dep,
        sub,
        version,
        prevDep,
        nextDep,
        prevSub,
        nextSub: null,
      });

  // Link into dep's subs list
  if (prevSub) {
    prevSub.nextSub = newLink;
  } else {
    dep.subs = newLink;
  }

  // Link into sub's deps list
  if (prevDep) {
    prevDep.nextDep = newLink;
  } else {
    sub.deps = newLink;
  }

  // Update bidirectional pointers
  if (nextDep) {
    nextDep.prevDep = newLink;
  }
}

function removeLink(link: Link): void {
  const dep = link.dep!;
  const sub = link.sub!;

  // Remove from sub's deps list
  if (link.nextDep) {
    link.nextDep.prevDep = link.prevDep;
  } else {
    sub.depsTail = link.prevDep;
  }
  if (link.prevDep) {
    link.prevDep.nextDep = link.nextDep;
  } else {
    sub.deps = link.nextDep;
  }

  // Remove from dep's subs list
  if (link.nextSub) {
    link.nextSub.prevSub = link.prevSub;
  } else {
    dep.subsTail = link.prevSub;
  }
  if (link.prevSub) {
    link.prevSub.nextSub = link.nextSub;
  } else {
    dep.subs = link.nextSub;
  }

  // No pooling - let GC handle it (modern GCs are very efficient)
}

// ============================================================================
// BATCH SYSTEM
// ============================================================================

export function startBatch(): void {
  batchDepth++;
}

export function endBatch(): void {
  if (--batchDepth === 0 && batchedEffects) {
    const effects = batchedEffects;
    batchedEffects = null;

    for (let i = 0; i < effects.length; i++) {
      if (effects[i].flags & 0x1) {
        effectExecute(effects[i]);
      }
    }
  }
}
