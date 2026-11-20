import { describe, it, expect } from 'vitest';
import { budgetQuery, parseAmountInput, prepareExportUrl } from './budget-types';

describe('parseAmountInput', () => {
  it.each([
    ['250000', 250000],
    ['250 000', 250000],
    ['250.000', 250000],
    ['1,500', 1500],
    ['1 500,50', 1500.5],
    ['1.234,56', 1234.56],
    ['1,234.56', 1234.56],
    ['1.500.000', 1500000],
    ['11,99', 11.99],
    ['11.99', 11.99],
    ['1,5', 1.5],
    ['0', 0],
  ])('reads %s as %s', (raw, expected) => {
    expect(parseAmountInput(raw)).toBe(expected);
  });

  it.each(['', 'abc', '1,2,3', '1.234.56', '0,125', '12,3456', '1,234,5'])(
    'rejects the ambiguous or invalid %s',
    (raw) => {
      expect(parseAmountInput(raw)).toBeNaN();
    },
  );
});

describe('budgetQuery', () => {
  it('builds the query with locale only', () => {
    expect(budgetQuery('en', null)).toBe('?locale=en');
  });

  it('adds an encoded ceremonyId when one is selected', () => {
    expect(budgetQuery('fr', 'c 1')).toBe('?locale=fr&ceremonyId=c%201');
  });
});

describe('prepareExportUrl', () => {
  it('calls the API first (so an expired session refreshes) then returns the export URL', async () => {
    const calls: string[] = [];
    const url = await prepareExportUrl(
      async (path) => {
        calls.push(path);
      },
      'fr',
      'cer1',
    );
    expect(calls).toEqual(['/api/budget?locale=fr&ceremonyId=cer1']);
    expect(url).toBe('/api/budget/export?locale=fr&ceremonyId=cer1');
  });

  it('propagates the API error instead of navigating', async () => {
    await expect(
      prepareExportUrl(
        async () => {
          throw new Error('TIER_REQUIRED');
        },
        'en',
        'cer1',
      ),
    ).rejects.toThrow('TIER_REQUIRED');
  });
});
