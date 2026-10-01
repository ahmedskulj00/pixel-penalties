import { useSyncExternalStore } from 'react';

/**
 * Tiny external stores backed by localStorage. Reads are synchronous and
 * subscriptions are shared, so components re-render only when their store changes.
 * Storage can be unavailable (private mode, sandboxing), so every access is guarded.
 */
export interface Store<T> {
  get(): T;
  set(update: T | ((prev: T) => T)): void;
  subscribe(listener: () => void): () => void;
}

export function createStore<T>(key: string, fallback: T, parse: (raw: unknown) => T): Store<T> {
  const read = () => {
    try {
      const raw = globalThis.localStorage?.getItem(key);
      return raw ? parse(JSON.parse(raw)) : fallback;
    } catch {
      return fallback;
    }
  };
  let value = read();
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key !== key) return;
      value = read();
      emit();
    });
  }

  return {
    get: () => value,
    set(update) {
      const next = typeof update === 'function' ? (update as (prev: T) => T)(value) : update;
      if (Object.is(next, value)) return;
      value = next;
      try {
        if (next == null) globalThis.localStorage?.removeItem(key);
        else globalThis.localStorage?.setItem(key, JSON.stringify(next));
      } catch {
        /* storage full or blocked: keep the in-memory value */
      }
      emit();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

/** Subscribe a component to a store. */
export const useStore = <T>(store: Store<T>): T => useSyncExternalStore(store.subscribe, store.get, store.get);
