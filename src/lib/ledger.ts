// Money logic. Everything is integer cents. Kept pure so it can be unit-tested.

export type SessionStatus = 'planned' | 'played' | 'cancelled';

/**
 * A charge exists only for an attendee who attended a PLAYED session of a PAID campaign.
 * Planned and cancelled sessions never create charges.
 */
export function computeCharge(opts: {
  campaignIsPaid: boolean;
  sessionStatus: SessionStatus;
  attended: boolean;
  priceCents: number;
}): number {
  if (!opts.campaignIsPaid) return 0;
  if (opts.sessionStatus !== 'played') return 0;
  if (!opts.attended) return 0;
  return Math.max(0, Math.round(opts.priceCents));
}

/** Balance = charges - payments. Positive: player owes. Negative: player is in credit. */
export function balance(chargesCents: number[], paymentsCents: number[]): number {
  const sum = (a: number[]) => a.reduce((t, n) => t + n, 0);
  return sum(chargesCents) - sum(paymentsCents);
}

export function describeBalance(cents: number): { label: string; kind: 'owes' | 'credit' | 'settled' } {
  if (cents > 0) return { label: 'owes', kind: 'owes' };
  if (cents < 0) return { label: 'credit', kind: 'credit' };
  return { label: 'settled', kind: 'settled' };
}
