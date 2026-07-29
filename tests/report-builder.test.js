import { describe, expect, it } from 'vitest';
import {
  buildReport,
  normalizeThreshold,
} from '../src/lib/report-builder.js';
import { createRawDiagnostics } from './fixtures.js';

describe('report builder', () => {
  it('formats a complete report', () => {
    const report = buildReport(
      createRawDiagnostics(),
      1200,
      () => new Date('2026-07-29T12:00:00.000Z'),
    );

    expect(report.reportVersion).toBe('1.0');
    expect(report.generatedAt).toBe('2026-07-29T12:00:00.000Z');
    expect(report.page.title).toBe('Support dashboard');
    expect(report.performance.slowResourceThresholdMs).toBe(1200);
    expect(report.performance.navigation.durationMs).toBe(1240.46);
  });

  it('masks sensitive page, resource, and error URLs', () => {
    const report = buildReport(createRawDiagnostics(), 1000);
    const exportedUrls = [
      report.page.url,
      report.performance.slowResources[0].url,
      report.javaScriptErrors[0].source,
    ].join('\n');

    expect(exportedUrls).not.toContain('private');
    expect(exportedUrls).not.toContain('sensitive');
    expect(exportedUrls).not.toContain('secret=value');
    expect(exportedUrls).toContain('%5BREDACTED%5D');
  });

  it('declares the privacy properties in the report', () => {
    const report = buildReport(createRawDiagnostics(), 1000);

    expect(report.privacy).toEqual({
      sensitiveQueryParametersMasked: true,
      cookiesRead: false,
      storageValuesRead: false,
      formContentsRead: false,
      externalRequestsSent: false,
    });
  });

  it('handles absent optional arrays and navigation data', () => {
    const report = buildReport(
      createRawDiagnostics({
        navigation: null,
        slowResources: null,
        javaScriptErrors: undefined,
      }),
      1000,
    );

    expect(report.performance.navigation).toBeNull();
    expect(report.performance.slowResources).toEqual([]);
    expect(report.javaScriptErrors).toEqual([]);
  });

  it('normalizes malformed numeric values safely', () => {
    const report = buildReport(
      createRawDiagnostics({
        viewport: { width: -1, height: 'bad' },
        resourceCount: -4,
        devicePixelRatio: Number.NaN,
      }),
      1000,
    );

    expect(report.browser.viewport).toEqual({ width: 0, height: 0 });
    expect(report.performance.resourceCount).toBe(0);
    expect(report.browser.devicePixelRatio).toBe(1);
  });

  it('normalizes invalid error dates to null', () => {
    const report = buildReport(
      createRawDiagnostics({
        javaScriptErrors: [{ message: '', observedAt: 'not-a-date' }],
      }),
      1000,
    );

    expect(report.javaScriptErrors[0].message).toBe('Unknown JavaScript error');
    expect(report.javaScriptErrors[0].observedAt).toBeNull();
  });

  it('rejects missing diagnostics', () => {
    expect(() => buildReport(null, 1000)).toThrow(TypeError);
  });
});

describe('threshold normalization', () => {
  it('uses the default for non-numeric input', () => {
    expect(normalizeThreshold('not-a-number')).toBe(1000);
  });

  it('clamps values to the supported range', () => {
    expect(normalizeThreshold(20)).toBe(100);
    expect(normalizeThreshold(100000)).toBe(60000);
  });

  it('rounds fractional milliseconds', () => {
    expect(normalizeThreshold(1450.6)).toBe(1451);
  });
});
