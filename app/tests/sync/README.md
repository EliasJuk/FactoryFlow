# Teste com duas instâncias

1. Em um terminal: `npm run test:sync:pc-a`.
2. Em outro terminal: `npm run test:sync:pc-b`.

Cada instância usa SQLite, configuração, `userData` e `machine_uuid` próprios.

Primeiro teste:
- PC A cria `SYNC TESTE A`;
- PostgreSQL recebe;
- PC B recebe pelo pull;
- PC B renomeia para `SYNC TESTE B`;
- PC A recebe a alteração.

Reset:
`npm run test:sync:reset`

**OBS:.** Usuario Defaut: 
  - Matricula: 0000
  - Senha: admin123





$env:PGPASSWORD = "12345678"  #SENHA POSTGRES
npm.cmd run test:sync:inspect