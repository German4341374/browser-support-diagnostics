import { describe, expect, it } from 'vitest';
import {
  isSensitiveQueryParameter,
  maskQueryStringFallback,
  maskUrl,
} from '../src/lib/masking.js';

describe('URL masking', () => {
  it.each(['token', 'TOKEN', 'api_key', 'user-password', 'client.secret'])(
    'recognizes sensitive parameter %s',
    (name) => {
      expect(isSensitiveQueryParameter(name)).toBe(true);
    },
  );

  it('does not mask ordinary query parameters', () => {
    expect(isSensitiveQueryParameter('page')).toBe(false);
    expect(isSensitiveQueryParameter('monkey')).toBe(false);
  });

  it('masks every required sensitive parameter', () => {
    const masked = maskUrl(
      'https://example.test/path?token=a&key=b&password=c&secret=d&view=full',
    );
    const url = new URL(masked);

    expect(url.searchParams.get('token')).toBe('[REDACTED]');
    expect(url.searchParams.get('key')).toBe('[REDACTED]');
    expect(url.searchParams.get('password')).toBe('[REDACTED]');
    expect(url.searchParams.get('secret')).toBe('[REDACTED]');
    expect(url.searchParams.get('view')).toBe('full');
  });

  it('masks case-insensitive and compound names', () => {
    const masked = maskUrl(
      'https://example.test/?access_TOKEN=a&api-key=b&Client.Secret=c',
    );

    expect(masked).not.toContain('=a');
    expect(masked).not.toContain('=b');
    expect(masked).not.toContain('=c');
  });

  it('preserves fragments', () => {
    expect(maskUrl('https://example.test/?token=value#section')).toContain(
      '#section',
    );
  });

  it('returns an empty string for invalid empty input', () => {
    expect(maskUrl('')).toBe('');
    expect(maskUrl(null)).toBe('');
  });

  it('uses a safe fallback for malformed absolute URLs', () => {
    const masked = maskQueryStringFallback('/page?token=value&mode=compact');

    expect(masked).toContain('token=%5BREDACTED%5D');
    expect(masked).toContain('mode=compact');
  });

  it('survives malformed percent encoding', () => {
    expect(() => maskUrl('/page?token%ZZ=value')).not.toThrow();
  });
});
