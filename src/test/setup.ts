import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// This jsdom build exposes `localStorage` only when Node is started with --localstorage-file,
// so under vitest it can be undefined. i18next's language detector and the language switch
// persist to it, so provide a minimal in-memory implementation when it's missing.
if (typeof window !== 'undefined' && !window.localStorage) {
  const createMemoryStorage = (): Storage => {
    const store = new Map<string, string>();
    return {
      get length() {
        return store.size;
      },
      clear: () => store.clear(),
      getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
      key: (index: number) => Array.from(store.keys())[index] ?? null,
      removeItem: (key: string) => void store.delete(key),
      setItem: (key: string, value: string) => void store.set(key, String(value)),
    };
  };
  Object.defineProperty(window, 'localStorage', {
    value: createMemoryStorage(),
    configurable: true,
  });
}

// jsdom doesn't implement ResizeObserver; Chakra/zag-js controls with a moving indicator
// (SegmentGroup, Tabs…) observe their size on mount. A no-op stub is enough for unit tests.
if (!('ResizeObserver' in globalThis)) {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
}

// jsdom doesn't implement matchMedia; some Chakra components read it on mount.
if (!window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

afterEach(() => {
  cleanup();
  // Display-unit preferences persist to localStorage; clear them so a choice in one test can't
  // leak into the next (the in-memory storage above is shared across the file).
  globalThis.localStorage?.removeItem('amq.unit-prefs');
});
