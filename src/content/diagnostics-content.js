const COLLECTOR_KEY = 'browser-support-diagnostics-error-collector-v1';
const MAX_OBSERVED_ERRORS = 25;

export function collectPageDiagnostics(thresholdMs) {
  const collectorKey = Symbol.for('browser-support-diagnostics-error-collector-v1');
  const maxObservedErrors = 25;

  if (!globalThis[collectorKey]) {
    const state = { errors: [] };
    const rememberError = (error) => {
      state.errors.push(error);
      if (state.errors.length > maxObservedErrors) {
        state.errors.shift();
      }
    };

    globalThis.addEventListener('error', (event) => {
      if (typeof event.message !== 'string' || event.message.trim() === '') {
        return;
      }

      rememberError({
        message: event.message,
        source: event.filename || '',
        line: event.lineno || 0,
        column: event.colno || 0,
        observedAt: new Date().toISOString(),
      });
    });

    globalThis.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason;
      const message = reason instanceof Error
        ? reason.message
        : typeof reason === 'string'
          ? reason
          : 'Unhandled promise rejection';

      rememberError({
        message,
        source: '',
        line: 0,
        column: 0,
        observedAt: new Date().toISOString(),
      });
    });

    Object.defineProperty(globalThis, collectorKey, {
      value: state,
      configurable: false,
      enumerable: false,
      writable: false,
    });
  }

  const storageAvailable = (storageName) => {
    try {
      const storage = globalThis[storageName];
      const marker = `__browser_support_diagnostics_${Date.now()}__`;
      storage.setItem(marker, '');
      storage.removeItem(marker);
      return true;
    } catch {
      return false;
    }
  };

  const navigationEntry = globalThis.performance
    .getEntriesByType('navigation')
    .find((entry) => entry.entryType === 'navigation');
  const resources = globalThis.performance.getEntriesByType('resource');
  const threshold = Number.isFinite(Number(thresholdMs)) ? Number(thresholdMs) : 1000;
  const slowResources = resources
    .filter((resource) => resource.duration >= threshold)
    .map((resource) => ({
      url: resource.name,
      initiatorType: resource.initiatorType || 'other',
      durationMs: resource.duration,
      transferSizeBytes: resource.transferSize || 0,
    }))
    .sort((left, right) => right.durationMs - left.durationMs)
    .slice(0, 50);

  return {
    url: globalThis.location.href,
    title: globalThis.document.title,
    userAgent: globalThis.navigator.userAgent,
    language: globalThis.navigator.language,
    viewport: {
      width: globalThis.innerWidth,
      height: globalThis.innerHeight,
    },
    devicePixelRatio: globalThis.devicePixelRatio,
    online: globalThis.navigator.onLine,
    cookiesEnabled: globalThis.navigator.cookieEnabled,
    localStorageAvailable: storageAvailable('localStorage'),
    sessionStorageAvailable: storageAvailable('sessionStorage'),
    navigation: navigationEntry
      ? {
          type: navigationEntry.type,
          durationMs: navigationEntry.duration,
          responseStartMs: navigationEntry.responseStart,
          domContentLoadedMs: navigationEntry.domContentLoadedEventEnd,
          loadEventEndMs: navigationEntry.loadEventEnd,
          transferSizeBytes: navigationEntry.transferSize || 0,
        }
      : null,
    resourceCount: resources.length,
    slowResources,
    javaScriptErrors: [...globalThis[collectorKey].errors],
    protocol: globalThis.location.protocol.replace(':', ''),
    mixedContentRisk:
      globalThis.location.protocol === 'https:' &&
      resources.some((resource) => resource.name.startsWith('http:')),
  };
}

export function clearObservedErrors() {
  const collectorKey = Symbol.for('browser-support-diagnostics-error-collector-v1');

  if (globalThis[collectorKey]?.errors) {
    globalThis[collectorKey].errors.length = 0;
  }

  return true;
}

export const collectorMetadata = Object.freeze({
  key: COLLECTOR_KEY,
  maximumErrors: MAX_OBSERVED_ERRORS,
});
