$ErrorActionPreference = "Stop"

$appRoot = (Resolve-Path (Join-Path $PSScriptRoot "../../..")).Path
$instanceRoot = Join-Path $appRoot "tests/sync/pc-a"

New-Item -ItemType Directory -Force -Path (Join-Path $instanceRoot "user-data") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $instanceRoot "config/config") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $appRoot "tests/sync/databases") | Out-Null

$env:FACTORYFLOW_TEST_INSTANCE = "PC A"
$env:FACTORYFLOW_USER_DATA_DIR = Join-Path $instanceRoot "user-data"
$env:FACTORYFLOW_CONFIG_DIR = Join-Path $instanceRoot "config"
$env:FACTORYFLOW_SQLITE_PATH = Join-Path $appRoot "tests/sync/databases/pc-a.db"

$template = Join-Path $appRoot "tests/sync/configs/pc-a.json"
$target = Join-Path $instanceRoot "config/config/config.json"
if (-not (Test-Path $target)) {
  Copy-Item $template $target
}

Set-Location $appRoot
npm run dev