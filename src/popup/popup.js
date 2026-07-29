import {
  clearActiveTabErrors,
  collectActiveTabDiagnostics,
} from '../lib/chrome-api.js';
import {
  createSummary,
  downloadText,
  exportJson,
  exportMarkdown,
} from '../lib/exporter.js';
import { buildReport } from '../lib/report-builder.js';
import { loadThreshold } from '../lib/settings.js';

let currentReport = null;
let slowResourceThresholdMs = 1000;

const elements = {
  report: document.querySelector('#report'),
  message: document.querySelector('#message'),
  badge: document.querySelector('#status-badge'),
  refresh: document.querySelector('#refresh'),
  exportJson: document.querySelector('#export-json'),
  exportMarkdown: document.querySelector('#export-markdown'),
  copySummary: document.querySelector('#copy-summary'),
  clearReport: document.querySelector('#clear-report'),
};

document.addEventListener('DOMContentLoaded', async () => {
  registerActions();
  slowResourceThresholdMs = await loadThreshold();
  await refreshReport();
});

function registerActions() {
  elements.refresh.addEventListener('click', refreshReport);
  elements.exportJson.addEventListener('click', () => {
    if (!currentReport) {
      return;
    }

    downloadText(
      reportFilename('json'),
      exportJson(currentReport),
      'application/json;charset=utf-8',
    );
    setMessage('JSON report exported.', 'success');
  });
  elements.exportMarkdown.addEventListener('click', () => {
    if (!currentReport) {
      return;
    }

    downloadText(
      reportFilename('md'),
      exportMarkdown(currentReport),
      'text/markdown;charset=utf-8',
    );
    setMessage('Markdown report exported.', 'success');
  });
  elements.copySummary.addEventListener('click', async () => {
    if (!currentReport) {
      return;
    }

    try {
      await navigator.clipboard.writeText(createSummary(currentReport));
      setMessage('Summary copied to the clipboard.', 'success');
    } catch {
      setMessage('The browser did not allow clipboard access.', 'error');
    }
  });
  elements.clearReport.addEventListener('click', clearReport);
}

async function refreshReport() {
  setLoading(true);
  hideMessage();

  try {
    slowResourceThresholdMs = await loadThreshold();
    const diagnostics = await collectActiveTabDiagnostics(slowResourceThresholdMs);
    currentReport = buildReport(diagnostics, slowResourceThresholdMs);
    renderReport(currentReport);
    setReadyState('Ready', 'ready');
  } catch (error) {
    currentReport = null;
    setReadyState('Unavailable', 'error');
    setMessage(
      error instanceof Error ? error.message : 'Unable to collect page diagnostics.',
      'error',
    );
  } finally {
    setLoading(false);
    updateActionState();
  }
}

async function clearReport() {
  try {
    await clearActiveTabErrors();
  } catch {
    // The visible report can still be cleared if the active tab became unavailable.
  }

  currentReport = null;
  elements.report.hidden = true;
  setReadyState('Cleared', 'ready');
  setMessage('The local report and observed error history were cleared.', 'success');
  updateActionState();
}

function renderReport(report) {
  elements.report.hidden = false;
  setText('#page-title', report.page.title);
  setText('#page-url', report.page.url || 'URL unavailable');
  setText('#protocol-pill', report.page.protocol.toUpperCase());
  setText(
    '#mixed-content-pill',
    `Mixed content: ${report.page.mixedContentRisk ? 'Risk detected' : 'Not detected'}`,
  );
  document
    .querySelector('#mixed-content-pill')
    .classList.toggle('pill--warning', report.page.mixedContentRisk);
  setText('#resource-count', report.performance.resourceCount);
  setText('#slow-count', report.performance.slowResources.length);
  setText('#error-count', report.javaScriptErrors.length);
  setText(
    '#load-duration',
    report.performance.navigation
      ? formatMilliseconds(report.performance.navigation.durationMs)
      : 'N/A',
  );
  setText('#browser-language', report.browser.language);
  setText(
    '#viewport',
    `${report.browser.viewport.width} × ${report.browser.viewport.height}`,
  );
  setText('#pixel-ratio', report.browser.devicePixelRatio);
  setText('#online', yesNo(report.browser.online));
  setText('#cookies-enabled', yesNo(report.browser.cookiesEnabled));
  setText('#local-storage', availability(report.storage.localStorageAvailable));
  setText('#session-storage', availability(report.storage.sessionStorageAvailable));
  setText('#user-agent', report.browser.userAgent);
  setText('#timestamp', new Date(report.generatedAt).toLocaleString());
  setText(
    '#threshold-label',
    `≥ ${report.performance.slowResourceThresholdMs} ms`,
  );

  renderNavigation(report.performance.navigation);
  renderSlowResources(report.performance.slowResources);
  renderErrors(report.javaScriptErrors);
}

