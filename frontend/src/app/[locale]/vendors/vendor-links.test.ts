import { describe, it, expect, vi } from 'vitest';
import { prepareVCardUrl } from './vendor-links';

describe('prepareVCardUrl', () => {
  it('refreshes the session through an authenticated call, then returns the vCard URL', async () => {
    const fetchJson = vi.fn().mockResolvedValue({});
    const url = await prepareVCardUrl(fetchJson, 'en', 'cer 1', 'v/1');
    expect(fetchJson).toHaveBeenCalledWith('/api/vendors?locale=en&ceremonyId=cer%201');
    expect(url).toBe('/api/vendors/v%2F1/vcard?locale=en');
  });

  it('does not return a URL when the session check fails', async () => {
    const fetchJson = vi.fn().mockRejectedValue(new Error('TIER_REQUIRED'));
    await expect(prepareVCardUrl(fetchJson, 'fr', 'cer1', 'v1')).rejects.toThrow('TIER_REQUIRED');
  });
});
