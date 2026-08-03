$ErrorActionPreference = "Stop"

$appRoot = (
  Resolve-Path (Join-Path $PSScriptRoot "../../..")
).Path

$configModule = Join-Path (
  $PSScriptRoot
) "../../shared/postgres-test-config.ps1"

if (-not (Test-Path $configModule)) {
  throw "O carregador do PostgreSQL de testes nao foi encontrado: $configModule"
}

. $configModule

$settings = Get-FactoryFlowPostgresTestSettings `
  -AppRoot $appRoot

Set-FactoryFlowPostgresTestEnvironment `
  -Settings $settings

$instanceRoot = Join-Path (
  $appRoot
) "tests/sync/pc-a"

$userDataDirectory = Join-Path (
  $instanceRoot
) "user-data"

$configDirectory = Join-Path (
  $instanceRoot
) "config"

$configFileDirectory = Join-Path (
  $configDirectory
) "config"

$databaseDirectory = Join-Path (
  $appRoot
) "tests/sync/databases"

New-Item `
  -ItemType Directory `
  -Force `
  -Path $userDataDirectory |
  Out-Null

New-Item `
  -ItemType Directory `
  -Force `
  -Path $configFileDirectory |
  Out-Null

New-Item `
  -ItemType Directory `
  -Force `
  -Path $databaseDirectory |
  Out-Null

$env:FACTORYFLOW_TEST_INSTANCE = "PC-A"
$env:FACTORYFLOW_USER_DATA_DIR = $userDataDirectory
$env:FACTORYFLOW_CONFIG_DIR = $configDirectory
$env:FACTORYFLOW_SQLITE_PATH = Join-Path (
  $databaseDirectory
) "pc-a.db"

$template = Join-Path (
  $appRoot
) "tests/sync/configs/pc-a.json"

$target = Join-Path (
  $configFileDirectory
) "config.json"

Write-FactoryFlowSyncInstanceConfig `
  -TemplatePath $template `
  -TargetPath $target `
  -Settings $settings

if ([string]::IsNullOrWhiteSpace($env:PGPASSWORD)) {
  throw "A senha do PostgreSQL nao foi carregada para PC-A."
}

# Somente o bootstrap seguro no processo principal do Electron
# recebe esta variavel. connection.ts continua usando SecretStorageService.
$env:FACTORYFLOW_TEST_POSTGRES_PASSWORD = (
  $env:PGPASSWORD
)

Remove-Item Env:PGPASSWORD `
  -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "[POSTGRES TEST] PC-A"
Write-Host "[POSTGRES TEST] Host: $($settings.Host)"
Write-Host "[POSTGRES TEST] Port: $($settings.Port)"
Write-Host "[POSTGRES TEST] Database: $($settings.Database)"
Write-Host "[POSTGRES TEST] User: $($settings.User)"
Write-Host "[POSTGRES TEST] Senha isolada recebida: True"
Write-Host "[POSTGRES TEST] Config da instancia: $target"
Write-Host ""

Set-Location $appRoot

try {
  npm.cmd run dev
}
finally {
  Remove-Item `
    Env:FACTORYFLOW_TEST_POSTGRES_PASSWORD `
    -ErrorAction SilentlyContinue
}
