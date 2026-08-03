$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$appRoot = (
  Resolve-Path (Join-Path $PSScriptRoot "../../..")
).Path

$configModule = Join-Path (
  $appRoot
) "tests/shared/postgres-test-config.ps1"

$templatePath = Join-Path (
  $PSScriptRoot
) "postgres-migration.json"

$runtimeRoot = Join-Path (
  $appRoot
) "tests/sync/migration-runner"

$configDirectory = Join-Path (
  $runtimeRoot
) "config"

$userDataDirectory = Join-Path (
  $runtimeRoot
) "user-data"

$databaseDirectory = Join-Path (
  $runtimeRoot
) "database"

$configFileDirectory = Join-Path (
  $configDirectory
) "config"

$configTarget = Join-Path (
  $configFileDirectory
) "config.json"

$sqlitePlaceholder = Join-Path (
  $databaseDirectory
) "migration-placeholder.db"

if (-not (Test-Path $configModule)) {
  throw @"
O carregador compartilhado do PostgreSQL de testes nao foi encontrado:
$configModule
"@
}

if (-not (Test-Path $templatePath)) {
  throw @"
O template da migration PostgreSQL nao foi encontrado:
$templatePath
"@
}

. $configModule

$settings = Get-FactoryFlowPostgresTestSettings `
  -AppRoot $appRoot

Set-FactoryFlowPostgresTestEnvironment `
  -Settings $settings

New-Item `
  -ItemType Directory `
  -Force `
  -Path $configFileDirectory |
  Out-Null

New-Item `
  -ItemType Directory `
  -Force `
  -Path $userDataDirectory |
  Out-Null

New-Item `
  -ItemType Directory `
  -Force `
  -Path $databaseDirectory |
  Out-Null

Write-FactoryFlowSyncInstanceConfig `
  -TemplatePath $templatePath `
  -TargetPath $configTarget `
  -Settings $settings

if ([string]::IsNullOrWhiteSpace($env:PGPASSWORD)) {
  throw "A senha do PostgreSQL de testes nao foi carregada."
}

# O bootstrap seguro atual aceita PC-A ou PC-B.
# Usamos uma area isolada apenas para executar as migrations.
$env:FACTORYFLOW_TEST_INSTANCE = "PC-A"
$env:FACTORYFLOW_USER_DATA_DIR = $userDataDirectory
$env:FACTORYFLOW_CONFIG_DIR = $configDirectory
$env:FACTORYFLOW_SQLITE_PATH = $sqlitePlaceholder

$env:FACTORYFLOW_TEST_POSTGRES_PASSWORD = (
  $env:PGPASSWORD
)

Remove-Item `
  Env:PGPASSWORD `
  -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "============================================================"
Write-Host "============== MIGRATIONS POSTGRESQL DE TESTES ============="
Write-Host "============================================================"
Write-Host ""
Write-Host "Host:     $($settings.Host)"
Write-Host "Porta:    $($settings.Port)"
Write-Host "Banco:    $($settings.Database)"
Write-Host "Usuario:  $($settings.User)"
Write-Host "SSL:      $($settings.Ssl)"
Write-Host ""
Write-Host "A aplicacao sera aberta temporariamente em modo PostgreSQL."
Write-Host "Aguarde a inicializacao terminar e feche a janela do FactoryFlow."
Write-Host "Depois execute a inspecao para confirmar as tabelas."
Write-Host ""

Set-Location $appRoot

$exitCode = 1

try {
  & npm.cmd run dev
  $exitCode = $LASTEXITCODE
}
finally {
  Remove-Item `
    Env:FACTORYFLOW_TEST_POSTGRES_PASSWORD `
    -ErrorAction SilentlyContinue

  Remove-Item `
    Env:FACTORYFLOW_TEST_INSTANCE `
    -ErrorAction SilentlyContinue

  Remove-Item `
    Env:FACTORYFLOW_USER_DATA_DIR `
    -ErrorAction SilentlyContinue

  Remove-Item `
    Env:FACTORYFLOW_CONFIG_DIR `
    -ErrorAction SilentlyContinue

  Remove-Item `
    Env:FACTORYFLOW_SQLITE_PATH `
    -ErrorAction SilentlyContinue

  Remove-Item `
    Env:PGHOST `
    -ErrorAction SilentlyContinue

  Remove-Item `
    Env:PGPORT `
    -ErrorAction SilentlyContinue

  Remove-Item `
    Env:PGDATABASE `
    -ErrorAction SilentlyContinue

  Remove-Item `
    Env:PGUSER `
    -ErrorAction SilentlyContinue

  Remove-Item `
    Env:FACTORYFLOW_POSTGRES_TIMEOUT_SECONDS `
    -ErrorAction SilentlyContinue

  Remove-Item `
    Env:FACTORYFLOW_POSTGRES_SSL `
    -ErrorAction SilentlyContinue
}

exit $exitCode
