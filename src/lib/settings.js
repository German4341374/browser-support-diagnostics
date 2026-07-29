import {
  DEFAULT_SLOW_RESOURCE_THRESHOLD_MS,
  MAX_SLOW_RESOURCE_THRESHOLD_MS,
  MIN_SLOW_RESOURCE_THRESHOLD_MS,
} from './constants.js';
import { normalizeThreshold } from './report-builder.js';

export const SETTINGS_KEY = 'slowResourceThresholdMs';

export function validateThresholdInput(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return {
      valid: false,
      message: 'Enter a numeric threshold.',
      value: DEFAULT_SLOW_RESOURCE_THRESHOLD_MS,
    };
  }

  if (
    numericValue < MIN_SLOW_RESOURCE_THRESHOLD_MS ||
    numericValue > MAX_SLOW_RESOURCE_THRESHOLD_MS
  ) {
    return {
      valid: false,
      message: `Use a value between ${MIN_SLOW_RESOURCE_THRESHOLD_MS} and ${MAX_SLOW_RESOURCE_THRESHOLD_MS} milliseconds.`,
      value: normalizeThreshold(numericValue),
    };
  }

  return {
    valid: true,
    message: '',
    value: normalizeThreshold(numericValue),
  };
}

export async function loadThreshold(chromeApi = globalThis.chrome) {
  if (!chromeApi?.storage?.local?.get) {
    return DEFAULT_SLOW_RESOURCE_THRESHOLD_MS;
  }

  const stored = await chromeApi.storage.local.get({
    [SETTINGS_KEY]: DEFAULT_SLOW_RESOURCE_THRESHOLD_MS,
  });

  return normalizeThreshold(stored[SETTINGS_KEY]);
}

export async function saveThreshold(value, chromeApi = globalThis.chrome) {
  const validation = validateThresholdInput(value);

  if (!validation.valid) {
    throw new RangeError(validation.message);
  }

  if (!chromeApi?.storage?.local?.set) {
    throw new Error('Chrome storage API is unavailable.');
  }

  await chromeApi.storage.local.set({ [SETTINGS_KEY]: validation.value });
  return validation.value;
}
