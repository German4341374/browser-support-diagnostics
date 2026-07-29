import { describe, expect, it, vi } from 'vitest';
import {
  clearActiveTabErrors,
  collectActiveTabDiagnostics,
  getActiveTab,
  isSupportedPage,
} from '../src/lib/chrome-api.js';
import { createRawDiagnostics } from './fixtures.js';

function createChromeMock(overrides = {}) {
  return {
    tabs: {
      query: vi.fn(async () => [
        { id: 7, url: 'https://example.test/support' },
      ]),
    },
    scripting: {
      executeScript: vi.fn(async () => [{ result: createRawDiagnostics() }]),
    },
    ...overrides,
  };
}

describe('Chrome API adapter', () => {
  it('returns the active HTTP tab', async () => {
    const chromeApi = createChromeMock();

    await expect(getActiveTab(chromeApi)).resolves.toMatchObject({ id: 7 });
    expect(chromeApi.tabs.query).toHaveBeenCalledWith({
      active: true,
      currentWindow: true,
    });
  });

  it('collects diagnostics in the page main world', async () => {
    const chromeApi = createChromeMock();

    const diagnostics = await collectActiveTabDiagnostics(1500, chromeApi);

    expect(diagnostics.title).toBe('Support dashboard');
    expect(chromeApi.scripting.executeScript).toHaveBeenCalledWith(
      expect.objectContaining({
        target: { tabId: 7 },
        world: 'MAIN',
        args: [1500],
        func: expect.any(Function),
      }),
    );
  });

  it('rejects pages Chrome does not allow extensions to inspect', async () => {
    const chromeApi = createChromeMock({
      tabs: {
        query: vi.fn(async () => [{ id: 2, url: 'chrome://settings/' }]),
      },
    });

    await expect(getActiveTab(chromeApi)).rejects.toThrow(
      'only for HTTP and HTTPS pages',
    );
  });

  it('reports a missing active tab', async () => {
    const chromeApi = createChromeMock({
      tabs: { query: vi.fn(async () => []) },
    });

    await expect(getActiveTab(chromeApi)).rejects.toThrow('No active browser tab');
  });

  it('reports unavailable Chrome APIs', async () => {
    await expect(getActiveTab({})).rejects.toThrow('tabs API is unavailable');
    await expect(collectActiveTabDiagnostics(1000, { tabs: {} })).rejects.toThrow(
      'scripting API is unavailable',
    );
  });

  it('rejects an empty script result', async () => {
    const chromeApi = createChromeMock({
      scripting: { executeScript: vi.fn(async () => []) },
    });

    await expect(collectActiveTabDiagnostics(1000, chromeApi)).rejects.toThrow(
      'did not return a diagnostic report',
    );
  });

  it('clears page error history through the same active tab permission', async () => {
    const chromeApi = createChromeMock();

    await clearActiveTabErrors(chromeApi);

    expect(chromeApi.scripting.executeScript).toHaveBeenCalledWith(
      expect.objectContaining({
        target: { tabId: 7 },
        world: 'MAIN',
        func: expect.any(Function),
      }),
    );
  });
});

describe('supported page detection', () => {
  it.each([
    ['https://example.test', true],
    ['http://localhost:3000', true],
    ['file:///tmp/report.html', false],
    ['chrome://extensions', false],
    ['not a URL', false],
  ])('returns %s => %s', (url, expected) => {
    expect(isSupportedPage(url)).toBe(expected);
  });
});
