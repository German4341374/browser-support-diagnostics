import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createSummary,
  downloadText,
  exportJson,
  exportMarkdown,
} from '../src/lib/exporter.js';
import { buildReport } from '../src/lib/report-builder.js';
import { createRawDiagnostics } from './fixtures.js';

const report = buildReport(
  createRawDiagnostics(),
  1000,
  () => new Date('2026-07-29T12:00:00.000Z'),
);

afterEach(() => {
  vi.restoreAllMocks();
});

describe('report exporters', () => {
  it('exports valid pretty-printed JSON with a trailing newline', () => {
    const output = exportJson(report);

    expect(JSON.parse(output)).toEqual(report);
    expect(output.endsWith('\n')).toBe(true);
  });

  it('creates a Markdown report with required sections', () => {
    const output = exportMarkdown(report);

    expect(output).toContain('# Browser Support Diagnostic Report');
    expect(output).toContain('## Performance');
    expect(output).toContain('### Slow resources');
    expect(output).toContain('## Privacy');
  });

  it('renders slow resources as a Markdown table', () => {
    const output = exportMarkdown(report);

    expect(output).toContain('| Resource | Type | Duration | Transfer size |');
    expect(output).toContain('| script | 1350.13 ms | 51200 B |');
  });

  it('escapes pipes and line breaks in Markdown values', () => {
    const customReport = buildReport(
      createRawDiagnostics({
        slowResources: [
          {
            url: 'https://example.test/a|b',
            initiatorType: 'script\nmodule',
            durationMs: 1001,
          },
        ],
      }),
      1000,
    );

    expect(exportMarkdown(customReport)).toContain('a\\|b');
    expect(exportMarkdown(customReport)).toContain('script module');
  });

  it('documents empty resource and error collections', () => {
    const emptyReport = buildReport(
      createRawDiagnostics({ slowResources: [], javaScriptErrors: [] }),
      1000,
    );
    const output = exportMarkdown(emptyReport);

    expect(output).toContain('No resources exceeded the configured threshold.');
    expect(output).toContain('No JavaScript errors were observed.');
  });

  it('creates a compact copyable summary', () => {
    const summary = createSummary(report);

    expect(summary).toContain('Support dashboard');
    expect(summary).toContain('Resources: 12 (1 slow)');
    expect(summary).toContain('Observed JavaScript errors: 1');
  });

  it('downloads content through a temporary object URL', () => {
    const click = vi.fn();
    const remove = vi.fn();
    const append = vi.fn();
    const link = { click, remove, hidden: false, href: '', download: '' };
    const documentObject = {
      createElement: vi.fn(() => link),
      body: { append },
    };
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:report'),
      revokeObjectURL: vi.fn(),
    });

    downloadText('report.json', '{}', 'application/json', documentObject);

    expect(link.download).toBe('report.json');
    expect(link.href).toBe('blob:report');
    expect(append).toHaveBeenCalledWith(link);
    expect(click).toHaveBeenCalledOnce();
    expect(remove).toHaveBeenCalledOnce();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:report');
  });
});
