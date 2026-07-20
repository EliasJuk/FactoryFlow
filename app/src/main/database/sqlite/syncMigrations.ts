import { randomUUID } from 'crypto'
import { hostname } from 'os'

import db from '../database'

export function runSyncMigrations() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sync_installation (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      machine_uuid TEXT NOT NULL UNIQUE,
      machine_name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT NOT NULL UNIQUE,
      entity TEXT NOT NULL,
      record_uuid TEXT NOT NULL,
      operation TEXT NOT NULL,
      payload TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDENTE',
      attempts INTEGER NOT NULL DEFAULT 0,
      max_attempts INTEGER NOT NULL DEFAULT 10,
      last_error TEXT,
      next_attempt_at TEXT,
      processing_at TEXT,
      synced_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_sync_queue_status_next_attempt
    ON sync_queue(status, next_attempt_at);

    CREATE INDEX IF NOT EXISTS idx_sync_queue_record
    ON sync_queue(entity, record_uuid);

    CREATE TABLE IF NOT EXISTS sync_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      last_push_at TEXT,
      last_pull_at TEXT,
      last_success_at TEXT,
      last_error TEXT,
      remote_cursor TEXT,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `)

  const installation = db
    .prepare(
      `
        SELECT machine_uuid
        FROM sync_installation
        WHERE id = 1
      `
    )
    .get() as { machine_uuid: string } | undefined

  if (!installation) {
    db.prepare(
      `
        INSERT INTO sync_installation (
          id,
          machine_uuid,
          machine_name
        ) VALUES (1, ?, ?)
      `
    ).run(randomUUID(), hostname())
  }

  db.prepare(
    `
      INSERT OR IGNORE INTO sync_state (id)
      VALUES (1)
    `
  ).run()
}
