import type { APIRoute } from 'astro';
import { all } from '../../lib/db';
import { toCsv } from '../../lib/csv';
import { centsToDecimal } from '../../lib/money';

export const GET: APIRoute = async ({ url }) => {
  const d = (k: string) => (/^\d{4}-\d{2}-\d{2}$/.test(url.searchParams.get(k) ?? '') ? url.searchParams.get(k)! : '');
  const from = d('from'), to = d('to');
  const rows = await all<any>(`
    SELECT s.*, c.name AS campaign,
      (SELECT COUNT(*) FROM session_attendees a WHERE a.session_id=s.id AND a.attended=1) AS attendees,
      (SELECT COALESCE(SUM(charge_cents),0) FROM session_attendees a WHERE a.session_id=s.id) AS charged
    FROM sessions s JOIN campaigns c ON c.id=s.campaign_id
    WHERE (?1='' OR substr(s.starts_at,1,10)>=?1) AND (?2='' OR substr(s.starts_at,1,10)<=?2)
    ORDER BY s.starts_at`, from, to);
  const body = toCsv(
    ['Date', 'Time', 'Campaign', 'Number', 'Title', 'Status', 'Price per attendee', 'Attendees', 'Total charged'],
    rows.map((r) => [r.starts_at.slice(0, 10), r.starts_at.slice(11, 16), r.campaign, r.number, r.title, r.status, centsToDecimal(r.price_cents), r.attendees, centsToDecimal(r.charged)]),
  );
  return new Response(body, { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="sessions_${from || 'start'}_${d('to') || 'now'}.csv"` } });
};
