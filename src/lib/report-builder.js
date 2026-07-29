import {
  DEFAULT_SLOW_RESOURCE_THRESHOLD_MS,
  MAX_SLOW_RESOURCE_THRESHOLD_MS,
  MIN_SLOW_RESOURCE_THRESHOLD_MS,
  REPORT_VERSION,
} from './constants.js';
import { maskUrl } from './masking.js';

export function normalizeThreshold(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return DEFAULT_SLOW_RESOURCE_THRESHOLD_MS;
  }

  return Math.min(
    MAX_SLOW_RESOURCE_THRESHOLD_MS,
    Math.max(MIN_SLOW_RESOURCE_THRESHOLD_MS, Math.round(numericValue)),
  );
}

export function buildReport(rawDiagnostics, threshold, now = () => new Date()) {
  if (!rawDiagnostics || typeof rawDiagnostics !== 'object') {
    throw new TypeError('Page diagnostics must be an object.');
  }

  const slowResourceThresholdMs = normalizeThreshold(threshold);
  const slowResources = Array.isArray(rawDiagnostics.slowResources)
    ? rawDiagnostics.slowResources.map(formatResource)
    : [];
  const javaScriptErrors = Array.isArray(rawDiagnostics.javaScriptErrors)
    ? rawDiagnostics.javaScriptErrors.map(formatError)
    : [];

  return {
    reportVersion: REPORT_VERSION,
    generatedAt: now().toISOString(),
    page: {
      url: maskUrl(asText(rawDiagnostics.url)),
      title: asText(rawDiagnostics.title, 'Untitled page'),
      protocol: asText(rawDiagnostics.protocol, 'unknown'),
      mixedContentRisk: Boolean(rawDiagnostics.mixedContentRisk),
    },
    browser: {
      userAgent: asText(rawDiagnostics.userAgent, 'Unknown'),
      language: asText(rawDiagnostics.language, 'Unknown'),
      viewport: {
        width: asNonNegativeInteger(rawDiagnostics.viewport?.width),
        height: asNonNegativeInteger(rawDiagnostics.viewport?.height),
      },
      devicePixelRatio: asNonNegativeNumber(rawDiagnostics.devicePixelRatio, 1),
      online: Boolean(rawDiagnostics.online),
      cookiesEnabled: Boolean(rawDiagnostics.cookiesEnabled),
    },
    storage: {
      localStorageAvailable: Boolean(rawDiagnostics.localStorageAvailable),
      sessionStorageAvailable: Boolean(rawDiagnostics.sessionStorageAvailable),
    },
    performance: {
      navigation: formatNavigation(rawDiagnostics.navigation),
      resourceCount: asNonNegativeInteger(rawDiagnostics.resourceCount),
      slowResourceThresholdMs,
      slowResources,
    },
    javaScriptErrors,
    privacy: {
      sensitiveQueryParametersMasked: true,
      cookiesRead: false,
      storageValuesRead: false,
      formContentsRead: false,
      externalRequestsSent: false,
    },
  };
}

function formatResource(resource) {
  return {
    url: maskUrl(asText(resource?.url)),
    initiatorType: asText(resource?.initiatorType, 'other'),
    durationMs: round(asNonNegativeNumber(resource?.durationMs)),
    transferSizeBytes: asNonNegativeInteger(resource?.transferSizeBytes),
  };
}

function formatError(error) {
  return {
    message: asText(error?.message, 'Unknown JavaScript error').slice(0, 300),
    source: maskUrl(asText(error?.source)),
    line: asNonNegativeInteger(error?.line),
    column: asNonNegativeInteger(error?.column),
    observedAt: validIsoDate(error?.observedAt),
  };
}

function formatNavigation(navigation) {
  if (!navigation || typeof navigation !== 'object') {
    return null;
  }

  return {
    type: asText(navigation.type, 'unknown'),
    durationMs: round(asNonNegativeNumber(navigation.durationMs)),
    responseStartMs: round(asNonNegativeNumber(navigation.responseStartMs)),
    domContentLoadedMs: round(asNonNegativeNumber(navigation.domContentLoadedMs)),
    loadEventEndMs: round(asNonNegativeNumber(navigation.loadEventEndMs)),
    transferSizeBytes: asNonNegativeInteger(navigation.transferSizeBytes),
  };
}

function asText(value, fallback = '') {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : fallback;
}

function asNonNegativeNumber(value, fallback = 0) {
  const numericValue = Number(value);

  return Number.isFinite(numericValue) && numericValue >= 0 ? numericValue : fallback;
}

function asNonNegativeInteger(value) {
  return Math.round(asNonNegativeNumber(value));
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function validIsoDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