function renderNavigation(navigation) {
  const container = document.querySelector('#navigation-details');
  container.replaceChildren();

  if (!navigation) {
    container.append(createEmptyState('Navigation timing is unavailable.'));
    return;
  }

  const values = [
    ['Type', navigation.type],
    ['Duration', formatMilliseconds(navigation.durationMs)],
    ['Response start', formatMilliseconds(navigation.responseStartMs)],
    ['DOM loaded', formatMilliseconds(navigation.domContentLoadedMs)],
    ['Load event end', formatMilliseconds(navigation.loadEventEndMs)],
    ['Transfer size', formatBytes(navigation.transferSizeBytes)],
  ];

  for (const [label, value] of values) {
    const wrapper = document.createElement('div');
    const term = document.createElement('dt');
    const description = document.createElement('dd');
    term.textContent = label;
    description.textContent = value;
    wrapper.append(term, description);
    container.append(wrapper);
  }
}

function renderSlowResources(resources) {
  const container = document.querySelector('#slow-resources');
  container.replaceChildren();

  if (resources.length === 0) {
    container.append(createEmptyState('No resources exceeded the threshold.'));
    return;
  }

  for (const resource of resources) {
    const item = document.createElement('article');
    const title = document.createElement('strong');
    const meta = document.createElement('span');
    item.className = 'item';
    title.textContent = resource.url || 'Unnamed resource';
    meta.textContent = `${resource.initiatorType} · ${formatMilliseconds(resource.durationMs)} · ${formatBytes(resource.transferSizeBytes)}`;
    item.append(title, meta);
    container.append(item);
  }
}

function renderErrors(errors) {
  const container = document.querySelector('#javascript-errors');
  container.replaceChildren();

  if (errors.length === 0) {
    container.append(createEmptyState('No JavaScript errors were observed.'));
    return;
  }

  for (const error of errors) {
    const item = document.createElement('article');
    const title = document.createElement('strong');
    const meta = document.createElement('span');
    item.className = 'item';
    title.textContent = error.message;
    meta.textContent = error.source
      ? `${error.source}:${error.line}:${error.column}`
      : 'Source unavailable';
    item.append(title, meta);
    container.append(item);
  }
}

function createEmptyState(message) {
  const element = document.createElement('p');
  element.className = 'empty-state';
  element.textContent = message;
  return element;
}

function setLoading(loading) {
  elements.report.setAttribute('aria-busy', String(loading));
  elements.refresh.disabled = loading;
  if (loading) {
    setReadyState('Collecting', 'loading');
  }
}

function setReadyState(label, state) {
  elements.badge.textContent = label;
  elements.badge.className = `status-badge status-badge--${state}`;
}

function updateActionState() {
  const disabled = currentReport === null;
  elements.exportJson.disabled = disabled;
  elements.exportMarkdown.disabled = disabled;
  elements.copySummary.disabled = disabled;
  elements.clearReport.disabled = disabled;
}

function setMessage(message, type) {
  elements.message.textContent = message;
  elements.message.dataset.type = type;
  elements.message.hidden = false;
}

function hideMessage() {
  elements.message.hidden = true;
  elements.message.textContent = '';
}

function setText(selector, value) {
  document.querySelector(selector).textContent = String(value);
}

function formatMilliseconds(value) {
  return `${Math.round(value)} ms`;
}

function formatBytes(value) {
  if (value < 1024) {
    return `${value} B`;
  }
  return `${(value / 1024).toFixed(1)} KB`;
}

function availability(value) {
  return value ? 'Available' : 'Unavailable';
}

function yesNo(value) {
  return value ? 'Yes' : 'No';
}

function reportFilename(extension) {
  const timestamp = new Date().toISOString().replace(/[:.]/gu, '-');
  return `browser-diagnostics-${timestamp}.${extension}`;
}
