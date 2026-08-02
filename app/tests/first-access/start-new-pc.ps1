param(
  [switch]$Reset
)

$ErrorActionPreference = "Stop"

$appRoot = (
  Resolve-Path (Join-Path $PSScriptRoot "../..")
).Path

$instanceRoot = Join-Path (
  $appRoot
) "tests/first-access/pc-new"

$userDataDirectory = Join-Path (
  $instanceRoot
) "user-data"

$configDirectory = Join-Path (
  $instanceRoot
) "config-root"

$databaseDirectory = Join-Path (
  $instanceRoot
) "database"

$sqlitePath = Join-Path (
  $databaseDirectory
) "database.db"

if ($Reset -and (Test-Path $instanceRoot)) {
  Write-Host ""
  Write-Host "[FIRST ACCESS] Limpando a instancia isolada anterior..." -ForegroundColor Yellow

  try {
    Remove-Item `
      -Path $instanceRoot `
      -Recurse `
      -Force
  }
  catch {
    throw "Nao foi possivel limpar a instancia. Feche o FactoryFlow de teste e tente novamente. Detalhes: $($_.Exception.Message)"
  }
}

New-Item `
  -ItemType Directory `
  -Force `
  -Path $userDataDirectory |
  Out-Null

New-Item `
  -ItemType Directory `
  -Force `
  -Path $configDirectory |
  Out-Null

New-Item `
  -ItemType Directory `
  -Force `
  -Path $databaseDirectory |
  Out-Null

# Esta instancia e completamente separada do ambiente normal.
$env:FACTORYFLOW_USER_DATA_DIR = $userDataDirectory
$env:FACTORYFLOW_CONFIG_DIR = $configDirectory
$env:FACTORYFLOW_SQLITE_PATH = $sqlitePath

# Impede que credenciais ou identificadores dos testes PC-A/PC-B
# sejam herdados pelo assistente de primeiro acesso.
Remove-Item Env:FACTORYFLOW_TEST_INSTANCE `
  -ErrorAction SilentlyContinue

Remove-Item Env:FACTORYFLOW_TEST_POSTGRES_PASSWORD `
  -ErrorAction SilentlyContinue

Remove-Item Env:PGPASSWORD `
  -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "============================================================" -ForegroundColor DarkGray
Write-Host " FACTORYFLOW - TESTE ISOLADO DE PRIMEIRO ACESSO" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor DarkGray
Write-Host ""
Write-Host "[FIRST ACCESS] App root:   $appRoot"
Write-Host "[FIRST ACCESS] User data:  $userDataDirectory"
Write-Host "[FIRST ACCESS] Config:     $configDirectory"
Write-Host "[FIRST ACCESS] SQLite:     $sqlitePath"
Write-Host ""
Write-Host "Esta instancia nao altera:" -ForegroundColor Green
Write-Host "  - database/database.db"
Write-Host "  - config/config.json"
Write-Host "  - as credenciais protegidas do FactoryFlow normal"
Write-Host ""
Write-Host "No primeiro inicio, informe manualmente a conexao PostgreSQL" -ForegroundColor Yellow
Write-Host "na tela de Configuracao inicial."
Write-Host ""

Set-Location $appRoot

try {
  npm.cmd run dev
}
finally {
  Remove-Item Env:FACTORYFLOW_USER_DATA_DIR `
    -ErrorAction SilentlyContinue

  Remove-Item Env:FACTORYFLOW_CONFIG_DIR `
    -ErrorAction SilentlyContinue

  Remove-Item Env:FACTORYFLOW_SQLITE_PATH `
    -ErrorAction SilentlyContinue
}
