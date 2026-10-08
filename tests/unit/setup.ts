import '@testing-library/jest-dom/vitest';

// Node 25+ ships its own `localStorage` global, which can shadow jsdom's and is
// unusable without a backing file. Install a plain in-memory Storage when the
// one on `window` doesn't work, so tests behave the same on every Node version.
if (typeof window.localStorage?.getItem !== 'function') {
  const data = new Map<string, string>();
  const memoryStorage: Storage = {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => Array.from(data.keys())[index] ?? null,
    removeItem: (key) => {
      data.delete(key);
    },
    setItem: (key, value) => {
      data.set(key, String(value));
    },
  };
  Object.defineProperty(window, 'localStorage', { value: memoryStorage, configurable: true });
}
