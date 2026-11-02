import { describe, expect, it } from 'vitest';
import { balance, computeCharge, describeBalance } from '../src/lib/ledger';
import { centsToDecimal, formatMoney, parseMoney } from '../src/lib/money';
import { toCsv } from '../src/lib/csv';

const base = { campaignIsPaid: true, sessionStatus: 'played' as const, attended: true, priceCents: 1500 };

describe('computeCharge', () => {
  it('charges attendees of played paid sessions', () => expect(computeCharge(base)).toBe(1500));
  it('does not charge absentees', () => expect(computeCharge({ ...base, attended: false })).toBe(0));
  it('does not charge planned or cancelled sessions', () => {
    expect(computeCharge({ ...base, sessionStatus: 'planned' })).toBe(0);
    expect(computeCharge({ ...base, sessionStatus: 'cancelled' })).toBe(0);
  });
  it('does not charge free campaigns', () => expect(computeCharge({ ...base, campaignIsPaid: false })).toBe(0));
  it('never goes negative', () => expect(computeCharge({ ...base, priceCents: -5 })).toBe(0));
});

describe('balance', () => {
  it('is charges minus payments', () => expect(balance([1500, 1500, 1500], [3000])).toBe(1500));
  it('handles exact payment', () => expect(balance([1500, 1500], [3000])).toBe(0));
  it('handles prepayment (credit before any charge)', () => expect(balance([], [5000])).toBe(-5000));
  it('handles overpayment', () => expect(balance([1500], [2000])).toBe(-500));
  it('prepayment is consumed by later charges', () => expect(balance([1500, 1500], [5000])).toBe(-2000));
  it('describes sign', () => {
    expect(describeBalance(1).kind).toBe('owes');
    expect(describeBalance(-1).kind).toBe('credit');
    expect(describeBalance(0).kind).toBe('settled');
  });
});

describe('money', () => {
  it('parses amounts to cents without float error', () => {
    expect(parseMoney('15')).toBe(1500);
    expect(parseMoney('12.5')).toBe(1250);
    expect(parseMoney('12,50')).toBe(1250);
    expect(parseMoney('€0.07')).toBe(7);
    expect(parseMoney('19.99')).toBe(1999);
    expect(parseMoney('1.234')).toBeNull();
    expect(parseMoney('-3')).toBeNull();
    expect(parseMoney('abc')).toBeNull();
  });
  it('formats', () => {
    expect(centsToDecimal(1250)).toBe('12.50');
    expect(centsToDecimal(-5)).toBe('-0.05');
    expect(formatMoney(-2000)).toContain('20.00');
  });
});

describe('csv', () => {
  it('quotes, escapes and guards formulas', () => {
    const out = toCsv(['a', 'b'], [['x,y', 'say "hi"'], ['=1+1', 5]]);
    expect(out).toContain('"x,y","say ""hi"""');
    expect(out).toContain("'=1+1,5");
    expect(out.startsWith('﻿')).toBe(true);
  });
});
