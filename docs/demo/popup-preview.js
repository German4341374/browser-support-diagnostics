const previewDiagnostics = {
  url: 'https://portal.example.test/dashboard?token=preview-only&view=summary',
  title: 'Customer Support Portal',
  userAgent: 'ExampleBrowser/128.0 (Preview Environment)',
  language: 'en-US',
  viewport: { width: 1440, height: 900 },
  devicePixelRatio: 2,
  online: true,
  cookiesEnabled: true,
  localStorageAvailable: true,
  sessionStorageAvailable: true,
  navigation: {
    type: 'navigate',
    durationMs: 842,
    responseStartMs: 126,
    domContentLoadedMs: 604,
    loadEventEndMs: 842,
    transferSizeBytes: 42132,
  },
  resourceCount: 37,
  slowResources: [
    {
      url: 'https://cdn.example.test/application.js?api_key=preview',
      initiatorType: 'script',
      durationMs: 1284,
      transferSizeBytes: 78211,
    },
    {
      url: 'https://images.example.test/dashboard.webp',
      initiatorType: 'img',
      durationMs: 1107,
      transferSizeBytes: 104200,
    },
  ],
  javaScriptErrors: [],
  protocol: 'https',
  mixedContentRisk: false,
};

globalThis.chrome = {
  tabs: {
    query: async () => [{ id: 1, url: previewDiagnostics.url }],
  },
  scripting: {
    executeScript: async (injection) =>
      injection.args ? [{ result: previewDiagnostics }] : [{ result: true }],
  },
  storage: {
    local: {
      get: async (defaults) => defaults,
      set: async () => undefined,
    },
  },
};

await import('../../src/popup/popup.js');

if (document.readyState !== 'loading') {
  document.dispatchEvent(new Event('DOMContentLoaded'));
}
