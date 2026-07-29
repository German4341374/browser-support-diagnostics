export function exportJson(report) {
  return `${JSON.stringify(report, null, 2)}\n`;
}

export function exportMarkdown(report) {
  const navigation = report.performance.navigation;
  const lines = [
    '# Browser Support Diagnostic Report',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Page',
    '',
    `- URL: ${report.page.url || 'Unavailable'}`,
    `- Title: ${report.page.title}`,
    `- Protocol: ${report.page.protocol}`,
    `- Mixed content risk: ${yesNo(report.page.mixedContentRisk)}`,
    '',
    '## Browser and environment',
    '',
    `- User agent: ${report.browser.userAgent}`,
    `- Language: ${report.browser.language}`,
    `- Viewport: ${report.browser.viewport.width} × ${report.browser.viewport.height}`,
    `- Device pixel ratio: ${report.browser.devicePixelRatio}`,
    `- Online: ${yesNo(report.browser.online)}`,
    `- Cookies enabled: ${yesNo(report.browser.cookiesEnabled)}`,
    `- localStorage available: ${yesNo(report.storage.localStorageAvailable)}`,
    `- sessionStorage available: ${yesNo(report.storage.sessionStorageAvailable)}`,
    '',
    '## Performance',
    '',
    `- Resource count: ${report.performance.resourceCount}`,
    `- Slow resource threshold: ${report.performance.slowResourceThresholdMs} ms`,
  ];

  if (navigation) {
    lines.push(
      `- Navigation type: ${navigation.type}`,
      `- Navigation duration: ${navigation.durationMs} ms`,
      `- DOM content loaded: ${navigation.domContentLoadedMs} ms`,
      `- Load event end: ${navigation.loadEventEndMs} ms`,
    );
  } else {
    lines.push('- Navigation timing: unavailable');
  }

  lines.push('', '### Slow resources', '');

  if (report.performance.slowResources.length === 0) {
    lines.push('No resources exceeded the configured threshold.');
  } else {
    lines.push('| Resource | Type | Duration | Transfer size |', '| --- | --- | ---: | ---: |');
    for (const resource of report.performance.slowResources) {
      lines.push(
        `| ${escapeTableCell(resource.url)} | ${escapeTableCell(resource.initiatorType)} | ${resource.durationMs} ms | ${resource.transferSizeBytes} B |`,
      );
    }
  }

  lines.push('', '## JavaScript errors observed after collector activation', '');

  if (report.javaScriptErrors.length === 0) {
    lines.push('No JavaScript errors were observed.');
  } else {
    for (const error of report.javaScriptErrors) {
      const location = error.source
        ? `${error.source}:${error.line}:${error.column}`
        : 'Source unavailable';
      lines.push(`- ${escapeInline(error.message)} — ${escapeInline(location)}`);
    }
  }

  lines.push(
    '',
    '## Privacy',
    '',
    '- Sensitive query parameters were masked.',
    '- Cookie values, storage values, form contents, and passwords were not read.',
    '- No report data was sent to an external server.',
    '',
  );

  return lines.join('\n');
}

export function createSummary(report) {
  const slowCount = report.performance.slowResources.length;
  const errorCount = report.javaScriptErrors.length;
  const mixedContent = report.page.mixedContentRisk ? 'risk detected' : 'not detected';

  return [
    `Browser diagnostic report for ${report.page.title}`,
    `URL: ${report.page.url || 'Unavailable'}`,
    `Generated: ${report.generatedAt}`,
    `Viewport: ${report.browser.viewport.width}x${report.browser.viewport.height}`,
    `Resources: ${report.performance.resourceCount} (${slowCount} slow)`,
    `Observed JavaScript errors: ${errorCount}`,
    `Mixed content: ${mixedContent}`,
  ].join('\n');
}

export function downloadText(filename, content, mimeType, documentObject = document) {
  const blob = new Blob([content], { type: mimeType });
  const objectUrl = URL.createObjectURL(blob);
  const link = documentObject.createElement('a');

  link.href = objectUrl;
  link.download = filename;
  link.hidden = true;
  documentObject.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

function yesNo(value) {
  return value ? 'Yes' : 'No';
}

function escapeTableCell(value) {
  return String(value).replace(/\|/gu, '\\|').replace(/\r?\n/gu, ' ');
}

function escapeInline(value) {
  return String(value).replace(/\r?\n/gu, ' ');
}
