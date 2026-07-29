import { describe, expect, it, vi } from 'vitest';
import {
  loadThreshold,
  saveThreshold,
  validateThresholdInput,
} from '../src/lib/settings.js';

describe('settings', () => {
  it('validates a supported threshold', () => {
    expect(validateThresholdInput('1500')).toEqual({
      valid: true,
      message: '',
      value: 1500,
    });
  });

  it('rejects non-numeric and out-of-range input', () => {
    expect(validateThresholdInput('slow').valid).toBe(false);
    expect(validateThresholdInput(99).valid).toBe(false);
    expect(validateThresholdInput(60001).valid).toBe(false);
  });

  it('loads and normalizes a stored threshold', async () => {
    const chromeApi = {
      storage: {
        local: {
          get: vi.fn(async () => ({ slowResourceThresholdMs: 1300.7 })),
        },
      },
    };

    await expect(loadThreshold(chromeApi)).resolves.toBe(1301);
  });

  it('uses a safe default when Chrome storage is unavailable', async () => {
    await expect(loadThreshold({})).resolves.toBe(1000);
  });

  it('saves a validated threshold', async () => {
    const set = vi.fn(async () => undefined);
    const chromeApi = { storage: { local: { set } } };

    await expect(saveThreshold(2500, chromeApi)).resolves.toBe(2500);
    expect(set).toHaveBeenCalledWith({ slowResourceThresholdMs: 2500 });
  });

  it('rejects invalid values and unavailable storage', async () => {
    await expect(saveThreshold(20, {})).rejects.toThrow(RangeError);
    await expect(saveThreshold(2000, {})).rejects.toThrow(
      'storage API is unavailable',
    );
  });
});
