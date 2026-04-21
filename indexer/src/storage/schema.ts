/**
 * SQLite schema for the Celebrations indexer.
 * Run createSchema(db) once at startup to ensure tables exist.
 */
import type Database from "better-sqlite3";

export function createSchema(db: Database.Database): void {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    -- ── Badges ──────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS badges (
      token_id          TEXT PRIMARY KEY,
      owner             TEXT NOT NULL,
      celebration_type  INTEGER NOT NULL,
      year              INTEGER NOT NULL,
      soulbound         INTEGER NOT NULL DEFAULT 0,
      ipfs_url          TEXT,
      content_hash      TEXT,
      block_number      INTEGER NOT NULL,
      tx_hash           TEXT NOT NULL,
      indexed_at        INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE INDEX IF NOT EXISTS idx_badges_owner ON badges(owner);
    CREATE INDEX IF NOT EXISTS idx_badges_type  ON badges(celebration_type);

    -- ── Greeting Cards ───────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS greeting_cards (
      token_id          TEXT PRIMARY KEY,
      sender            TEXT NOT NULL,
      recipient         TEXT NOT NULL,
      celebration_type  INTEGER NOT NULL,
      ipfs_url          TEXT,
      content_hash      TEXT,
      block_number      INTEGER NOT NULL,
      tx_hash           TEXT NOT NULL,
      indexed_at        INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE INDEX IF NOT EXISTS idx_cards_recipient ON greeting_cards(recipient);
    CREATE INDEX IF NOT EXISTS idx_cards_sender    ON greeting_cards(sender);

    -- ── Quick greetings (off-chain, low-friction social messages) ───────────
    CREATE TABLE IF NOT EXISTS quick_greetings (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      sender            TEXT NOT NULL,
      recipient         TEXT NOT NULL,
      reaction          TEXT NOT NULL,
      message           TEXT,
      created_at        INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE INDEX IF NOT EXISTS idx_quick_greetings_recipient ON quick_greetings(recipient, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_quick_greetings_sender    ON quick_greetings(sender, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_quick_greetings_pair      ON quick_greetings(sender, recipient, created_at DESC);

    -- ── Celebrations (birthday/anniversary detections) ───────────────────────
    CREATE TABLE IF NOT EXISTS celebrations (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      profile           TEXT NOT NULL,
      celebration_type  INTEGER NOT NULL,
      year              INTEGER NOT NULL,
      block_number      INTEGER NOT NULL,
      tx_hash           TEXT NOT NULL,
      indexed_at        INTEGER NOT NULL DEFAULT (unixepoch()),
      UNIQUE(profile, celebration_type, year)
    );

    CREATE INDEX IF NOT EXISTS idx_celebrations_profile ON celebrations(profile);

    -- ── Follow events (from LSP26 / FollowRegistry) ──────────────────────────
    CREATE TABLE IF NOT EXISTS follow_events (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      follower    TEXT NOT NULL,
      followed    TEXT NOT NULL,
      action      TEXT NOT NULL CHECK(action IN ('follow', 'unfollow')),
      block_number INTEGER NOT NULL,
      tx_hash     TEXT NOT NULL,
      indexed_at  INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE INDEX IF NOT EXISTS idx_follow_follower ON follow_events(follower);
    CREATE INDEX IF NOT EXISTS idx_follow_followed ON follow_events(followed);

    -- ── Drops (from DropCreated events) ─────────────────────────────────────
    CREATE TABLE IF NOT EXISTS drops (
      drop_id           TEXT PRIMARY KEY,
      host              TEXT NOT NULL,
      celebration_type  INTEGER NOT NULL,
      year              INTEGER NOT NULL DEFAULT 0,
      month             INTEGER NOT NULL,
      day               INTEGER NOT NULL,
      start_at          INTEGER NOT NULL DEFAULT 0,
      end_at            INTEGER,           -- NULL = never expires
      max_supply        INTEGER,           -- NULL = unlimited
      claimed           INTEGER NOT NULL DEFAULT 0,
      name              TEXT NOT NULL,
      image_ipfs        TEXT,
      require_follow    INTEGER NOT NULL DEFAULT 0,
      min_followers     INTEGER NOT NULL DEFAULT 0,
      required_lsp7     TEXT NOT NULL DEFAULT '[]',  -- JSON array
      required_lsp8     TEXT NOT NULL DEFAULT '[]',  -- JSON array
      block_number      INTEGER NOT NULL,
      tx_hash           TEXT NOT NULL,
      indexed_at        INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE INDEX IF NOT EXISTS idx_drops_host      ON drops(host);
    CREATE INDEX IF NOT EXISTS idx_drops_start_at  ON drops(start_at);
    CREATE INDEX IF NOT EXISTS idx_drops_end_at    ON drops(end_at);

    -- ── Drop claims (from DropClaimed events) ────────────────────────────────
    CREATE TABLE IF NOT EXISTS drop_claims (
      drop_id       TEXT NOT NULL,
      claimer       TEXT NOT NULL,
      token_id      TEXT NOT NULL,
      block_number  INTEGER NOT NULL,
      tx_hash       TEXT NOT NULL,
      indexed_at    INTEGER NOT NULL DEFAULT (unixepoch()),
      PRIMARY KEY (drop_id, claimer)
    );

    CREATE INDEX IF NOT EXISTS idx_drop_claims_claimer ON drop_claims(claimer);

    -- ── Profiles (birthday + visibility for social calendar) ─────────────────
    -- Populated by backfillProfiles worker reading ERC725Y keys from UPs.
    CREATE TABLE IF NOT EXISTS profiles (
      address         TEXT PRIMARY KEY,
      birthday_month  INTEGER,            -- NULL if not set
      birthday_day    INTEGER,
      up_created_at   INTEGER,            -- unix timestamp for anniversary calc
      birthday_vis    TEXT NOT NULL DEFAULT 'private',  -- 'public'|'followers'|'private'
      events_vis      TEXT NOT NULL DEFAULT 'private',
      notify_followers INTEGER NOT NULL DEFAULT 1,
      reminder_frequency TEXT NOT NULL DEFAULT 'monthly', -- 'monthly'|'weekly'|'daily'
      updated_at      INTEGER NOT NULL DEFAULT (unixepoch())
    );

    -- ── Local reminder sync (off-chain backup/restore) ─────────────────────
    CREATE TABLE IF NOT EXISTS synced_reminders (
      profile_address TEXT PRIMARY KEY,
      reminders_json  TEXT NOT NULL DEFAULT '[]',
      updated_at      INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_by      TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reminder_sync_challenges (
      id              TEXT PRIMARY KEY,
      profile_address TEXT NOT NULL,
      signer_address  TEXT NOT NULL,
      nonce           TEXT NOT NULL,
      message         TEXT NOT NULL,
      expires_at      INTEGER NOT NULL,
      consumed_at     INTEGER
    );

    CREATE TABLE IF NOT EXISTS reminder_sync_sessions (
      token           TEXT PRIMARY KEY,
      profile_address TEXT NOT NULL,
      signer_address  TEXT NOT NULL,
      expires_at      INTEGER NOT NULL,
      created_at      INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE INDEX IF NOT EXISTS idx_sync_sessions_profile ON reminder_sync_sessions(profile_address, expires_at);
    CREATE INDEX IF NOT EXISTS idx_sync_challenges_profile ON reminder_sync_challenges(profile_address, expires_at);

    -- ── Web Push subscriptions ───────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      endpoint        TEXT PRIMARY KEY,
      profile_address TEXT NOT NULL,
      subscription_json TEXT NOT NULL,
      user_agent      TEXT,
      created_at      INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at      INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE INDEX IF NOT EXISTS idx_push_subscriptions_profile ON push_subscriptions(profile_address);

    -- ── Drop series (community-curated recurring drops) ──────────────────────
    -- A series is a recurring event (e.g. "New Year Drop") where a different
    -- artist submits the badge image each cycle. The curator picks the winner.
    CREATE TABLE IF NOT EXISTS drop_series (
      id              TEXT PRIMARY KEY,          -- slugified name, e.g. "new-year-2026"
      name            TEXT NOT NULL,
      description     TEXT,
      celebration_type INTEGER NOT NULL DEFAULT 3,
      month           INTEGER NOT NULL,
      day             INTEGER NOT NULL,
      curator         TEXT NOT NULL,             -- UP address of series owner
      submission_open INTEGER NOT NULL DEFAULT 1, -- 1 = accepting submissions
      selected_drop_id TEXT,                     -- NULL until winner chosen + drop created
      created_at      INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at      INTEGER NOT NULL DEFAULT (unixepoch())
    );

    -- ── Series submissions (artist image proposals for an upcoming cycle) ────
    CREATE TABLE IF NOT EXISTS series_submissions (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      series_id     TEXT NOT NULL REFERENCES drop_series(id) ON DELETE CASCADE,
      artist        TEXT NOT NULL,              -- UP address of submitter
      image_ipfs    TEXT NOT NULL,              -- IPFS CID or data URI of proposed image
      message       TEXT,                       -- optional artist statement
      selected      INTEGER NOT NULL DEFAULT 0, -- 1 = curator chose this one
      submitted_at  INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE INDEX IF NOT EXISTS idx_series_curator    ON drop_series(curator);
    CREATE INDEX IF NOT EXISTS idx_submissions_series ON series_submissions(series_id);
    CREATE INDEX IF NOT EXISTS idx_submissions_artist ON series_submissions(artist);

    -- ── Series votes (community voting on submissions) ───────────────────────
    CREATE TABLE IF NOT EXISTS series_votes (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      series_id     TEXT NOT NULL,
      submission_id INTEGER NOT NULL,
      voter         TEXT NOT NULL,
      voted_at      INTEGER NOT NULL DEFAULT (unixepoch()),
      UNIQUE(series_id, voter)
    );
    CREATE INDEX IF NOT EXISTS idx_series_votes_series ON series_votes(series_id);
    CREATE INDEX IF NOT EXISTS idx_series_votes_voter  ON series_votes(voter);

    -- ── Indexer state (last processed block per listener) ────────────────────
    CREATE TABLE IF NOT EXISTS indexer_state (
      listener      TEXT PRIMARY KEY,
      last_block    INTEGER NOT NULL DEFAULT 0,
      updated_at    INTEGER NOT NULL DEFAULT (unixepoch())
    );
  `);

  runMigrations(db);
}

/**
 * Idempotent migrations — adds new columns to existing tables without
 * dropping data. Each ALTER TABLE is wrapped in try/catch so it silently
 * skips columns that already exist (SQLite does not support IF NOT EXISTS
 * on ALTER TABLE ADD COLUMN in older versions).
 */
export function runMigrations(db: Database.Database): void {
  const migrations: [string, string][] = [
    ["drop_series", "ALTER TABLE drop_series ADD COLUMN voting_deadline INTEGER"],
    ["profiles", "ALTER TABLE profiles ADD COLUMN notify_followers INTEGER NOT NULL DEFAULT 1"],
    ["profiles", "ALTER TABLE profiles ADD COLUMN reminder_frequency TEXT NOT NULL DEFAULT 'monthly'"],
  ];

  for (const [table, sql] of migrations) {
    try {
      db.exec(sql);
    } catch {
      // Column likely already exists — ignore
      void table;
    }
  }
}
