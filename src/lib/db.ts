import { env } from 'cloudflare:workers';

export const db = () => (env as unknown as { DB: D1Database }).DB;
export const tz = () => (env as unknown as { APP_TZ?: string }).APP_TZ || 'Europe/Dublin';

export async function all<T = Record<string, unknown>>(sql: string, ...args: unknown[]): Promise<T[]> {
  return (await db().prepare(sql).bind(...args).all<T>()).results;
}
export async function first<T = Record<string, unknown>>(sql: string, ...args: unknown[]): Promise<T | null> {
  return db().prepare(sql).bind(...args).first<T>();
}
export async function run(sql: string, ...args: unknown[]) {
  return db().prepare(sql).bind(...args).run();
}

export const NOW = "strftime('%Y-%m-%dT%H:%M:%SZ','now')";

/** Local wall-clock "now" as ISO (YYYY-MM-DDTHH:MM) and today's date, in APP_TZ. */
export function nowLocal(): { iso: string; date: string } {
  const p = new Intl.DateTimeFormat('sv-SE', {
    timeZone: tz(), year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date()); // "2026-11-02 19:16"
  const iso = p.replace(' ', 'T');
  return { iso, date: iso.slice(0, 10) };
}

export function fmtDateTime(iso: string): string {
  const [d, t = ''] = iso.split('T');
  const dt = new Date(d + 'T00:00:00Z');
  const day = dt.toLocaleDateString('en-IE', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  return t ? `${day}, ${t.slice(0, 5)}` : day;
}
export function fmtDate(iso: string): string {
  return fmtDateTime(iso.slice(0, 10));
}

export const CAMPAIGN_STATUSES = ['planned', 'active', 'paused', 'finished'] as const;
export const SESSION_STATUSES = ['planned', 'played', 'cancelled'] as const;
export const CHARACTER_STATUSES = ['active', 'retired', 'dead'] as const;
export const METHODS = ['cash', 'bank', 'revolut', 'other'] as const;

/** Total charged / paid / balance per player (optionally scoped to one campaign). */
export const BALANCE_SQL = `
  SELECT p.id, p.name,
    COALESCE((SELECT SUM(a.charge_cents) FROM session_attendees a JOIN sessions s ON s.id=a.session_id
              WHERE a.player_id=p.id AND (?1 IS NULL OR s.campaign_id=?1)),0) AS charged,
    COALESCE((SELECT SUM(y.amount_cents) FROM payments y
              WHERE y.player_id=p.id AND (?1 IS NULL OR y.campaign_id=?1)),0) AS paid
  FROM players p`;

export type Str = string;
export function str(f: FormData, k: string): string {
  return String(f.get(k) ?? '').trim();
}
export function int(f: FormData, k: string, dflt = 0): number {
  const n = parseInt(String(f.get(k) ?? ''), 10);
  return Number.isFinite(n) ? n : dflt;
}
export function oneOf<T extends string>(v: string, opts: readonly T[], dflt: T): T {
  return (opts as readonly string[]).includes(v) ? (v as T) : dflt;
}
export function safeUrl(u: string): string {
  if (!u) return '';
  try {
    const x = new URL(u);
    return x.protocol === 'https:' || x.protocol === 'http:' ? x.toString() : '';
  } catch {
    return '';
  }
}
