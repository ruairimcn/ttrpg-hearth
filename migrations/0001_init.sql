-- TTRPG Hearth schema. Money = integer cents. Dates = ISO 8601 strings.
PRAGMA foreign_keys = ON;

CREATE TABLE campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  system TEXT NOT NULL DEFAULT 'D&D 5e',
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','active','paused','finished')),
  description TEXT NOT NULL DEFAULT '',
  schedule_note TEXT NOT NULL DEFAULT '',
  is_paid INTEGER NOT NULL DEFAULT 0 CHECK (is_paid IN (0,1)),
  default_session_price_cents INTEGER NOT NULL DEFAULT 0 CHECK (default_session_price_cents >= 0),
  archived_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

CREATE TABLE players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  contact TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
  archived_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

CREATE TABLE characters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE RESTRICT,
  campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  class TEXT NOT NULL DEFAULT '',
  level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 0),
  dndbeyond_url TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','retired','dead')),
  notes TEXT NOT NULL DEFAULT '',
  archived_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);
CREATE INDEX idx_characters_player ON characters(player_id);
CREATE INDEX idx_characters_campaign ON characters(campaign_id);

CREATE TABLE sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE RESTRICT,
  number INTEGER NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  starts_at TEXT NOT NULL,           -- local wall time, ISO 8601 e.g. 2026-11-07T19:00
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','played','cancelled')),
  price_cents INTEGER NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
  prep_notes TEXT NOT NULL DEFAULT '',
  recap TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  UNIQUE (campaign_id, number)
);
CREATE INDEX idx_sessions_starts ON sessions(starts_at);

-- Per-session billing lives here: charge_cents is what the player owes for this session.
CREATE TABLE session_attendees (
  session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE RESTRICT,
  character_id INTEGER REFERENCES characters(id) ON DELETE SET NULL,
  attended INTEGER NOT NULL DEFAULT 0 CHECK (attended IN (0,1)),
  charge_cents INTEGER NOT NULL DEFAULT 0 CHECK (charge_cents >= 0),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  PRIMARY KEY (session_id, player_id)
);
CREATE INDEX idx_attendees_player ON session_attendees(player_id);

-- Money received. Never cascade-deleted: players cannot be hard-deleted while payments exist.
-- campaign_id is optional (prepayments / credit); it is set from the session when one is chosen.
CREATE TABLE payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE RESTRICT,
  campaign_id INTEGER REFERENCES campaigns(id) ON DELETE RESTRICT,
  session_id INTEGER REFERENCES sessions(id) ON DELETE SET NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  currency TEXT NOT NULL DEFAULT 'EUR',
  method TEXT NOT NULL DEFAULT 'cash' CHECK (method IN ('cash','bank','revolut','other')),
  paid_on TEXT NOT NULL,             -- ISO date YYYY-MM-DD
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);
CREATE INDEX idx_payments_player ON payments(player_id);
CREATE INDEX idx_payments_campaign ON payments(campaign_id);
CREATE INDEX idx_payments_paid_on ON payments(paid_on);
