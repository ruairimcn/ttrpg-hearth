/** "12.50" / "12,5" / "€12" -> 1250. Returns null when not a valid non-negative amount. */
export function parseMoney(input: string): number | null {
  const s = input.trim().replace(/[€$£\s]/g, '').replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const [whole, frac = ''] = s.split('.');
  return Number(whole) * 100 + Number((frac + '00').slice(0, 2));
}

export function formatMoney(cents: number, currency = 'EUR'): string {
  const abs = Math.abs(cents);
  const str = new Intl.NumberFormat('en-IE', { style: 'currency', currency }).format(abs / 100);
  return cents < 0 ? `-${str}` : str;
}

/** 1250 -> "12.50" (plain decimal for inputs and CSV). */
export function centsToDecimal(cents: number): string {
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(cents);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, '0')}`;
}
