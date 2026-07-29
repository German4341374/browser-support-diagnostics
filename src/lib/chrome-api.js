import {
  clearObservedErrors,
  collectPageDiagnostics,
} from '../content/diagnostics-content.js';

const SUPPORTED_PROTOCOLS = new Set(['http:', 'https:']);

export async function getActiveTab(chromeApi = globalThis.chrome) {
  if (!chromeApi?.tabs?.query) {
    throw new Error('Chrome tabs API is unavailable.');
  }

  const tabs = await chromeApi.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];

  if (!tab || !Number.isInteger(tab.id)) {
    throw new Error('No active browser tab is available.');
  }

  if (!isSupportedPage(tab.url)) {
    throw new Error('Diagnostics are available only for HTTP and HTTPS pages.');
  }

  return tab;
}

export async function collectActiveTabDiagnostics(
  thresholdMs,
  chromeApi = globalThis.chrome,
) {
  if (!chromeApi?.scripting?.executeScript) {
    throw new Error('Chrome scripting API is unavailable.');
  }

  const tab = await getActiveTab(chromeApi);
  const results = await chromeApi.scripting.executeScript({
    target: { tabId: tab.id },
    world: 'MAIN',
    func: collectPageDiagnostics,
    args: [thresholdMs],
  });
  const diagnostics = results[0]?.result;

  if (!diagnostics || typeof diagnostics !== 'object') {
    throw new Error('The page did not return a diagnostic report.');
  }

  return diagnostics;
}

export async function clearActiveTabErrors(chromeApi = globalThis.chrome) {
  const tab = await getActiveTab(chromeApi);
  await chromeApi.scripting.executeScript({
    target: { tabId: tab.id },
    world: 'MAIN',
    func: clearObservedErrors,
  });
}

export function isSupportedPage(value) {
  try {
    return SUPPORTED_PROTOCOLS.has(new URL(value).protocol);
  } catch {
    return false;
  }
}
