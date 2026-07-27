const Database = require('better-sqlite3')

console.log('\n============================================================')
console.log('FILA — SOLICITACOES NO PC-A')
console.log('============================================================')

{
  const db = new Database('tests/sync/databases/pc-a.db')

  console.table(
    db.prepare(`
      SELECT
        id,
        record_uuid,
        operation,
        status,
        attempts,
        last_error,
        next_attempt_at,
        created_at,
        updated_at
      FROM sync_queue
      WHERE entity = ?
      ORDER BY id
    `).all('SOLICITACAO_ALTERACAO_SENHA')
  )

  db.close()
}

for (const pc of ['pc-a', 'pc-b']) {
  console.log('\n============================================================')
  console.log(`SOLICITACOES — ${pc.toUpperCase()}`)
  console.log('============================================================')

  const db = new Database(`tests/sync/databases/${pc}.db`)

  console.table(
    db.prepare(`
      SELECT
        id,
        uuid,
        usuario_id,
        status,
        solicitado_em,
        atendido_em,
        cancelado_em,
        atendido_por,
        cancelado_por,
        updated_at
      FROM solicitacoes_alteracao_senha
      ORDER BY id
    `).all()
  )

  console.log('\nESTADO DO PULL DA SOLICITACAO')

  console.table(
    db.prepare(`
      SELECT
        entity,
        last_updated_at,
        last_uuid,
        last_success_at,
        last_error
      FROM sync_pull_state
      WHERE entity = ?
    `).all('SOLICITACAO_ALTERACAO_SENHA')
  )

  db.close()
}
