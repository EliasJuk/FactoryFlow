const Database = require('better-sqlite3')
const pg = require('pg')
const { app } = require('electron')
const { existsSync } = require('node:fs')
const { resolve } = require('node:path')

const { Client } = pg
const appRoot = process.cwd()
const target = process.argv[2] ?? 'all'

const sqliteTargets = {
  'pc-a': resolve(appRoot, 'tests/sync/databases/pc-a.db'),
  'pc-b': resolve(appRoot, 'tests/sync/databases/pc-b.db')
}

function section(title) {
  console.log(`\n${'='.repeat(80)}\n${title}\n${'='.repeat(80)}`)
}

function querySafely(db, title, sql) {
  console.log(`\n${title}`)

  try {
    console.table(db.prepare(sql).all())
  } catch (error) {
    console.error(
      `Não foi possível consultar "${title}":`,
      error instanceof Error ? error.message : error
    )
  }
}

function inspectSqlite(name, dbPath) {
  section(`SQLite ${name.toUpperCase()} — ${dbPath}`)

  if (!existsSync(dbPath)) {
    console.log('Banco não encontrado.')
    return
  }

  const db = new Database(dbPath, {
    readonly: true,
    fileMustExist: true
  })

  try {
    querySafely(
      db,
      'USUÁRIOS',
      `
        SELECT id, uuid, nome, matricula, perfil, ativo, updated_at, deleted_at
        FROM usuarios
        ORDER BY updated_at, uuid
      `
    )

    querySafely(
      db,
      'ESTADO DO PULL',
      `
        SELECT entity, last_updated_at, last_uuid, last_success_at, last_error
        FROM sync_pull_state
        ORDER BY entity
      `
    )

    querySafely(
      db,
      'CONFLITOS',
      `
        SELECT
          id,
          entity,
          record_uuid,
          remote_updated_at,
          reason,
          status,
          created_at,
          resolved_at
        FROM sync_pull_conflicts
        ORDER BY id DESC
      `
    )

    querySafely(
      db,
      'RESUMO DA FILA',
      `
        SELECT entity, status, COUNT(*) AS total
        FROM sync_queue
        GROUP BY entity, status
        ORDER BY entity, status
      `
    )

    querySafely(
      db,
      'ÚLTIMOS ITENS DE USUÁRIO NA FILA',
      `
        SELECT
          id,
          entity,
          record_uuid,
          operation,
          status,
          attempts,
          max_attempts,
          last_error,
          created_at,
          updated_at
        FROM sync_queue
        WHERE entity = 'USUARIO'
        ORDER BY id DESC
        LIMIT 30
      `
    )

    querySafely(
      db,
      'ESTADO GLOBAL',
      `
        SELECT id, last_push_at, last_pull_at, last_success_at, last_error, updated_at
        FROM sync_state
      `
    )
  } finally {
    db.close()
  }
}

async function inspectPostgres() {
  section('PostgreSQL')

  const client = new Client({
    host: process.env.PGHOST ?? '127.0.0.1',
    port: Number(process.env.PGPORT ?? 5433),
    database: process.env.PGDATABASE ?? 'postgres',
    user: process.env.PGUSER ?? 'postgres',
    password: process.env.PGPASSWORD,
    ssl: false
  })

  try {
    await client.connect()

    const result = await client.query(`
      SELECT id, uuid, nome, matricula, perfil, ativo, updated_at, deleted_at
      FROM usuarios
      ORDER BY updated_at, uuid
    `)

    console.log('\nUSUÁRIOS NO POSTGRESQL')
    console.table(result.rows)
  } catch (error) {
    console.error('\nFalha ao consultar PostgreSQL:')
    console.error(error instanceof Error ? error.message : error)
    console.error('\nNo PowerShell, defina a senha assim:')
    console.error('$env:PGPASSWORD = "sua_senha"')
  } finally {
    await client.end().catch(() => undefined)
  }
}

async function main() {
  if (!['pc-a', 'pc-b', 'all'].includes(target)) {
    console.error('Uso: electron tests/sync/scripts/inspect-sync.cjs [pc-a|pc-b|all]')
    process.exitCode = 1
    return
  }

  if (target === 'all') {
    inspectSqlite('pc-a', sqliteTargets['pc-a'])
    inspectSqlite('pc-b', sqliteTargets['pc-b'])
    await inspectPostgres()
    return
  }

  inspectSqlite(target, sqliteTargets[target])
}

app.whenReady().then(async () => {
  try {
    await main()
  } catch (error) {
    console.error(
      '\nErro inesperado durante a inspeção:',
      error instanceof Error ? error.stack ?? error.message : error
    )
    process.exitCode = 1
  } finally {
    app.quit()
  }
})
