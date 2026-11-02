import { first, str, int, oneOf, METHODS } from './db';
import { parseMoney } from './money';

export async function parsePaymentForm(f: FormData) {
  const amount = parseMoney(str(f, 'amount'));
  if (!amount || amount <= 0) return { error: 'Amount must be more than 0, like 15 or 15.50.' } as const;
  const player_id = int(f, 'player_id');
  if (!(await first('SELECT 1 FROM players WHERE id=?', player_id))) return { error: 'Choose a player.' } as const;
  const paid_on = str(f, 'paid_on');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(paid_on)) return { error: 'Date is required.' } as const;
  // A session decides the campaign; otherwise use the optional chosen campaign.
  const sid = int(f, 'session_id', 0) || null;
  let campaign_id: number | null = int(f, 'campaign_id', 0) || null;
  let session_id: number | null = null;
  if (sid) {
    const s = await first<any>('SELECT id, campaign_id FROM sessions WHERE id=?', sid);
    if (s) { session_id = s.id; campaign_id = s.campaign_id; }
  }
  return {
    input: { player_id, campaign_id, session_id, amount_cents: amount, method: oneOf(str(f, 'method'), METHODS, 'cash'), paid_on, note: str(f, 'note') },
  } as const;
}
