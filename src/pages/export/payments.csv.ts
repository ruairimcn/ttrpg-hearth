import type { APIRoute } from 'astro';
import { toCsv } from '../../lib/csv';
import { centsToDecimal } from '../../lib/money';
import { paymentFilter, queryPayments } from '../../lib/ledgerQuery';

export const GET: APIRoute = async ({ url }) => {
  const f = paymentFilter(url.searchParams);
  const rows = await queryPayments(f);
  const body = toCsv(
    ['Date', 'Player', 'Campaign', 'Session', 'Amount', 'Currency', 'Method', 'Note'],
    [...rows].reverse().map((r) => [r.paid_on, r.player, r.campaign ?? '', r.session_number ?? '', centsToDecimal(r.amount_cents), r.currency, r.method, r.note]),
  );
  const name = `payments_${f.from || 'start'}_${f.to || 'now'}.csv`;
  return new Response(body, { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="${name}"` } });
};
