import { db, all, first, str, int, oneOf, SESSION_STATUSES, NOW } from './db';
import { computeCharge, type SessionStatus } from './ledger';
import { parseMoney } from './money';

export interface SessionInput {
  campaign_id: number; title: string; starts_at: string; status: SessionStatus;
  price_cents: number; prep_notes: string; recap: string;
}

/** Parse + validate the session form. Returns an error string or the parsed input. */
export async function parseSessionForm(f: FormData, fallbackCampaign: number): Promise<{ error: string } | { input: SessionInput }> {
  const campaign_id = int(f, 'campaign_id', fallbackCampaign);
  const campaign = await first<any>('SELECT * FROM campaigns WHERE id=?', campaign_id);
  if (!campaign) return { error: 'Choose a campaign.' };
  const starts_at = str(f, 'starts_at');
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(starts_at)) return { error: 'Date and time are required.' };
  const priceRaw = str(f, 'price');
  const price = priceRaw === '' ? campaign.default_session_price_cents : parseMoney(priceRaw);
  if (price === null) return { error: 'Price must be like 15 or 15.50.' };
  return {
    input: {
      campaign_id, title: str(f, 'title'), starts_at: starts_at.slice(0, 16),
      status: oneOf(str(f, 'status'), SESSION_STATUSES, 'planned'),
      price_cents: price, prep_notes: str(f, 'prep_notes'), recap: str(f, 'recap'),
    },
  };
}

/** Upsert attendee rows for a session, recomputing every charge from the rules in ledger.ts. */
export async function saveAttendees(sessionId: number, input: SessionInput, f: FormData) {
  const campaign = await first<any>('SELECT is_paid FROM campaigns WHERE id=?', input.campaign_id);
  const existing = new Set((await all<any>('SELECT player_id FROM session_attendees WHERE session_id=?', sessionId)).map((r) => r.player_id));
  const stmts: D1PreparedStatement[] = [];
  for (const raw of f.getAll('pid')) {
    const pid = parseInt(String(raw), 10);
    if (!Number.isFinite(pid)) continue;
    const attended = f.get(`att_${pid}`) === '1';
    if (!attended && !existing.has(pid)) continue;
    const chr = parseInt(String(f.get(`chr_${pid}`) ?? ''), 10);
    const charge = computeCharge({ campaignIsPaid: !!campaign?.is_paid, sessionStatus: input.status, attended, priceCents: input.price_cents });
    stmts.push(db().prepare(
      `INSERT INTO session_attendees (session_id,player_id,character_id,attended,charge_cents) VALUES (?1,?2,?3,?4,?5)
       ON CONFLICT(session_id,player_id) DO UPDATE SET character_id=?3, attended=?4, charge_cents=?5, updated_at=${NOW}`,
    ).bind(sessionId, pid, Number.isFinite(chr) ? chr : null, attended ? 1 : 0, charge));
  }
  if (stmts.length) await db().batch(stmts);
}

/** Players to offer for a session: campaign party first, then everyone else active. */
export async function attendeeCandidates(campaignId: number, sessionId: number | null) {
  return all<any>(`
    SELECT p.id, p.name,
      (SELECT COUNT(*) FROM characters h WHERE h.player_id=p.id AND h.campaign_id=?1 AND h.archived_at IS NULL AND h.status='active') AS in_party,
      a.attended AS attended, a.character_id AS character_id
    FROM players p LEFT JOIN session_attendees a ON a.player_id=p.id AND a.session_id=?2
    WHERE p.archived_at IS NULL AND (p.active=1 OR a.player_id IS NOT NULL)
    ORDER BY in_party DESC, p.name`, campaignId, sessionId ?? -1);
}
