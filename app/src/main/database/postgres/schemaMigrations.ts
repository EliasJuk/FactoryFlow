import type { MigrationDatabase } from './migrations'
import { runPostgresMigrations } from './migrations'

type PostgresMigration = {
  version: number
  name: string
  up: (db: MigrationDatabase) => Promise<void>
}

const migrations: PostgresMigration[] = [
  {
    version: 1,
    name: 'baseline',
    up: runPostgresMigrations
  }
]

async function ensureSchemaMigrationsTable(db: MigrationDatabase): Promise<void> {
  await db.query(`
    CREATE TABLE IF NOT EXISTS public.schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `)
}

export async function runVersionedPostgresMigrations(db: MigrationDatabase): Promise<void> {
  await ensureSchemaMigrationsTable(db)

  const result = await db.query<{ version: number }>(`
    SELECT version
    FROM public.schema_migrations
    ORDER BY version;
  `)

  const appliedVersions = new Set(result.rows.map((row) => Number(row.version)))

  for (const migration of migrations) {
    if (appliedVersions.has(migration.version)) {
      continue
    }

    await migration.up(db)

    await db.query(
      `
        INSERT INTO public.schema_migrations (
          version,
          name
        )
        VALUES ($1, $2);
      `,
      [migration.version, migration.name]
    )
  }
}
