import { REDACTED_VALUE } from './constants.js';

const SENSITIVE_QUERY_PARAMETER_NAMES = new Set([
  'key',
  'password',
  'secret',
  'token',
]);

export function isSensitiveQueryParameter(name) {
  const normalized = String(name).trim().toLowerCase().replace(/\[\]$/u, '');
  const segments = normalized.split(/[._-]/u);

  return segments.some((segment) => SENSITIVE_QUERY_PARAMETER_NAMES.has(segment));
}

export function maskUrl(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    return '';
  }

  try {
    const url = new URL(value);

    for (const [name] of url.searchParams) {
      if (isSensitiveQueryParameter(name)) {
        url.searchParams.set(name, REDACTED_VALUE);
      }
    }

    return url.toString();
  } catch {
    return maskQueryStringFallback(value);
  }
}

export function maskQueryStringFallback(value) {
  const [base, fragment = ''] = String(value).split('#', 2);
  const queryIndex = base.indexOf('?');

  if (queryIndex === -1) {
    return value;
  }

  const path = base.slice(0, queryIndex);
  const query = base.slice(queryIndex + 1);
  const maskedQuery = query
    .split('&')
    .map((pair) => {
      const separatorIndex = pair.indexOf('=');
      const rawName = separatorIndex === -1 ? pair : pair.slice(0, separatorIndex);
      const decodedName = safeDecodeURIComponent(rawName.replace(/\+/gu, ' '));

      if (!isSensitiveQueryParameter(decodedName)) {
        return pair;
      }

      return `${rawName}=${encodeURIComponent(REDACTED_VALUE)}`;
    })
    .join('&');

  return `${path}?${maskedQuery}${fragment === '' ? '' : `#${fragment}`}`;
}

function safeDecodeURIComponent(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
