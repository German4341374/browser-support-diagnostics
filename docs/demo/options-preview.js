globalThis.chrome = {
  storage: {
    local: {
      get: async () => ({ slowResourceThresholdMs: 1000 }),
      set: async () => undefined,
    },
  },
};

await import('../../src/options/options.js');

if (document.readyState !== 'loading') {
  document.dispatchEvent(new Event('DOMContentLoaded'));
}
