$ErrorActionPreference = "Stop"

$appRoot = (Resolve-Path (Join-Path $PSScriptRoot "../../..")).Path
$instanceRoot = Join-Path $appRoot "tests/sync/pc-b"

$userDataDirectory = Join-Path $instanceRoot "user-data"
$configDirectory = Join-Path $instanceRoot "config"
$configFileDirectory = Join-Path $configDirectory "config"
$databaseDirectory = Join-Path $appRoot "tests/sync/databases"

New-Item -ItemType Directory -Force -Path $userDataDirectory | Out-Null
New-Item -ItemType Directory -Force -Path $configFileDirectory | Out-Null
New-Item -ItemType Directory -Force -Path $databaseDirectory | Out-Null

$env:FACTORYFLOW_TEST_INSTANCE = "PC-B"
$env:FACTORYFLOW_USER_DATA_DIR = $userDataDirectory
$env:FACTORYFLOW_CONFIG_DIR = $configDirectory
$env:FACTORYFLOW_SQLITE_PATH = Join-Path $databaseDirectory "pc-b.db"

$template = Join-Path $appRoot "tests/sync/configs/pc-b.json"
$target = Join-Path $configFileDirectory "config.json"

if (-not (Test-Path $template)) {
  throw "O arquivo de configuracao do PC-B nao foi encontrado: $template"
}

if (-not (Test-Path $target)) {
  Copy-Item $template $target
}

if ([string]::IsNullOrWhiteSpace($env:PGPASSWORD)) {
  throw "PGPASSWORD nao foi recebida pelo PC-B."
}

# A senha generica do PostgreSQL e convertida para uma variavel
# exclusiva do bootstrap de testes. Ela nao e lida pelo connection.ts.
$env:FACTORYFLOW_TEST_POSTGRES_PASSWORD = $env:PGPASSWORD
Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "[POSTGRES TEST] PC-B"
Write-Host "[POSTGRES TEST] Host: $env:PGHOST"
Write-Host "[POSTGRES TEST] Port: $env:PGPORT"
Write-Host "[POSTGRES TEST] Database: $env:PGDATABASE"
Write-Host "[POSTGRES TEST] User: $env:PGUSER"
Write-Host "[POSTGRES TEST] Senha isolada recebida: True"
Write-Host "[POSTGRES TEST] A credencial sera protegida pelo processo principal."
Write-Host ""

Set-Location $appRoot

try {
  npm.cmd run dev
}
finally {
  Remove-Item Env:FACTORYFLOW_TEST_POSTGRES_PASSWORD -ErrorAction SilentlyContinue
}
