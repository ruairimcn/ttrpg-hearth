import { all } from './db';

export interface PaymentFilter { player: number | null; campaign: number | null; from: string; to: string }

export function paymentFilter(p: URLSearchParams): PaymentFilter {
  const d = (k: string) => (/^\d{4}-\d{2}-\d{2}$/.test(p.get(k) ?? '') ? p.get(k)! : '');
  return { player: Number(p.get('player')) || null, campaign: Number(p.get('campaign')) || null, from: d('from'), to: d('to') };
}

export const queryPayments = (f: PaymentFilter) => all<any>(`
  SELECT y.*, p.name AS player, c.name AS campaign, s.number AS session_number
  FROM payments y JOIN players p ON p.id=y.player_id
  LEFT JOIN campaigns c ON c.id=y.campaign_id LEFT JOIN sessions s ON s.id=y.session_id
  WHERE (?1 IS NULL OR y.player_id=?1) AND (?2 IS NULL OR y.campaign_id=?2)
    AND (?3='' OR y.paid_on>=?3) AND (?4='' OR y.paid_on<=?4)
  ORDER BY y.paid_on DESC, y.id DESC`, f.player, f.campaign, f.from, f.to);
