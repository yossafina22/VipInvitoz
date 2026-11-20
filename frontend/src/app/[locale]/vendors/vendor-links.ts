import { budgetQuery } from '../budget/budget-types';

// The vCard is opened by a plain navigation, which bypasses api()'s token
// refresh: an authenticated JSON call first refreshes an expired session.
export async function prepareVCardUrl(
  fetchJson: (path: string) => Promise<unknown>,
  locale: string,
  ceremonyId: string,
  vendorId: string,
): Promise<string> {
  await fetchJson(`/api/vendors${budgetQuery(locale, ceremonyId)}`);
  return `/api/vendors/${encodeURIComponent(vendorId)}/vcard?locale=${encodeURIComponent(locale)}`;
}
