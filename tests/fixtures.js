export function createRawDiagnostics(overrides = {}) {
  return {
    url: 'https://support.example.test/dashboard?token=private&view=summary',
    title: 'Support dashboard',
    userAgent: 'ExampleBrowser/1.0',
    language: 'en-US',
    viewport: { width: 1440, height: 900 },
    devicePixelRatio: 2,
    online: true,
    cookiesEnabled: true,
    localStorageAvailable: true,
    sessionStorageAvailable: true,
    navigation: {
      type: 'navigate',
      durationMs: 1240.456,
      responseStartMs: 184.4,
      domContentLoadedMs: 810.22,
      loadEventEndMs: 1240.456,
      transferSizeBytes: 2048,
    },
    resourceCount: 12,
    slowResources: [
      {
        url: 'https://cdn.example.test/app.js?api_key=sensitive',
        initiatorType: 'script',
        durationMs: 1350.126,
        transferSizeBytes: 51200,
      },
    ],
    javaScriptErrors: [
      {
        message: 'Example failure',
        source: 'https://cdn.example.test/app.js?secret=value',
        line: 42,
        column: 9,
        observedAt: '2026-07-29T10:00:00.000Z',
      },
    ],
    protocol: 'https',
    mixedContentRisk: false,
    ...overrides,
  };
}
