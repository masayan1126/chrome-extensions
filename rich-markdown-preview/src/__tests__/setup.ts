import '@testing-library/jest-dom';

// Mock Chrome Storage API
const storage: Record<string, unknown> = {};
const chromeStorageMock = {
  local: {
    get: vi.fn((keys: string | string[] | null) => {
      if (keys === null) return Promise.resolve(storage);
      if (typeof keys === 'string') return Promise.resolve({ [keys]: storage[keys] });
      const result: Record<string, unknown> = {};
      (keys as string[]).forEach(k => { if (storage[k] !== undefined) result[k] = storage[k]; });
      return Promise.resolve(result);
    }),
    set: vi.fn((items: Record<string, unknown>) => {
      Object.assign(storage, items);
      return Promise.resolve();
    }),
    remove: vi.fn((keys: string | string[]) => {
      const keyArr = typeof keys === 'string' ? [keys] : keys;
      keyArr.forEach(k => delete storage[k]);
      return Promise.resolve();
    }),
  },
};

Object.defineProperty(globalThis, 'chrome', {
  value: { storage: chromeStorageMock },
  writable: true,
});

// Mock CSS.escape
if (typeof CSS === 'undefined' || !CSS.escape) {
  Object.defineProperty(globalThis, 'CSS', {
    value: {
      escape: (str: string) => str.replace(/([^\w-])/g, '\\$1'),
    },
    writable: true,
  });
}

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn(() => Promise.resolve()),
    write: vi.fn(() => Promise.resolve()),
  },
  writable: true,
});

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

// Mock mermaid
vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    run: vi.fn(() => Promise.resolve()),
  },
}));
